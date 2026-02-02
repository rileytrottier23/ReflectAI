import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import pgSession from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import { Pool } from "@neondatabase/serverless";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// In-memory login attempt tracking for account lockout
const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil?: number }>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkAccountLockout(email: string): { locked: boolean; remainingTime?: number } {
  const attempts = loginAttempts.get(email.toLowerCase());
  if (!attempts) return { locked: false };
  
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    const remainingTime = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
    return { locked: true, remainingTime };
  }
  
  // Reset if window has passed
  if (Date.now() - attempts.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.delete(email.toLowerCase());
    return { locked: false };
  }
  
  return { locked: false };
}

function recordFailedLogin(email: string): void {
  const normalizedEmail = email.toLowerCase();
  const attempts = loginAttempts.get(normalizedEmail) || { count: 0, lastAttempt: 0 };
  
  attempts.count++;
  attempts.lastAttempt = Date.now();
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCKOUT_DURATION;
  }
  
  loginAttempts.set(normalizedEmail, attempts);
}

function clearFailedLogins(email: string): void {
  loginAttempts.delete(email.toLowerCase());
}

// Password complexity validation
function validatePasswordComplexity(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  if (password.length > 128) {
    return { valid: false, message: "Password cannot exceed 128 characters" };
  }
  return { valid: true };
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Rate limiters for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: { message: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: { message: "Too many accounts created. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

export function setupAuth(app: Express) {
  // Validate required environment variable
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set for session storage");
  }
  
  // Use PostgreSQL for session storage (persistent and secure)
  const PgStore = pgSession(session);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  // Handle pool errors gracefully
  pool.on('error', (err) => {
    console.error('Session store pool error:', err);
  });
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    store: new PgStore({
      pool: pool as any,
      tableName: 'sessions',
      createTableIfMissing: false, // Table already exists in schema
      pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
      errorLog: console.error.bind(console),
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      sameSite: 'lax',
    },
    name: 'connect.sid',
    rolling: true,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        // Check account lockout
        const lockout = checkAccountLockout(email);
        if (lockout.locked) {
          return done(null, false, { message: `Account temporarily locked. Try again in ${lockout.remainingTime} minutes.` });
        }
        
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          recordFailedLogin(email);
          return done(null, false);
        }
        
        // Clear failed attempts on successful login
        clearFailedLogins(email);
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id.toString());
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", registerLimiter, async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: "Please enter both your email and password" });
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please check your email address format" });
      }
      
      // Validate email length
      if (email.length > 255) {
        return res.status(400).json({ message: "Email address is too long" });
      }
      
      // Password complexity validation
      const passwordCheck = validatePasswordComplexity(password);
      if (!passwordCheck.valid) {
        return res.status(400).json({ message: passwordCheck.message });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      const user = await storage.createUser({
        email: email.toLowerCase().trim(),
        password: await hashPassword(password),
      });

      req.login(user, (err) => {
        if (err) {
          console.error('Login error after registration:', err);
          return next(err);
        }
        res.status(201).json({ id: user.id, email: user.email });
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "We couldn't create your account right now. Please try again" });
    }
  });

  app.post("/api/login", authLimiter, (req, res, next) => {
    const { email } = req.body;
    
    // Check account lockout before attempting auth
    if (email) {
      const lockout = checkAccountLockout(email);
      if (lockout.locked) {
        return res.status(429).json({ 
          message: `Account temporarily locked due to too many failed attempts. Please try again in ${lockout.remainingTime} minutes.` 
        });
      }
    }
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error('Login authentication error:', err);
        return res.status(500).json({ message: "Something went wrong during login. Please try again" });
      }
      if (!user) {
        return res.status(401).json({ message: "Your email or password is incorrect" });
      }
      req.login(user, (err) => {
        if (err) {
          console.error('Login session error:', err);
          return res.status(500).json({ message: "We couldn't log you in right now. Please try again" });
        }
        res.status(200).json({ id: user.id, email: user.email });
      });
    })(req, res, next);
  });

  const logoutHandler = (req: any, res: any, next: any) => {
    req.logout((err: any) => {
      if (err) {
        console.error('Logout error:', err);
        return next(err);
      }
      req.session.destroy((err: any) => {
        if (err) {
          console.error('Session destroy error:', err);
          return next(err);
        }
        res.clearCookie('connect.sid');
        res.sendStatus(200);
      });
    });
  };

  app.post("/api/logout", logoutHandler);
  app.get("/api/logout", logoutHandler);

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json({ id: req.user!.id, email: req.user!.email });
  });
}
