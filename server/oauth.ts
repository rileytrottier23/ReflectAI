import crypto from "crypto";
import { Router } from "express";

// Short-lived authorization codes (5 min TTL, in-memory is fine for single-user)
const authCodes = new Map<string, {
  expiresAt: number;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  redirectUri: string;
}>();

function verifyPkce(verifier: string, challenge: string, method: string): boolean {
  if (method === "S256") {
    const hash = crypto.createHash("sha256").update(verifier).digest("base64url");
    return hash === challenge;
  }
  return verifier === challenge; // plain
}

function authorizeHtml(params: {
  clientId?: string;
  redirectUri: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}): string {
  const { clientId, redirectUri, state, codeChallenge, codeChallengeMethod } = params;
  const fields = [
    `<input type="hidden" name="redirect_uri" value="${escHtml(redirectUri)}">`,
    state ? `<input type="hidden" name="state" value="${escHtml(state)}">` : "",
    codeChallenge ? `<input type="hidden" name="code_challenge" value="${escHtml(codeChallenge)}">` : "",
    codeChallengeMethod ? `<input type="hidden" name="code_challenge_method" value="${escHtml(codeChallengeMethod)}">` : "",
  ].join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize Claude — ReflectAI</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #E0E0E0;
      font-family: Georgia, 'Times New Roman', serif;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 1.25rem;
      padding: 2.5rem 2rem;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
      text-align: center;
    }
    .logo { font-size: 2rem; margin-bottom: 0.5rem; }
    h1 { font-size: 1.3rem; font-weight: 600; margin-bottom: 0.5rem; color: #111; }
    .app-name { color: #7D9371; font-weight: 600; }
    p { color: #555; font-size: 0.95rem; line-height: 1.55; margin-bottom: 1.5rem; }
    .permissions {
      background: #f7f7f7;
      border-radius: 0.75rem;
      padding: 1rem 1.25rem;
      margin-bottom: 1.75rem;
      text-align: left;
    }
    .permissions li {
      list-style: none;
      padding: 0.3rem 0;
      color: #444;
      font-size: 0.9rem;
    }
    .permissions li::before { content: "✓  "; color: #7D9371; font-weight: bold; }
    .buttons { display: flex; gap: 0.75rem; }
    button {
      flex: 1;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 0.75rem;
      font-family: inherit;
      font-size: 0.95rem;
      cursor: pointer;
      font-weight: 600;
    }
    .allow { background: #7D9371; color: #fff; }
    .allow:hover { background: #647A5A; }
    .deny { background: #eee; color: #555; }
    .deny:hover { background: #ddd; }
    .footer { margin-top: 1.25rem; font-size: 0.8rem; color: #aaa; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">📖</div>
    <h1>Authorize <span class="app-name">Claude</span></h1>
    <p><strong>${escHtml(clientId || "Claude")}</strong> is requesting access to your ReflectAI journal.</p>
    <div class="permissions">
      <ul>
        <li>Read your journal entries</li>
        <li>Create and search entries</li>
        <li>View your mood summaries</li>
      </ul>
    </div>
    <form method="POST" action="/oauth/authorize">
      ${fields}
      <div class="buttons">
        <button type="submit" name="action" value="deny" class="deny">Deny</button>
        <button type="submit" name="action" value="allow" class="allow">Allow</button>
      </div>
    </form>
    <p class="footer">Only you can see this page. Your journal data stays private.</p>
  </div>
</body>
</html>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function createOAuthRouter(): Router {
  const router = Router();

  // OAuth 2.0 Authorization Server Metadata (RFC 8414)
  router.get("/.well-known/oauth-authorization-server", (req, res) => {
    const base = `${req.protocol}://${req.headers.host}`;
    res.json({
      issuer: base,
      authorization_endpoint: `${base}/oauth/authorize`,
      token_endpoint: `${base}/oauth/token`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      code_challenge_methods_supported: ["S256", "plain"],
    });
  });

  // Show authorization page
  router.get("/oauth/authorize", (req, res) => {
    const {
      client_id,
      redirect_uri,
      state,
      response_type,
      code_challenge,
      code_challenge_method,
    } = req.query as Record<string, string>;

    if (!redirect_uri) {
      return res.status(400).send("Missing redirect_uri");
    }

    res.send(authorizeHtml({
      clientId: client_id,
      redirectUri: redirect_uri,
      state,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
    }));
  });

  // Process form submission (Allow / Deny)
  router.post("/oauth/authorize", (req, res) => {
    const { redirect_uri, state, code_challenge, code_challenge_method, action } = req.body;

    if (!redirect_uri) return res.status(400).send("Missing redirect_uri");

    const redirectUrl = new URL(redirect_uri);

    if (action === "deny") {
      redirectUrl.searchParams.set("error", "access_denied");
      if (state) redirectUrl.searchParams.set("state", state);
      return res.redirect(redirectUrl.toString());
    }

    const code = crypto.randomBytes(32).toString("hex");
    authCodes.set(code, {
      expiresAt: Date.now() + 5 * 60 * 1000,
      codeChallenge: code_challenge || undefined,
      codeChallengeMethod: code_challenge_method || "plain",
      redirectUri: redirect_uri,
    });

    redirectUrl.searchParams.set("code", code);
    if (state) redirectUrl.searchParams.set("state", state);
    res.redirect(redirectUrl.toString());
  });

  // Token exchange endpoint
  router.post("/oauth/token", (req, res) => {
    const {
      grant_type,
      code,
      client_id,
      client_secret,
      redirect_uri,
      code_verifier,
    } = req.body;

    // Validate client identity
    const expectedClientId = process.env.OAUTH_CLIENT_ID;
    const expectedSecret = process.env.MCP_TOKEN;

    if (!expectedClientId || !expectedSecret) {
      return res.status(503).json({ error: "server_error", error_description: "OAuth not configured" });
    }
    if (client_id !== expectedClientId) {
      return res.status(401).json({ error: "invalid_client", error_description: "Unknown client_id" });
    }
    if (client_secret !== expectedSecret) {
      return res.status(401).json({ error: "invalid_client", error_description: "Invalid client_secret" });
    }
    if (grant_type !== "authorization_code") {
      return res.status(400).json({ error: "unsupported_grant_type" });
    }

    const stored = authCodes.get(code);
    if (!stored || Date.now() > stored.expiresAt) {
      authCodes.delete(code);
      return res.status(400).json({ error: "invalid_grant", error_description: "Authorization code expired or invalid" });
    }

    // Validate PKCE if the authorization request included a challenge
    if (stored.codeChallenge) {
      if (!code_verifier) {
        return res.status(400).json({ error: "invalid_grant", error_description: "Missing code_verifier" });
      }
      if (!verifyPkce(code_verifier, stored.codeChallenge, stored.codeChallengeMethod || "plain")) {
        return res.status(400).json({ error: "invalid_grant", error_description: "PKCE verification failed" });
      }
    }

    authCodes.delete(code);

    res.json({
      access_token: expectedSecret,
      token_type: "bearer",
      expires_in: 31536000, // 1 year
    });
  });

  return router;
}
