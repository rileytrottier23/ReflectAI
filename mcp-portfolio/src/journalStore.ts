/**
 * JournalStore — the only interface the MCP layer touches.
 *
 * Swap in any backing store (SQLite, Postgres, flat-file) by implementing
 * this interface and passing it to createMcpServer(). The in-memory
 * implementation below is the reference for local development and testing.
 */

export interface JournalEntry {
  id: number;
  date: string;           // YYYY-MM-DD
  content: string;
  happinessScore: number; // 1–10
}

export interface CreateEntryInput {
  content: string;
  happinessScore: number;
  date: string;
}

export interface UpdateEntryInput {
  content?: string;
  happinessScore?: number;
}

export interface JournalStore {
  /** Return the entry for a specific date, or undefined if none exists. */
  getEntry(userId: string, date: string): Promise<JournalEntry | undefined>;

  /** Return all entries newest-first. */
  listRecent(userId: string, limit: number): Promise<JournalEntry[]>;

  /** Create a new entry. Throws if one already exists for that date. */
  createEntry(userId: string, input: CreateEntryInput): Promise<JournalEntry>;

  /** Update selected fields on an existing entry. */
  updateEntry(userId: string, date: string, input: UpdateEntryInput): Promise<JournalEntry | undefined>;

  /** Permanently delete an entry. Returns whether an entry was removed. */
  deleteEntry(userId: string, date: string): Promise<boolean>;

  /** Case-insensitive keyword search on content, newest-first. */
  searchEntries(userId: string, query: string, limit: number): Promise<JournalEntry[]>;

  /** Return entries with date >= startDate and <= endDate, newest-first. */
  getEntriesInRange(userId: string, startDate: string, endDate: string): Promise<JournalEntry[]>;
}

// ── In-memory reference implementation ───────────────────────────────────────

export class InMemoryJournalStore implements JournalStore {
  private store = new Map<string, Map<string, JournalEntry>>(); // userId → date → entry
  private nextId = 1;

  private userStore(userId: string): Map<string, JournalEntry> {
    if (!this.store.has(userId)) this.store.set(userId, new Map());
    return this.store.get(userId)!;
  }

  async getEntry(userId: string, date: string): Promise<JournalEntry | undefined> {
    return this.userStore(userId).get(date);
  }

  async listRecent(userId: string, limit: number): Promise<JournalEntry[]> {
    return [...this.userStore(userId).values()]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  }

  async createEntry(userId: string, input: CreateEntryInput): Promise<JournalEntry> {
    const us = this.userStore(userId);
    if (us.has(input.date)) {
      throw new Error(`Entry already exists for ${input.date}`);
    }
    const entry: JournalEntry = { id: this.nextId++, ...input };
    us.set(input.date, entry);
    return entry;
  }

  async updateEntry(userId: string, date: string, input: UpdateEntryInput): Promise<JournalEntry | undefined> {
    const entry = this.userStore(userId).get(date);
    if (!entry) return undefined;
    Object.assign(entry, input);
    return entry;
  }

  async deleteEntry(userId: string, date: string): Promise<boolean> {
    return this.userStore(userId).delete(date);
  }

  async searchEntries(userId: string, query: string, limit: number): Promise<JournalEntry[]> {
    const lower = query.toLowerCase();
    return [...this.userStore(userId).values()]
      .filter(e => e.content.toLowerCase().includes(lower))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  }

  async getEntriesInRange(userId: string, startDate: string, endDate: string): Promise<JournalEntry[]> {
    return [...this.userStore(userId).values()]
      .filter(e => e.date >= startDate && e.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  }
}
