import crypto from "crypto";
import { sql } from "drizzle-orm";
import { db } from "./db";

// Access tokens for the Claude MCP connector. Tokens are random, short-lived,
// and stored only as SHA-256 hashes, so a database leak doesn't expose them.
// Refresh tokens rotate on every use. Each token belongs to one user (user_id);
// rows from before multi-user support have no user_id and belong to the
// original owner (MCP_USER_EMAIL), so that connection keeps working.
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour
const REFRESH_TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

type TokenKind = "access" | "refresh";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Constant-time string comparison that tolerates different lengths. */
export function safeEqual(a: string | undefined, b: string | undefined): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/** Creates the token table if missing. Runs on every boot; idempotent. */
export async function ensureMcpTokenTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS mcp_oauth_token (
      token_hash text PRIMARY KEY,
      kind text NOT NULL,
      expires_at timestamp NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    );
    ALTER TABLE mcp_oauth_token ADD COLUMN IF NOT EXISTS user_id text;
    DELETE FROM mcp_oauth_token WHERE expires_at < now();
  `);
}

async function storeToken(kind: TokenKind, ttlSeconds: number, userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await db.execute(sql`
    INSERT INTO mcp_oauth_token (token_hash, kind, expires_at, user_id)
    VALUES (${hashToken(token)}, ${kind}, ${expiresAt}, ${userId})
  `);
  return token;
}

export async function issueTokenPair(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = await storeToken("access", ACCESS_TOKEN_TTL_SECONDS, userId);
  const refreshToken = await storeToken("refresh", REFRESH_TOKEN_TTL_SECONDS, userId);
  return { accessToken, refreshToken };
}

/** A valid token's owner: a user id, null for a pre-multi-user (owner) token. */
type TokenOwner = { userId: string | null };

/** Returns the owner of a valid access token, or undefined if it isn't valid. */
export async function getAccessTokenOwner(token: string): Promise<TokenOwner | undefined> {
  const result = await db.execute(sql`
    SELECT user_id FROM mcp_oauth_token
    WHERE token_hash = ${hashToken(token)} AND kind = 'access' AND expires_at > now()
    LIMIT 1
  `);
  if (result.rows.length === 0) return undefined;
  return { userId: (result.rows[0] as { user_id: string | null }).user_id };
}

/** Deletes the refresh token (single use) and returns its owner if it was valid. */
export async function consumeRefreshToken(token: string): Promise<TokenOwner | undefined> {
  const result = await db.execute(sql`
    DELETE FROM mcp_oauth_token
    WHERE token_hash = ${hashToken(token)} AND kind = 'refresh' AND expires_at > now()
    RETURNING user_id
  `);
  if (result.rows.length === 0) return undefined;
  return { userId: (result.rows[0] as { user_id: string | null }).user_id };
}

/**
 * Deletes one user's access and refresh tokens, disconnecting their Claude.
 * includeLegacy also deletes pre-multi-user tokens (only for the original owner).
 */
export async function revokeUserTokens(userId: string, includeLegacy: boolean): Promise<void> {
  if (includeLegacy) {
    await db.execute(sql`DELETE FROM mcp_oauth_token WHERE user_id = ${userId} OR user_id IS NULL`);
  } else {
    await db.execute(sql`DELETE FROM mcp_oauth_token WHERE user_id = ${userId}`);
  }
}
