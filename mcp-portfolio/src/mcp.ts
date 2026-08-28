/**
 * MCP server — 5 tools for reading and writing journal entries.
 *
 * Transport: Streamable HTTP (stateless, one session per request).
 * Each request creates a fresh McpServer bound to a JournalStore and a userId.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import type { Request, Response } from "express";
import type { JournalStore } from "./journalStore.js";

function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function createMcpServer(store: JournalStore, userId: string): McpServer {
  const server = new McpServer({ name: "journal-mcp-server", version: "1.0.0" });

  // ── Tool: create_entry ────────────────────────────────────────────────────
  server.tool(
    "create_entry",
    "Create a new journal entry. One entry per calendar day is allowed. " +
    "If an entry already exists for that date, this will fail — ask the user to clarify before retrying.",
    {
      content: z
        .string()
        .min(1)
        .max(10000)
        .describe("The journal entry text"),
      happiness_score: z
        .number()
        .int()
        .min(1)
        .max(10)
        .describe("Happiness score from 1 (very low) to 10 (excellent)"),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe("Date in YYYY-MM-DD format, defaults to today if omitted"),
    },
    async ({ content, happiness_score, date }) => {
      const entryDate = date ?? todayDate();
      const existing = await store.getEntry(userId, entryDate);
      if (existing) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `An entry already exists for ${entryDate} (happiness: ${existing.happinessScore}/10). ` +
                    `Ask the user whether they'd like to replace or amend it.`,
            },
          ],
        };
      }
      const entry = await store.createEntry(userId, {
        content,
        happinessScore: happiness_score,
        date: entryDate,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `✓ Created journal entry for ${entry.date} (happiness: ${entry.happinessScore}/10).`,
          },
        ],
      };
    }
  );

  // ── Tool: update_entry ────────────────────────────────────────────────────
  server.tool(
    "update_entry",
    "Edit an existing journal entry. You can change its content, happiness score, or both. " +
    "The date identifies the entry and cannot be changed.",
    {
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Date of the entry to edit (YYYY-MM-DD)"),
      content: z
        .string()
        .min(1)
        .max(10000)
        .optional()
        .describe("Replacement journal entry text"),
      happiness_score: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .describe("Replacement happiness score from 1 (very low) to 10 (excellent)"),
    },
    async ({ date, content, happiness_score }) => {
      if (content === undefined && happiness_score === undefined) {
        return {
          isError: true,
          content: [
            { type: "text" as const, text: "Provide content, happiness_score, or both to update the entry." },
          ],
        };
      }

      const existing = await store.getEntry(userId, date);
      if (!existing) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `No journal entry found for ${date}.` }],
        };
      }

      const changes: { content?: string; happinessScore?: number } = {};
      if (content !== undefined) changes.content = content;
      if (happiness_score !== undefined) changes.happinessScore = happiness_score;

      const updated = await store.updateEntry(userId, date, changes);
      if (!updated) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `No journal entry found for ${date}.` }],
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: `✓ Updated journal entry for ${updated.date} (happiness: ${updated.happinessScore}/10).`,
          },
        ],
      };
    }
  );

  // ── Tool: delete_entry ────────────────────────────────────────────────────
  server.tool(
    "delete_entry",
    "Permanently remove an existing journal entry. Ask the user for confirmation before calling this tool.",
    {
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Date of the entry to remove (YYYY-MM-DD)"),
      confirm: z
        .literal("DELETE")
        .describe("Must be exactly DELETE, supplied only after the user explicitly confirms permanent deletion"),
    },
    async ({ date }) => {
      const existing = await store.getEntry(userId, date);
      if (!existing) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `No journal entry found for ${date}.` }],
        };
      }

      await store.deleteEntry(userId, date);
      return {
        content: [
          { type: "text" as const, text: `✓ Deleted journal entry for ${date}.` },
        ],
      };
    }
  );

  // ── Tool: list_recent_entries ─────────────────────────────────────────────
  server.tool(
    "list_recent_entries",
    "List the most recent journal entries, newest first.",
    {
      count: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(5)
        .describe("Number of entries to return (default 5, max 50)"),
    },
    async ({ count }) => {
      const entries = await store.listRecent(userId, count);
      if (entries.length === 0) {
        return {
          content: [{ type: "text" as const, text: "No journal entries found." }],
        };
      }
      const text = entries
        .map((e) => `[${e.date}] Happiness: ${e.happinessScore}/10\n${e.content}`)
        .join("\n\n---\n\n");
      return { content: [{ type: "text" as const, text }] };
    }
  );

  // ── Tool: get_entry ───────────────────────────────────────────────────────
  server.tool(
    "get_entry",
    "Fetch a single journal entry by date.",
    {
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Date in YYYY-MM-DD format, e.g. 2026-08-13"),
    },
    async ({ date }) => {
      const entry = await store.getEntry(userId, date);
      if (!entry) {
        return {
          isError: true,
          content: [
            { type: "text" as const, text: `No journal entry found for ${date}.` },
          ],
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: `[${entry.date}] Happiness: ${entry.happinessScore}/10\n\n${entry.content}`,
          },
        ],
      };
    }
  );

  // ── Tool: search_entries ──────────────────────────────────────────────────
  server.tool(
    "search_entries",
    "Search journal entries by keyword (case-insensitive full-text search on entry content). " +
    "Returns matching entries newest first.",
    {
      query: z
        .string()
        .min(1)
        .describe("Keyword or phrase to search for in entry content"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(10)
        .describe("Maximum number of results to return (default 10)"),
    },
    async ({ query, limit }) => {
      const results = await store.searchEntries(userId, query, limit);
      if (results.length === 0) {
        return {
          content: [
            { type: "text" as const, text: `No entries found matching "${query}".` },
          ],
        };
      }
      const text = results
        .map((e) => `[${e.date}] Happiness: ${e.happinessScore}/10\n${e.content}`)
        .join("\n\n---\n\n");
      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${results.length} entr${results.length === 1 ? "y" : "ies"} matching "${query}":\n\n${text}`,
          },
        ],
      };
    }
  );

  // ── Tool: get_mood_summary ────────────────────────────────────────────────
  server.tool(
    "get_mood_summary",
    "Summarise happiness scores across a date range. Returns average, min, max, entry count, " +
    "and a breakdown by score tier. Useful for spotting mood trends.",
    {
      start_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Start date (YYYY-MM-DD, inclusive)"),
      end_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("End date (YYYY-MM-DD, inclusive)"),
    },
    async ({ start_date, end_date }) => {
      const entries = await store.getEntriesInRange(userId, start_date, end_date);
      if (entries.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No entries found between ${start_date} and ${end_date}.`,
            },
          ],
        };
      }
      const scores = entries.map((e) => e.happinessScore);
      const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      const buckets = { "1–3 (low)": 0, "4–6 (mid)": 0, "7–10 (high)": 0 };
      for (const s of scores) {
        if (s <= 3) buckets["1–3 (low)"]++;
        else if (s <= 6) buckets["4–6 (mid)"]++;
        else buckets["7–10 (high)"]++;
      }
      const breakdown = Object.entries(buckets)
        .map(([label, count]) => `  ${label}: ${count} day${count !== 1 ? "s" : ""}`)
        .join("\n");
      const text = [
        `Mood summary: ${start_date} → ${end_date}`,
        `Days with entries: ${entries.length}`,
        `Average happiness: ${avg}/10`,
        `Range: ${min}–${max}/10`,
        `Breakdown:`,
        breakdown,
      ].join("\n");
      return { content: [{ type: "text" as const, text }] };
    }
  );

  return server;
}

/**
 * Express route handler for POST /mcp.
 * The request must already have req.mcpUserId set by mcpAuth middleware.
 */
export async function handleMcpRequest(
  store: JournalStore,
  req: Request,
  res: Response
): Promise<void> {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const userId = (req as any).mcpUserId as string;
  const server = createMcpServer(store, userId);
  res.on("close", () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
