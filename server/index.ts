import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import { auth, ensureAuthTables } from "./auth";
import { ensureMcpTokenTable } from "./mcp-tokens";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Railway terminates TLS at its edge and forwards X-Forwarded-Proto; without
// trusting the proxy, req.protocol always reports "http" here, which leaked
// into the OAuth discovery doc and WWW-Authenticate header as http:// URLs.
app.set("trust proxy", 1);

// The Content Security Policy only applies in production: Vite's dev server
// injects inline scripts and a websocket that a strict policy would block.
const isProduction = process.env.NODE_ENV === "production";
app.use(helmet({
  contentSecurityPolicy: isProduction
    ? {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'"],
          // UI components set inline style attributes; Google Fonts CSS is external.
          "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
          // Google profile pictures come from googleusercontent.com.
          "img-src": ["'self'", "data:", "https:"],
          "connect-src": ["'self'"],
          "frame-ancestors": ["'none'"],
          "object-src": ["'none'"],
          "base-uri": ["'self'"],
          // The OAuth consent form redirects to Claude after submit, and
          // form-action also governs redirects, so leave it unrestricted.
          "form-action": null,
        },
      }
    : false,
  crossOriginEmbedderPolicy: false,
}));

// Better Auth reads the raw request body itself, so it must be mounted
// BEFORE the body parsers.
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Log method, path, status and timing only. Response bodies are never logged,
// because API responses carry journal text.
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms`);
    }
  });
  next();
});

(async () => {
  await ensureAuthTables();
  await ensureMcpTokenTable();
  const server = await registerRoutes(app);

  // Client errors (4xx, e.g. malformed JSON) keep their message; anything
  // else is logged here and the user gets a generic message, so internal
  // details such as database errors never reach the browser.
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) {
      console.error(err);
    }
    if (res.headersSent) return;
    const message = status < 500 && err.expose !== false && err.message
      ? err.message
      : "Something went wrong. Please try again";
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve both the API and the client on one port. Reads PORT so the
  // platform's proxy can reach it (Railway assigns its own); 5000 is a
  // fallback for local dev only, not a firewall requirement like on Replit.
  const port = Number(process.env.PORT) || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
