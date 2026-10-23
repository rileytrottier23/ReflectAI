/**
 * In-memory access tokens for the single-user sample.
 *
 * Tokens are random and expire after an hour. MCP_TOKEN is only the OAuth
 * client secret; it is never handed out as an access token. Restarting the
 * server clears all tokens, so Claude simply re-runs the OAuth flow.
 */

import crypto from "crypto";

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;

const accessTokens = new Map<string, number>(); // sha256(token) -> expiresAt

function hash(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Constant-time string comparison that tolerates different lengths. */
export function safeEqual(a: unknown, b: unknown): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function issueAccessToken(): string {
  const token = crypto.randomBytes(32).toString("base64url");
  accessTokens.set(hash(token), Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000);
  return token;
}

export function isValidAccessToken(token: string): boolean {
  const key = hash(token);
  const expiresAt = accessTokens.get(key);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    accessTokens.delete(key);
    return false;
  }
  return true;
}
