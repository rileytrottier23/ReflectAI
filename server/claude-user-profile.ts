import Anthropic from "@anthropic-ai/sdk";
import { eq, sql } from "drizzle-orm";
import { users, type User } from "@shared/schema";
import { db } from "./db";

// Claude API user profiles: each ReflectAI user gets one profile, and every
// Claude request made for that user carries its ID. If one account misuses
// the app, Anthropic can restrict that profile instead of the whole API key.
// https://platform.claude.com/docs/en/api/user_profiles
//
// Everything here fails open: if a profile can't be created, the request goes
// out without one and the report still works.

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Set CLAUDE_USER_PROFILES=off on Railway to stop tagging requests without a deploy.
function enabled(): boolean {
  return (process.env.CLAUDE_USER_PROFILES ?? "on").toLowerCase() !== "off";
}

// Adds the column at startup, same pattern as ensureAuthTables().
export async function ensureUserProfileColumn(): Promise<void> {
  await db.execute(sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS anthropic_user_profile_id text;
  `);
}

// Returns the user's Claude profile ID, creating it on first use.
// Only the internal numeric user ID is sent; no email, name or journal data.
export async function getClaudeUserProfileId(
  user: Pick<User, "id" | "anthropicUserProfileId">
): Promise<string | undefined> {
  if (!enabled() || !process.env.ANTHROPIC_API_KEY) return undefined;
  if (user.anthropicUserProfileId) return user.anthropicUserProfileId;

  try {
    const profile = await anthropic.userProfiles.create({
      access_type: "application",
      metadata: { app: "reflectai", user_id: String(user.id) },
    });
    // Only fill the column if it is still empty, so two parallel requests
    // can't overwrite each other's profile.
    await db
      .update(users)
      .set({ anthropicUserProfileId: profile.id })
      .where(sql`${users.id} = ${user.id} AND ${users.anthropicUserProfileId} IS NULL`);
    const [row] = await db
      .select({ id: users.anthropicUserProfileId })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    return row?.id ?? profile.id;
  } catch (error: any) {
    console.warn(
      `Claude user profile not created for user ${user.id} (status ${error?.status ?? "unknown"}); continuing without it`
    );
    return undefined;
  }
}
