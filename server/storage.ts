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
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import {
  decryptField,
  encryptField,
  entryContext,
  reportAnalysisContext,
  reportRecommendationsContext,
} from "./field-crypto";

// Journal text and AI reports are encrypted at rest (see field-crypto.ts).
// Everything above this file sees plain text; everything below sees ciphertext.
function decryptEntry(entry: JournalEntry): JournalEntry {
  return { ...entry, content: decryptField(entry.content, entryContext(entry.userId)) };
}

function decryptReport(report: SavedReport): SavedReport {
  return {
    ...report,
    detailedAnalysis: decryptField(report.detailedAnalysis, reportAnalysisContext(report.userId)),
    recommendations: report.recommendations.map((r) =>
      decryptField(r, reportRecommendationsContext(report.userId)),
    ),
  };
}

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
  searchJournalEntries(userId: string, query: string, limit: number): Promise<JournalEntry[]>;
  getJournalEntriesInRange(userId: string, startDate: string, endDate: string): Promise<JournalEntry[]>;
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
    return entry ? decryptEntry(entry) : undefined;
  }

  async getUserJournalEntries(userId: string): Promise<JournalEntry[]> {
    const rows = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, parseInt(userId)))
      .orderBy(desc(journalEntries.date));
    return rows.map(decryptEntry);
  }

  async createJournalEntry(userId: string, entry: InsertJournalEntry): Promise<JournalEntry> {
    const uid = parseInt(userId);
    const [newEntry] = await db
      .insert(journalEntries)
      .values({
        ...entry,
        content: encryptField(entry.content, entryContext(uid)),
        userId: uid,
      })
      .returning();
    return decryptEntry(newEntry);
  }

  async updateJournalEntry(userId: string, date: string, entry: UpdateJournalEntry): Promise<JournalEntry> {
    const uid = parseInt(userId);
    const changes: UpdateJournalEntry = { ...entry };
    if (changes.content !== undefined) {
      changes.content = encryptField(changes.content, entryContext(uid));
    }
    const [updatedEntry] = await db
      .update(journalEntries)
      .set({ ...changes, updatedAt: new Date() })
      .where(and(eq(journalEntries.userId, uid), eq(journalEntries.date, date)))
      .returning();
    return updatedEntry ? decryptEntry(updatedEntry) : updatedEntry;
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
    
    const rows = await db
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
    return rows.map(decryptEntry);
  }

  async getUserJournalEntriesByYear(userId: string, year: number): Promise<JournalEntry[]> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const rows = await db
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
    return rows.map(decryptEntry);
  }

  // Entry text is encrypted, so the database can't search it. Entries are
  // decrypted and filtered here instead; fine for a personal journal's size.
  async searchJournalEntries(userId: string, query: string, limit: number): Promise<JournalEntry[]> {
    const needle = query.toLocaleLowerCase();
    const entries = await this.getUserJournalEntries(userId);
    return entries
      .filter((e) => e.content.toLocaleLowerCase().includes(needle))
      .slice(0, limit);
  }

  async getJournalEntriesInRange(userId: string, startDate: string, endDate: string): Promise<JournalEntry[]> {
    const rows = await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, parseInt(userId)),
          gte(journalEntries.date, startDate),
          lte(journalEntries.date, endDate)
        )
      )
      .orderBy(desc(journalEntries.date));
    return rows.map(decryptEntry);
  }

  async saveReport(userId: string, type: 'monthly' | 'annual', month: number | null, year: number, plainRecommendations: string[], score: number, plainAnalysis: string): Promise<SavedReport> {
    const uid = parseInt(userId);
    const recommendations = plainRecommendations.map((r) =>
      encryptField(r, reportRecommendationsContext(uid)),
    );
    const detailedAnalysis = encryptField(plainAnalysis, reportAnalysisContext(uid));
    const [report] = await db
      .insert(savedReports)
      .values({
        userId: uid,
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
    return decryptReport(report);
  }

  async getSavedReports(userId: string, type: 'monthly' | 'annual'): Promise<SavedReport[]> {
    const rows = await db
      .select()
      .from(savedReports)
      .where(and(eq(savedReports.userId, parseInt(userId)), eq(savedReports.type, type)))
      .orderBy(desc(savedReports.createdAt));
    return rows.map(decryptReport);
  }
}

export const storage = new DatabaseStorage();