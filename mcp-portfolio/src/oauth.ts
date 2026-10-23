/**
 * Minimal OAuth 2.0 Authorization Server (RFC 6749 + RFC 7636 PKCE + RFC 8414)
 *
 * This is a single-user server — there is no user database. The owner
 * authorizes a client (e.g. Claude) by clicking "Allow" on the consent page.
 * Access tokens are random and short-lived (see tokens.ts); MCP_TOKEN is only
 * the client secret.
 *
 * NOT FOR PRODUCTION AS-IS: the consent page has no login, so the client
 * secret is the only thing protecting the data. In a real app, require the
 * owner's signed-in session before showing or accepting the consent form.
 *
 * Designed to satisfy claude.ai's MCP connector OAuth requirement without
 * a full identity provider.
 */

import crypto from "crypto";
import { Router } from "express";
import { ACCESS_TOKEN_TTL_SECONDS, issueAccessToken, safeEqual } from "./tokens.js";

// Short-lived authorization codes — 5-minute TTL, in-memory (fine for single-user)
const authCodes = new Map<string, {
  expiresAt: number;
  codeChallenge: string;
  redirectUri: string;
}>();

// Only Claude's OAuth callbacks (and loopback, for local clients) may
// receive authorization codes. Extra exact URIs: OAUTH_REDIRECT_URIS.
const ALLOWED_REDIRECT_HOSTS = new Set(["claude.ai", "claude.com"]);
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function isAllowedRedirectUri(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const extra = (process.env.OAUTH_REDIRECT_URIS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (extra.includes(value)) return true;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.username || url.password) return false;
  if (url.protocol === "https:" && ALLOWED_REDIRECT_HOSTS.has(url.hostname)) return true;
  if (url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname)) return true;
  return false;
}

// Only S256 is accepted; "plain" PKCE offers no protection if the code leaks.
function verifyPkce(verifier: string, challenge: string): boolean {
  const hash = crypto.createHash("sha256").update(verifier).digest("base64url");
  return safeEqual(hash, challenge);
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function authorizeHtml(params: {
  clientId?: string;
  redirectUri: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}): string {
  const { clientId, redirectUri, state, codeChallenge, codeChallengeMethod } = params;
  const hiddenFields = [
    `<input type="hidden" name="redirect_uri" value="${escHtml(redirectUri)}">`,
    state               ? `<input type="hidden" name="state"                  value="${escHtml(state)}">` : "",
    codeChallenge       ? `<input type="hidden" name="code_challenge"          value="${escHtml(codeChallenge)}">` : "",
    codeChallengeMethod ? `<input type="hidden" name="code_challenge_method"   value="${escHtml(codeChallengeMethod)}">` : "",
  ].join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize ${escHtml(clientId || "Client")}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f0f0;
      font-family: system-ui, sans-serif;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 12px;
      padding: 2.5rem 2rem;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(0,0,0,.10);
      text-align: center;
    }
    h1 { font-size: 1.25rem; margin-bottom: .5rem; color: #111; }
    p  { color: #555; font-size: .9rem; line-height: 1.55; margin-bottom: 1.25rem; }
    .perms {
      background: #f8f8f8;
      border-radius: 8px;
      padding: .9rem 1.1rem;
      margin-bottom: 1.5rem;
      text-align: left;
    }
    .perms li { list-style: none; padding: .25rem 0; color: #444; font-size: .875rem; }
    .perms li::before { content: "✓  "; color: #4a7c59; font-weight: 700; }
    .buttons { display: flex; gap: .625rem; }
    button {
      flex: 1; padding: .7rem 1rem; border: none; border-radius: 8px;
      font-size: .9rem; font-weight: 600; cursor: pointer;
    }
    .allow { background: #4a7c59; color: #fff; }
    .allow:hover { background: #3a6147; }
    .deny  { background: #e8e8e8; color: #555; }
    .deny:hover  { background: #d8d8d8; }
    .note { margin-top: 1rem; font-size: .75rem; color: #aaa; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Authorize <strong>${escHtml(clientId || "Client")}</strong></h1>
    <p>${escHtml(clientId || "This client")} is requesting access to your journal.</p>
    <div class="perms">
      <ul>
        <li>Read your journal entries</li>
        <li>Create and search entries</li>
        <li>View your mood summaries</li>
      </ul>
    </div>
    <form method="POST" action="/oauth/authorize">
      ${hiddenFields}
      <div class="buttons">
        <button type="submit" name="action" value="deny"  class="deny">Deny</button>
        <button type="submit" name="action" value="allow" class="allow">Allow</button>
      </div>
    </form>
    <p class="note">Sample only: this page has no login. See the README before deploying.</p>
  </div>
</body>
</html>`;
}

export function createOAuthRouter(): Router {
  const router = Router();

  // RFC 8414 — Authorization Server Metadata
  router.get("/.well-known/oauth-authorization-server", (req, res) => {
    const base = `${req.protocol}://${req.headers.host}`;
    res.json({
      issuer: base,
      authorization_endpoint:           `${base}/oauth/authorize`,
      token_endpoint:                    `${base}/oauth/token`,
      response_types_supported:          ["code"],
      grant_types_supported:             ["authorization_code"],
      code_challenge_methods_supported:  ["S256"],
    });
  });

  // Show consent page
  router.get("/oauth/authorize", (req, res) => {
    const { client_id, redirect_uri, state, code_challenge, code_challenge_method } =
      req.query as Record<string, string>;

    if (!isAllowedRedirectUri(redirect_uri)) return res.status(400).send("Invalid redirect_uri");
    if (!code_challenge || code_challenge_method !== "S256") {
      return res.status(400).send("PKCE with S256 is required");
    }

    res.send(authorizeHtml({
      clientId:            client_id,
      redirectUri:         redirect_uri,
      state,
      codeChallenge:       code_challenge,
      codeChallengeMethod: code_challenge_method,
    }));
  });

  // Process consent form (Allow / Deny)
  router.post("/oauth/authorize", (req, res) => {
    const { redirect_uri, state, code_challenge, code_challenge_method, action } = req.body;
    if (!isAllowedRedirectUri(redirect_uri)) return res.status(400).send("Invalid redirect_uri");

    const redirectUrl = new URL(redirect_uri);

    if (action !== "allow") {
      redirectUrl.searchParams.set("error", "access_denied");
      if (state) redirectUrl.searchParams.set("state", state);
      return res.redirect(redirectUrl.toString());
    }

    if (!code_challenge || code_challenge_method !== "S256") {
      redirectUrl.searchParams.set("error", "invalid_request");
      if (state) redirectUrl.searchParams.set("state", state);
      return res.redirect(redirectUrl.toString());
    }

    const code = crypto.randomBytes(32).toString("hex");
    authCodes.set(code, {
      expiresAt:     Date.now() + 5 * 60 * 1000,
      codeChallenge: code_challenge,
      redirectUri:   redirect_uri,
    });

    redirectUrl.searchParams.set("code", code);
    if (state) redirectUrl.searchParams.set("state", state);
    res.redirect(redirectUrl.toString());
  });

  // Token exchange
  router.post("/oauth/token", (req, res) => {
    const { grant_type, code, client_id, client_secret, code_verifier, redirect_uri } = req.body;

    const expectedClientId = process.env.OAUTH_CLIENT_ID;
    const expectedSecret   = process.env.MCP_TOKEN;

    if (!expectedClientId || !expectedSecret) {
      return res.status(503).json({ error: "server_error", error_description: "OAuth env vars not set" });
    }
    if (!safeEqual(client_id, expectedClientId)) {
      return res.status(401).json({ error: "invalid_client", error_description: "Unknown client_id" });
    }
    if (!safeEqual(client_secret, expectedSecret)) {
      return res.status(401).json({ error: "invalid_client", error_description: "Invalid client_secret" });
    }
    if (grant_type !== "authorization_code") {
      return res.status(400).json({ error: "unsupported_grant_type" });
    }

    const stored = typeof code === "string" ? authCodes.get(code) : undefined;
    if (typeof code === "string") authCodes.delete(code); // single use
    if (!stored || Date.now() > stored.expiresAt) {
      return res.status(400).json({ error: "invalid_grant", error_description: "Code expired or invalid" });
    }
    if (redirect_uri !== stored.redirectUri) {
      return res.status(400).json({ error: "invalid_grant", error_description: "redirect_uri mismatch" });
    }
    if (typeof code_verifier !== "string" || !verifyPkce(code_verifier, stored.codeChallenge)) {
      return res.status(400).json({ error: "invalid_grant", error_description: "PKCE verification failed" });
    }

    res.set("Cache-Control", "no-store");
    res.json({
      access_token: issueAccessToken(),
      token_type:   "bearer",
      expires_in:   ACCESS_TOKEN_TTL_SECONDS,
    });
  });

  return router;
}
