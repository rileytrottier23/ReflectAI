import crypto from "crypto";

// Encrypts journal text before it is written to the database, so a leaked
// database, dump or backup shows only ciphertext.
//
// Format: "enc:v1:" + base64(iv[12] | authTag[16] | ciphertext), AES-256-GCM.
// The associated data ties each value to its owner and field, so a value
// copied into another user's row (or another column) fails to decrypt.
//
// The key is JOURNAL_ENCRYPTION_KEY: 32 random bytes, base64-encoded.
// Losing it makes every encrypted value unreadable, so keep a copy outside
// Railway (for example in a password manager).

const PREFIX = "enc:v1:";
const IV_BYTES = 12;
const TAG_BYTES = 16;

let cachedKey: Buffer | null = null;

function loadKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.JOURNAL_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("JOURNAL_ENCRYPTION_KEY is not set; journal text cannot be encrypted or read.");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("JOURNAL_ENCRYPTION_KEY must be 32 bytes, base64-encoded (e.g. `openssl rand -base64 32`).");
  }
  cachedKey = key;
  return key;
}

/** Throws at startup if the key is missing or malformed. */
export function assertEncryptionKey(): void {
  loadKey();
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptField(plaintext: string, context: string): string {
  const key = loadKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(context, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

/**
 * Decrypts a value written by encryptField. Values without the prefix are
 * rows written before encryption was added; they are returned unchanged
 * until the startup backfill encrypts them.
 */
export function decryptField(value: string, context: string): string {
  if (!isEncrypted(value)) return value;
  const key = loadKey();
  const data = Buffer.from(value.slice(PREFIX.length), "base64");
  if (data.length < IV_BYTES + TAG_BYTES) {
    throw new Error("Encrypted value is truncated");
  }
  const iv = data.subarray(0, IV_BYTES);
  const tag = data.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = data.subarray(IV_BYTES + TAG_BYTES);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAAD(Buffer.from(context, "utf8"));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

// Associated-data labels, one per encrypted column.
export const entryContext = (userId: number) => `journal_entries.content:${userId}`;
export const reportAnalysisContext = (userId: number) => `saved_reports.detailed_analysis:${userId}`;
export const reportRecommendationsContext = (userId: number) => `saved_reports.recommendations:${userId}`;
