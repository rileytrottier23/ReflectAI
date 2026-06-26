import {
  users,
  journalEntries,
  savedReports,
  type User,
  type InsertUser,
  type JournalEntry,
  type InsertJournalEntry,
  type UpdateJournalEntry,
  type SavedReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Journal operations
  getJournalEntry(userId: string, date: string): Promise<JournalEntry | undefined>;
  getUserJournalEntries(userId: string): Promise<JournalEntry[]>;
  createJournalEntry(userId: string, entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(userId: string, date: string, entry: UpdateJournalEntry): Promise<JournalEntry>;
  deleteJournalEntry(userId: string, date: string): Promise<void>;
  getUserJournalEntriesByMonth(userId: string, year: number, month: number): Promise<JournalEntry[]>;
  getUserJournalEntriesByYear(userId: string, year: number): Promise<JournalEntry[]>;
  // Saved report operations
  saveReport(userId: string, type: 'monthly' | 'annual', month: number | null, year: number, recommendations: string[], score: number, detailedAnalysis: string): Promise<SavedReport>;
  getSavedReports(userId: string, type: 'monthly' | 'annual'): Promise<SavedReport[]>;
}

export class DatabaseStorage implements IStorage {
  constructor() {}

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, parseInt(id)));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Journal operations
  async getJournalEntry(userId: string, date: string): Promise<JournalEntry | undefined> {
    const [entry] = await db
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.userId, parseInt(userId)), eq(journalEntries.date, date)));
    return entry;
  }

  async getUserJournalEntries(userId: string): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, parseInt(userId)))
      .orderBy(desc(journalEntries.date));
  }

  async createJournalEntry(userId: string, entry: InsertJournalEntry): Promise<JournalEntry> {
    const [newEntry] = await db
      .insert(journalEntries)
      .values({
        ...entry,
        userId: parseInt(userId),
      })
      .returning();
    return newEntry;
  }

  async updateJournalEntry(userId: string, date: string, entry: UpdateJournalEntry): Promise<JournalEntry> {
    const [updatedEntry] = await db
      .update(journalEntries)
      .set({ ...entry, updatedAt: new Date() })
      .where(and(eq(journalEntries.userId, parseInt(userId)), eq(journalEntries.date, date)))
      .returning();
    return updatedEntry;
  }

  async deleteJournalEntry(userId: string, date: string): Promise<void> {
    await db
      .delete(journalEntries)
      .where(and(eq(journalEntries.userId, parseInt(userId)), eq(journalEntries.date, date)));
  }

  async getUserJournalEntriesByMonth(userId: string, year: number, month: number): Promise<JournalEntry[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    return await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, parseInt(userId)),
          sql`date >= ${startDate}`,
          sql`date <= ${endDate}`
        )
      )
      .orderBy(desc(journalEntries.date));
  }

  async getUserJournalEntriesByYear(userId: string, year: number): Promise<JournalEntry[]> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    return await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, parseInt(userId)),
          sql`date >= ${startDate}`,
          sql`date <= ${endDate}`
        )
      )
      .orderBy(desc(journalEntries.date));
  }

  async saveReport(userId: string, type: 'monthly' | 'annual', month: number | null, year: number, recommendations: string[], score: number, detailedAnalysis: string): Promise<SavedReport> {
    const [report] = await db
      .insert(savedReports)
      .values({
        userId: parseInt(userId),
        type,
        month,
        year,
        recommendations,
        score,
        detailedAnalysis,
      })
      .onConflictDoUpdate({
        target: [savedReports.userId, savedReports.type, savedReports.month, savedReports.year],
        set: {
          recommendations,
          score,
          detailedAnalysis,
          createdAt: new Date(),
        },
      })
      .returning();
    return report;
  }

  async getSavedReports(userId: string, type: 'monthly' | 'annual'): Promise<SavedReport[]> {
    return await db
      .select()
      .from(savedReports)
      .where(and(eq(savedReports.userId, parseInt(userId)), eq(savedReports.type, type)))
      .orderBy(desc(savedReports.createdAt));
  }
}

export const storage = new DatabaseStorage();