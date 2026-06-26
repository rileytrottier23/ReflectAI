import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { generateCounselorReport, generateAnnualCounselorReport } from "./ai-service";
import { insertJournalEntrySchema, updateJournalEntrySchema } from "@shared/schema";
import { z } from "zod";
import rateLimit from "express-rate-limit";

function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Please log in to continue" });
}

export async function registerRoutes(app: Express): Promise<Server> {

  setupAuth(app);

  app.get("/api/journal/entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id.toString();
      const entries = await storage.getUserJournalEntries(userId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.get("/api/journal/entries/:date", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id.toString();
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

  app.post("/api/journal/entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id.toString();
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

  app.put("/api/journal/entries/:date", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id.toString();
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

  app.delete("/api/journal/entries/:date", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id.toString();
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

  app.get("/api/journal/entries/month/:year/:month", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id.toString();
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

  app.post("/api/counselor/report", isAuthenticated, aiReportLimiter, async (req: any, res) => {
    try {
      const userId = req.user.id.toString();
      const { month, year } = req.body;
      
      if (!month || !year || month < 1 || month > 12 || year < 1900 || year > 2100) {
        return res.status(400).json({ message: "Please select a valid month and year" });
      }
      
      const entries = await storage.getUserJournalEntriesByMonth(userId, year, month);
      
      const report = await generateCounselorReport(entries, month, year);
      
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "We couldn't generate your report right now. Please try again" });
    }
  });

  app.post("/api/counselor/annual-report", isAuthenticated, aiReportLimiter, async (req: any, res) => {
    try {
      const userId = req.user.id.toString();
      const { year } = req.body;

      if (!year || year < 1900 || year > 2100) {
        return res.status(400).json({ message: "Please select a valid year" });
      }

      const entries = await storage.getUserJournalEntriesByYear(userId, year);

      const report = await generateAnnualCounselorReport(entries, year);

      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "We couldn't generate your annual report right now. Please try again" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
