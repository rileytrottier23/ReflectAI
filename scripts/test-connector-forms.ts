// Regression test for the Claude connector forms (E-005, E-006).
//
// Both incidents were the same bug: the page set Referrer-Policy: no-referrer,
// so the browser posted the form with `Origin: null` and the same-origin check
// answered 403. This test loads each page, works out the Origin a browser would
// send under that page's Referrer-Policy, posts the form with it, and expects
// the form to succeed.
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

async function signIn(): Promise<string> {
  const headers = { "content-type": "application/json", origin: BASE };
  const up = await fetch(BASE + "/api/auth/sign-up/email", {
    method: "POST",
    headers,
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: "Owner" }),
  });
  if (!up.ok) throw new Error(`sign-up failed: ${up.status} ${await up.text()}`);

  // Skip the verification email; the owner check requires a verified address.
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  await db.query(`UPDATE auth_user SET email_verified = true WHERE email = $1`, [EMAIL]);
  await db.end();

  const res = await fetch(BASE + "/api/auth/sign-in/email", {
    method: "POST",
    headers,
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`sign-in failed: ${res.status} ${await res.text()}`);
  return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

function form(fields: Record<string, string>) {
  return new URLSearchParams(fields).toString();
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
      OAUTH_CLIENT_SECRET: "test-secret",
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
