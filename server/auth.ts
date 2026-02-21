import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import MemoryStore from "memorystore";
import rateLimit from "express-rate-limit";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

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

const loginFailures = new Map<string, { count: number; lockedUntil: number | null }>();

function checkAccountLockout(email: string): boolean {
  const record = loginFailures.get(email.toLowerCase());
  if (!record) return false;
  if (record.lockedUntil && Date.now() < record.lockedUntil) return true;
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    loginFailures.delete(email.toLowerCase());
    return false;
  }
  return false;
}

function recordLoginFailure(email: string): void {
  const key = email.toLowerCase();
  const record = loginFailures.get(key) || { count: 0, lockedUntil: null };
  record.count++;
  if (record.count >= 10) {
    record.lockedUntil = Date.now() + 60 * 60 * 1000;
    record.count = 0;
  }
  loginFailures.set(key, record);
}

function clearLoginFailures(email: string): void {
  loginFailures.delete(email.toLowerCase());
}

export function setupAuth(app: Express) {
  const MemStore = MemoryStore(session);

  if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = randomBytes(32).toString('hex');
    console.warn('WARNING: SESSION_SECRET not set. Generated a random secret. Set SESSION_SECRET in environment variables for production.');
  }
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MemStore({
      checkPeriod: 86400000,
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    },
    name: '__reflectai_sid',
    rolling: true,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id.toString());
      if (user) {
        const { password, ...safeUser } = user;
        done(null, safeUser as SelectUser);
      } else {
        done(null, undefined);
      }
    } catch (error) {
      done(error);
    }
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { message: "Too many attempts. Please try again in a few minutes" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { message: "Too many accounts created. Please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.post("/api/register", registerLimiter, async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Please enter both your email and password" });
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please check your email address format" });
      }

      if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Unable to create account. Please try a different email or sign in" });
      }

      const user = await storage.createUser({
        email,
        password: await hashPassword(password),
      });

      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        res.status(201).json({ id: user.id, email: user.email });
      });
    } catch (error) {
      res.status(500).json({ message: "We couldn't create your account right now. Please try again" });
    }
  });

  app.post("/api/login", authLimiter, (req, res, next) => {
    const email = req.body?.email;
    if (email && checkAccountLockout(email)) {
      return res.status(429).json({ message: "This account is temporarily locked due to too many failed attempts. Please try again later" });
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Something went wrong during login. Please try again" });
      }
      if (!user) {
        if (email) recordLoginFailure(email);
        return res.status(401).json({ message: "Your email or password is incorrect" });
      }
      if (email) clearLoginFailures(email);
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "We couldn't log you in right now. Please try again" });
        }
        res.status(200).json({ id: user.id, email: user.email });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req: any, res: any, next: any) => {
    req.logout((err: any) => {
      if (err) {
        return next(err);
      }
      req.session.destroy((err: any) => {
        if (err) {
          return next(err);
        }
        res.clearCookie('__reflectai_sid');
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json({ id: req.user!.id, email: req.user!.email });
  });
}
