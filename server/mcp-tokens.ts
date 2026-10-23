import crypto from "crypto";
import { sql } from "drizzle-orm";
import { db } from "./db";

// Access tokens for the Claude MCP connector. Tokens are random, short-lived,
// and stored only as SHA-256 hashes, so a database leak doesn't expose them.
// Refresh tokens rotate on every use.
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
    DELETE FROM mcp_oauth_token WHERE expires_at < now();
  `);
}

async function storeToken(kind: TokenKind, ttlSeconds: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await db.execute(sql`
    INSERT INTO mcp_oauth_token (token_hash, kind, expires_at)
    VALUES (${hashToken(token)}, ${kind}, ${expiresAt})
  `);
  return token;
}

export async function issueTokenPair(): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = await storeToken("access", ACCESS_TOKEN_TTL_SECONDS);
  const refreshToken = await storeToken("refresh", REFRESH_TOKEN_TTL_SECONDS);
  return { accessToken, refreshToken };
}

export async function isValidAccessToken(token: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT 1 FROM mcp_oauth_token
    WHERE token_hash = ${hashToken(token)} AND kind = 'access' AND expires_at > now()
    LIMIT 1
  `);
  return result.rows.length > 0;
}

/** Deletes the refresh token and reports whether it was valid (single use). */
export async function consumeRefreshToken(token: string): Promise<boolean> {
  const result = await db.execute(sql`
    DELETE FROM mcp_oauth_token
    WHERE token_hash = ${hashToken(token)} AND kind = 'refresh' AND expires_at > now()
    RETURNING 1
  `);
  return result.rows.length > 0;
}

/** Deletes every access and refresh token, disconnecting Claude. */
export async function revokeAllTokens(): Promise<void> {
  await db.execute(sql`DELETE FROM mcp_oauth_token`);
}
