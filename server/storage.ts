import {
  users,
  journalEntries,
  type User,
  type UpsertUser,
  type JournalEntry,
  type InsertJournalEntry,
  type UpdateJournalEntry,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Journal operations
  getJournalEntry(userId: string, date: string): Promise<JournalEntry | undefined>;
  getUserJournalEntries(userId: string): Promise<JournalEntry[]>;
  createJournalEntry(userId: string, entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(userId: string, date: string, entry: UpdateJournalEntry): Promise<JournalEntry>;
  deleteJournalEntry(userId: string, date: string): Promise<void>;
  getUserJournalEntriesByMonth(userId: string, year: number, month: number): Promise<JournalEntry[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Journal operations
  async getJournalEntry(userId: string, date: string): Promise<JournalEntry | undefined> {
    const [entry] = await db
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.userId, userId), eq(journalEntries.date, date)));
    return entry;
  }

  async getUserJournalEntries(userId: string): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.date));
  }

  async createJournalEntry(userId: string, entry: InsertJournalEntry): Promise<JournalEntry> {
    const [newEntry] = await db
      .insert(journalEntries)
      .values({
        ...entry,
        userId,
      })
      .returning();
    return newEntry;
  }

  async updateJournalEntry(userId: string, date: string, entry: UpdateJournalEntry): Promise<JournalEntry> {
    const [updatedEntry] = await db
      .update(journalEntries)
      .set({
        ...entry,
        updatedAt: new Date(),
      })
      .where(and(eq(journalEntries.userId, userId), eq(journalEntries.date, date)))
      .returning();
    return updatedEntry;
  }

  async deleteJournalEntry(userId: string, date: string): Promise<void> {
    await db
      .delete(journalEntries)
      .where(and(eq(journalEntries.userId, userId), eq(journalEntries.date, date)));
  }

  async getUserJournalEntriesByMonth(userId: string, year: number, month: number): Promise<JournalEntry[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate(); // Get last day of month
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    return await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, userId),
          gte(journalEntries.date, startDate),
          lte(journalEntries.date, endDate)
        )
      )
      .orderBy(desc(journalEntries.date));
  }
}

export const storage = new DatabaseStorage();
