import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth } from "./middlewares/requireAuth";
import { generateCounselorReport, generateAnnualCounselorReport } from "./ai-service";
import { insertJournalEntrySchema, updateJournalEntrySchema } from "@shared/schema";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { handleMcpRequest } from "./mcp";
import { createOAuthRouter } from "./oauth";

export async function registerRoutes(app: Express): Promise<Server> {

  // OAuth 2.0 endpoints (for Claude MCP connector)
  app.use(createOAuthRouter());

  app.get("/api/user", requireAuth, async (req: any, res) => {
    res.json({ id: req.dbUser.id, email: req.dbUser.email });
  });

  app.get("/api/journal/entries", requireAuth, async (req: any, res) => {
    try {
      const userId = req.dbUser.id.toString();
      const entries = await storage.getUserJournalEntries(userId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.get("/api/journal/entries/:date", requireAuth, async (req: any, res) => {
    try {
      const userId = req.dbUser.id.toString();
      const { date } = req.params;
      
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) {
        return res.status(400).json({ message: "Please select a valid date" });
      }
      
      const entry = await storage.getJournalEntry(userId, date);
      
      if (!entry) {
        return res.status(404).json({ message: "No journal entry found for this date" });
      }
      
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "We couldn't load your journal entry. Please try again" });
    }
  });

  app.post("/api/journal/entries", requireAuth, async (req: any, res) => {
    try {
      const userId = req.dbUser.id.toString();
      const validatedData = insertJournalEntrySchema.parse(req.body);
      
      const existingEntry = await storage.getJournalEntry(userId, validatedData.date);
      if (existingEntry) {
        return res.status(400).json({ message: "You already have a journal entry for this date" });
      }
      
      const entry = await storage.createJournalEntry(userId, validatedData);
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Please check your journal entry and try again", errors: error.errors });
      }
      res.status(500).json({ message: "We couldn't save your journal entry. Please try again" });
    }
  });

  app.put("/api/journal/entries/:date", requireAuth, async (req: any, res) => {
    try {
      const userId = req.dbUser.id.toString();
      const { date } = req.params;
      
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) {
        return res.status(400).json({ message: "Please select a valid date" });
      }
      
      const validatedData = updateJournalEntrySchema.parse(req.body);
      
      const entry = await storage.updateJournalEntry(userId, date, validatedData);
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Please check your journal entry and try again", errors: error.errors });
      }
      res.status(500).json({ message: "We couldn't update your journal entry. Please try again" });
    }
  });

  app.delete("/api/journal/entries/:date", requireAuth, async (req: any, res) => {
    try {
      const userId = req.dbUser.id.toString();
      const { date } = req.params;
      
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) {
        return res.status(400).json({ message: "Please select a valid date" });
      }
      
      await storage.deleteJournalEntry(userId, date);
      res.json({ message: "Your journal entry has been deleted" });
    } catch (error) {
      res.status(500).json({ message: "We couldn't delete your journal entry. Please try again" });
    }
  });

  app.get("/api/journal/entries/month/:year/:month", requireAuth, async (req: any, res) => {
    try {
      const userId = req.dbUser.id.toString();
      const { year, month } = req.params;
      
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
        return res.status(400).json({ message: "Please select a valid month and year" });
      }
      
      const entries = await storage.getUserJournalEntriesByMonth(userId, yearNum, monthNum);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "We couldn't load your journal entries. Please try again" });
    }
  });

  const aiReportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { message: "You've generated too many reports recently. Please try again in an hour" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get("/api/counselor/reports/monthly", requireAuth, async (req: any, res) => {
    try {
      const userId = req.dbUser.id.toString();
      const reports = await storage.getSavedReports(userId, 'monthly');
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "We couldn't load your saved reports. Please try again" });
    }
  });

  app.get("/api/counselor/reports/annual", requireAuth, async (req: any, res) => {
    try {
      const userId = req.dbUser.id.toString();
      const reports = await storage.getSavedReports(userId, 'annual');
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "We couldn't load your saved reports. Please try again" });
    }
  });

  app.post("/api/counselor/report", requireAuth, aiReportLimiter, async (req: any, res) => {
    try {
      const userId = req.dbUser.id.toString();
      const { month, year } = req.body;
      
      if (!month || !year || month < 1 || month > 12 || year < 1900 || year > 2100) {
        return res.status(400).json({ message: "Please select a valid month and year" });
      }
      
      const entries = await storage.getUserJournalEntriesByMonth(userId, year, month);
      const report = await generateCounselorReport(entries, month, year);

      await storage.saveReport(userId, 'monthly', month, year, report.recommendations, report.monthlyScore, report.detailedAnalysis);

      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "We couldn't generate your report right now. Please try again" });
    }
  });

  app.post("/api/counselor/annual-report", requireAuth, aiReportLimiter, async (req: any, res) => {
    try {
      const userId = req.dbUser.id.toString();
      const { year } = req.body;

      if (!year || year < 1900 || year > 2100) {
        return res.status(400).json({ message: "Please select a valid year" });
      }

      const entries = await storage.getUserJournalEntriesByYear(userId, year);
      const report = await generateAnnualCounselorReport(entries, year);

      await storage.saveReport(userId, 'annual', null, year, report.recommendations, report.annualScore, report.detailedAnalysis);

      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "We couldn't generate your annual report right now. Please try again" });
    }
  });

  // ── MCP endpoint (/mcp) ────────────────────────────────────────────────────
  // Auth: Bearer token in Authorization header (MCP_TOKEN secret)
  // User identity: looks up the local user row by MCP_USER_EMAIL secret
  const mcpAuthMiddleware = async (req: any, res: any, next: any) => {
    const token = process.env.MCP_TOKEN;
    if (!token) {
      return res.status(503).json({ error: "MCP_TOKEN secret not configured" });
    }
    const auth = req.headers["authorization"];
    if (!auth || auth !== `Bearer ${token}`) {
      const base = `${req.protocol}://${req.headers.host}`;
      res.setHeader(
        "WWW-Authenticate",
        `Bearer realm="ReflectAI Journal", resource_metadata="${base}/.well-known/oauth-authorization-server"`
      );
      return res.status(401).json({ error: "Unauthorized" });
    }
    // Resolve the user this MCP server belongs to
    const email = process.env.MCP_USER_EMAIL;
    if (!email) {
      return res.status(503).json({ error: "MCP_USER_EMAIL secret not configured" });
    }
    let user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: `No account found for MCP_USER_EMAIL (${email}). Sign in to the app first.` });
    }
    req.mcpUserId = user.id.toString();
    next();
  };

  app.post("/mcp", mcpAuthMiddleware, async (req, res) => {
    try {
      await handleMcpRequest(req, res);
    } catch (err) {
      console.error("[mcp] unhandled error", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal MCP error" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
