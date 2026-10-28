import { and, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { journalEntries, savedReports } from "@shared/schema";
import {
  encryptField,
  entryContext,
  isEncrypted,
  reportAnalysisContext,
  reportRecommendationsContext,
} from "./field-crypto";
import { log } from "./vite";

/**
 * Encrypts any journal entries and saved reports still stored as plain text
 * (rows written before encryption was added). Runs on every boot; once all
 * rows are encrypted it finds nothing and does nothing. Each row is updated
 * only if it still holds the exact plain text that was read, so a concurrent
 * edit is never overwritten.
 */
export async function encryptExistingRows(): Promise<void> {
  const plainEntries = await db
    .select({ id: journalEntries.id, userId: journalEntries.userId, content: journalEntries.content })
    .from(journalEntries)
    .where(sql`${journalEntries.content} NOT LIKE 'enc:v1:%'`);

  for (const row of plainEntries) {
    await db
      .update(journalEntries)
      .set({ content: encryptField(row.content, entryContext(row.userId)) })
      .where(and(eq(journalEntries.id, row.id), eq(journalEntries.content, row.content)));
  }

  const reports = await db
    .select({
      id: savedReports.id,
      userId: savedReports.userId,
      detailedAnalysis: savedReports.detailedAnalysis,
      recommendations: savedReports.recommendations,
    })
    .from(savedReports);

  let reportsUpdated = 0;
  for (const row of reports) {
    const analysisPlain = !isEncrypted(row.detailedAnalysis);
    const recsPlain = row.recommendations.some((r) => !isEncrypted(r));
    if (!analysisPlain && !recsPlain) continue;

    await db
      .update(savedReports)
      .set({
        detailedAnalysis: analysisPlain
          ? encryptField(row.detailedAnalysis, reportAnalysisContext(row.userId))
          : row.detailedAnalysis,
        recommendations: row.recommendations.map((r) =>
          isEncrypted(r) ? r : encryptField(r, reportRecommendationsContext(row.userId)),
        ),
      })
      .where(and(eq(savedReports.id, row.id), eq(savedReports.detailedAnalysis, row.detailedAnalysis)));
    reportsUpdated++;
  }

  if (plainEntries.length || reportsUpdated) {
    log(`encrypted ${plainEntries.length} journal entries and ${reportsUpdated} reports stored as plain text`);
  }
}
