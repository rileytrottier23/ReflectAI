// Regression test for the Claude connector forms (E-005, E-006).
//
// Both incidents were the same bug: the page set Referrer-Policy: no-referrer,
// so the browser posted the form with `Origin: null` and the same-origin check
// answered 403. This test loads each page, works out the Origin a browser would
// send under that page's Referrer-Policy, posts the form with it, and expects
// the form to succeed.
//
// It also checks the multi-user connector: each user's token reads only their
// own journal, tokens from before multi-user support still belong to the
// owner, and disconnecting removes only your own tokens.
//
// Needs a built app (npm run build) and an empty, migrated database:
//   DATABASE_URL=... npm run test:forms
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import pg from "pg";

const PORT = Number(process.env.TEST_PORT || 5099);
const BASE = `http://localhost:${PORT}`;
const EMAIL = "owner@example.com";
const PASSWORD = "test-password-" + randomBytes(6).toString("hex");
const CLIENT_ID = "test-client";
const REDIRECT_URI = "http://localhost:9999/callback";
const CLIENT_SECRET = "test-secret";
const OTHER_EMAIL = "second-user@example.com";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `  (${detail})`}`);
  if (!ok) failures++;
}

// The Origin a browser sends on a same-origin form POST from a page served
// with this Referrer-Policy. Helmet's default (no-referrer) yields "null".
function browserOrigin(policy: string | null): string {
  const last = (policy || "no-referrer").split(",").pop()!.trim();
  return last === "no-referrer" ? "null" : BASE;
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(BASE + "/");
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error("server did not start");
}

async function signIn(email = EMAIL, name = "Owner"): Promise<string> {
  const headers = { "content-type": "application/json", origin: BASE };
  const up = await fetch(BASE + "/api/auth/sign-up/email", {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password: PASSWORD, name }),
  });
  if (!up.ok) throw new Error(`sign-up failed: ${up.status} ${await up.text()}`);

  // Skip the verification email; connecting Claude requires a verified address.
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  await db.query(`UPDATE auth_user SET email_verified = true WHERE email = $1`, [email]);
  await db.end();

  const res = await fetch(BASE + "/api/auth/sign-in/email", {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`sign-in failed: ${res.status} ${await res.text()}`);
  return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

function form(fields: Record<string, string>) {
  return new URLSearchParams(fields).toString();
}

// Writes a journal entry through the app, as the signed-in user.
async function addEntry(cookie: string, content: string) {
  const res = await fetch(BASE + "/api/journal/entries", {
    method: "POST",
    headers: { cookie, "content-type": "application/json", origin: BASE },
    body: JSON.stringify({ content, happinessScore: 7, date: "2026-01-15" }),
  });
  if (!res.ok) throw new Error(`add entry failed: ${res.status} ${await res.text()}`);
}

// Runs consent (Allow) and the token exchange; returns the access token.
async function connectClaude(cookie: string): Promise<string> {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const params = {
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state: "xyz",
    code_challenge: challenge,
    code_challenge_method: "S256",
  };
  const page = await fetch(`${BASE}/oauth/authorize?${new URLSearchParams(params)}`, { headers: { cookie } });
  const allow = await fetch(BASE + "/oauth/authorize", {
    method: "POST",
    redirect: "manual",
    headers: {
      cookie,
      "content-type": "application/x-www-form-urlencoded",
      origin: browserOrigin(page.headers.get("referrer-policy")),
    },
    body: form({ ...params, action: "allow" }),
  });
  const code = new URL(allow.headers.get("location") || "http://x/").searchParams.get("code");
  if (!code) throw new Error(`no code: status ${allow.status}`);
  const tok = await fetch(BASE + "/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form({
      grant_type: "authorization_code",
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });
  const json = await tok.json();
  if (!json.access_token) throw new Error(`token exchange failed: ${tok.status} ${JSON.stringify(json)}`);
  return json.access_token;
}

// Calls list_recent_entries over MCP; returns the status and the text Claude would see.
async function readJournal(accessToken: string): Promise<{ status: number; text: string }> {
  const res = await fetch(BASE + "/mcp", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "list_recent_entries", arguments: { count: 50 } },
    }),
  });
  return { status: res.status, text: await res.text() };
}

async function main() {
  const server = spawn("node", ["dist/index.js"], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(PORT),
      BETTER_AUTH_URL: BASE,
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || randomBytes(32).toString("hex"),
      JOURNAL_ENCRYPTION_KEY: process.env.JOURNAL_ENCRYPTION_KEY || randomBytes(32).toString("base64"),
      MCP_USER_EMAIL: EMAIL,
      OAUTH_CLIENT_ID: CLIENT_ID,
      OAUTH_CLIENT_SECRET: CLIENT_SECRET,
      MCP_TOKEN: CLIENT_SECRET,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "unused",
    },
    stdio: ["ignore", "ignore", "inherit"],
  });

  try {
    await waitForServer();
    const cookie = await signIn();

    // Consent page: Allow
    const verifier = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const params = {
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      state: "abc",
      code_challenge: challenge,
      code_challenge_method: "S256",
    };
    const page = await fetch(`${BASE}/oauth/authorize?${new URLSearchParams(params)}`, { headers: { cookie } });
    check("consent page loads", page.status === 200, `status ${page.status}`);
    const allow = await fetch(BASE + "/oauth/authorize", {
      method: "POST",
      redirect: "manual",
      headers: {
        cookie,
        "content-type": "application/x-www-form-urlencoded",
        origin: browserOrigin(page.headers.get("referrer-policy")),
      },
      body: form({ ...params, action: "allow" }),
    });
    const location = allow.headers.get("location") || "";
    check(
      "consent form Allow redirects back with a code",
      allow.status === 302 && location.startsWith(REDIRECT_URI) && location.includes("code="),
      `status ${allow.status}`,
    );

    // Connections page: Disconnect
    const conn = await fetch(BASE + "/oauth/connections", { headers: { cookie } });
    check("connections page loads", conn.status === 200, `status ${conn.status}`);
    const revoke = await fetch(BASE + "/oauth/connections/revoke", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/x-www-form-urlencoded",
        origin: browserOrigin(conn.headers.get("referrer-policy")),
      },
      body: "",
    });
    check("Disconnect form returns 200", revoke.status === 200, `status ${revoke.status}`);

    // The origin check must still block other sites.
    const evil = await fetch(BASE + "/oauth/connections/revoke", {
      method: "POST",
      headers: { cookie, origin: "https://evil.example" },
    });
    check("cross-site POST is rejected", evil.status === 403, `status ${evil.status}`);
    const noOrigin = await fetch(BASE + "/oauth/connections/revoke", {
      method: "POST",
      headers: { cookie, "sec-fetch-site": "cross-site" },
    });
    check("POST without Origin from another site is rejected", noOrigin.status === 403, `status ${noOrigin.status}`);

    // Multi-user: each token reads only its own user's journal.
    await addEntry(cookie, "OWNER-ENTRY-MARKER");
    const otherCookie = await signIn(OTHER_EMAIL, "Second");
    await addEntry(otherCookie, "SECOND-ENTRY-MARKER");
    const ownerToken = await connectClaude(cookie);
    const otherToken = await connectClaude(otherCookie);

    const ownerRead = await readJournal(ownerToken);
    check(
      "owner's token reads only the owner's journal",
      ownerRead.text.includes("OWNER-ENTRY-MARKER") && !ownerRead.text.includes("SECOND-ENTRY-MARKER"),
      `status ${ownerRead.status}`,
    );
    const otherRead = await readJournal(otherToken);
    check(
      "a second user can connect and reads only their own journal",
      otherRead.text.includes("SECOND-ENTRY-MARKER") && !otherRead.text.includes("OWNER-ENTRY-MARKER"),
      `status ${otherRead.status}`,
    );

    // Tokens from before multi-user support (no user_id) stay the owner's.
    const legacyToken = randomBytes(32).toString("base64url");
    const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();
    await db.query(
      `INSERT INTO mcp_oauth_token (token_hash, kind, expires_at) VALUES ($1, 'access', now() + interval '1 hour')`,
      [createHash("sha256").update(legacyToken).digest("hex")],
    );
    await db.end();
    const legacyRead = await readJournal(legacyToken);
    check(
      "a pre-multi-user token still reads the owner's journal",
      legacyRead.text.includes("OWNER-ENTRY-MARKER") && !legacyRead.text.includes("SECOND-ENTRY-MARKER"),
      `status ${legacyRead.status}`,
    );

    // Disconnecting removes only your own tokens.
    const otherConn = await fetch(BASE + "/oauth/connections", { headers: { cookie: otherCookie } });
    await fetch(BASE + "/oauth/connections/revoke", {
      method: "POST",
      headers: {
        cookie: otherCookie,
        "content-type": "application/x-www-form-urlencoded",
        origin: browserOrigin(otherConn.headers.get("referrer-policy")),
      },
      body: "",
    });
    const otherAfter = await readJournal(otherToken);
    check("disconnecting revokes your own token", otherAfter.status === 401, `status ${otherAfter.status}`);
    const ownerAfter = await readJournal(ownerToken);
    check(
      "another user's disconnect leaves the owner connected",
      ownerAfter.status === 200 && ownerAfter.text.includes("OWNER-ENTRY-MARKER"),
      `status ${ownerAfter.status}`,
    );

    const bad = await readJournal("not-a-real-token");
    check("an unknown token is rejected", bad.status === 401, `status ${bad.status}`);
  } finally {
    server.kill();
  }

  if (failures) {
    console.error(`${failures} check(s) failed`);
    process.exit(1);
  }
  console.log("All connector form checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
