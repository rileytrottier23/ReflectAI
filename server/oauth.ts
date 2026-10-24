import crypto from "crypto";
import { Router, type NextFunction, type Request, type Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  consumeRefreshToken,
  issueTokenPair,
  revokeAllTokens,
  safeEqual,
} from "./mcp-tokens";

// Short-lived authorization codes (5 min TTL, in-memory is fine for single-user)
const authCodes = new Map<string, {
  expiresAt: number;
  codeChallenge: string;
  redirectUri: string;
  resource?: string;
}>();

// Only Claude's OAuth callbacks may receive authorization codes. Loopback
// addresses are allowed for local clients such as Claude Code. Extra exact
// URIs can be added with OAUTH_REDIRECT_URIS (comma-separated).
const ALLOWED_REDIRECT_HOSTS = new Set(["claude.ai", "claude.com"]);
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isAllowedRedirectUri(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const extra = (process.env.OAUTH_REDIRECT_URIS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
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

function clientIdMatches(clientId: unknown): boolean {
  const expected = process.env.OAUTH_CLIENT_ID;
  return Boolean(expected) && typeof clientId === "string" && safeEqual(clientId, expected);
}

type OwnerCheck = "owner" | "signed-out" | "not-owner";

// The MCP connector exposes one person's journal (MCP_USER_EMAIL), so only
// that person, signed in with a verified email, may approve access.
async function checkOwner(req: Request): Promise<OwnerCheck> {
  const ownerEmail = process.env.MCP_USER_EMAIL?.trim().toLowerCase();
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session?.user) return "signed-out";
  const email = session.user.emailVerified ? session.user.email.toLowerCase() : undefined;
  if (!ownerEmail || email !== ownerEmail) return "not-owner";
  return "owner";
}

// Passes async handler errors to Express's error handler.
function wrap(fn: (req: Request, res: Response) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
}

function baseUrl(req: Request): string {
  return `${req.protocol}://${req.headers.host}`;
}

// RFC 8707: if the client names the resource it wants a token for, it must be
// this server's MCP endpoint.
function resourceMatches(req: Request, resource: unknown): boolean {
  if (resource === undefined || resource === "") return true;
  if (typeof resource !== "string") return false;
  const base = baseUrl(req);
  return resource === `${base}/mcp` || resource === base || resource === `${base}/`;
}

// Form posts must come from this site's own consent page.
function isSameOrigin(req: Request): boolean {
  const origin = req.headers.origin;
  if (!origin) return true; // older browsers omit Origin on same-origin form posts
  return origin === baseUrl(req);
}

function messageHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(title)} | ReflectAI</title>
  <style>
    body { min-height: 100vh; margin: 0; display: flex; align-items: center; justify-content: center; background: #E0E0E0; font-family: Georgia, 'Times New Roman', serif; padding: 24px; box-sizing: border-box; }
    .card { background: #fff; border-radius: 1.25rem; padding: 2.5rem 2rem; max-width: 420px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,0.10); text-align: center; }
    h1 { font-size: 1.3rem; margin: 0 0 0.75rem; color: #111; }
    p { color: #555; font-size: 0.95rem; line-height: 1.55; margin: 0 0 1rem; }
    a.btn, button { display: inline-block; padding: 0.7rem 1.2rem; border: none; border-radius: 0.75rem; background: #7D9371; color: #fff; font-family: inherit; font-size: 0.95rem; font-weight: 600; text-decoration: none; cursor: pointer; margin: 0.25rem; }
    a.secondary { background: #eee; color: #555; }
  </style>
</head>
<body><div class="card"><h1>${escHtml(title)}</h1>${body}</div></body>
</html>`;
}

function signInRequiredHtml(retryUrl: string): string {
  return messageHtml(
    "Sign in to ReflectAI first",
    `<p>To connect Claude to your journal, sign in to ReflectAI in this browser, then come back and try again.</p>
     <a class="btn" href="/sign-in" target="_blank" rel="noopener">Sign in</a>
     <a class="btn secondary" href="${escHtml(retryUrl)}">Try again</a>`
  );
}

function notOwnerHtml(): string {
  return messageHtml(
    "This connector isn't available",
    "<p>Only the journal owner can connect Claude to this ReflectAI server.</p>"
  );
}

function authorizeHtml(params: {
  clientId?: string;
  redirectUri: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  resource?: string;
}): string {
  const { clientId, redirectUri, state, codeChallenge, codeChallengeMethod, resource } = params;
  const fields = [
    `<input type="hidden" name="redirect_uri" value="${escHtml(redirectUri)}">`,
    state ? `<input type="hidden" name="state" value="${escHtml(state)}">` : "",
    codeChallenge ? `<input type="hidden" name="code_challenge" value="${escHtml(codeChallenge)}">` : "",
    codeChallengeMethod ? `<input type="hidden" name="code_challenge_method" value="${escHtml(codeChallengeMethod)}">` : "",
    resource ? `<input type="hidden" name="resource" value="${escHtml(resource)}">` : "",
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
        <li>Read and search your journal entries</li>
        <li>Create and edit entries</li>
        <li>Delete entries (Claude asks you first)</li>
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
    <p class="footer">You're signed in as the journal owner. You can disconnect Claude any time at /oauth/connections.</p>
  </div>
</body>
</html>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["client_secret_post"],
    });
  });

  // Show authorization page
  router.get("/oauth/authorize", wrap(async (req, res) => {
    const {
      client_id,
      redirect_uri,
      state,
      code_challenge,
      code_challenge_method,
      resource,
    } = req.query as Record<string, string>;

    // Never redirect to an unvetted URI: show an error page instead.
    if (!isAllowedRedirectUri(redirect_uri)) {
      return res.status(400).send("Invalid redirect_uri");
    }
    if (!clientIdMatches(client_id)) {
      return res.status(400).send("Unknown client_id");
    }
    if (!code_challenge || code_challenge_method !== "S256") {
      return res.status(400).send("PKCE with S256 is required");
    }
    if (!resourceMatches(req, resource)) {
      return res.status(400).send("Invalid resource");
    }

    const owner = await checkOwner(req);
    if (owner === "signed-out") {
      return res.status(401).send(signInRequiredHtml(req.originalUrl));
    }
    if (owner === "not-owner") {
      return res.status(403).send(notOwnerHtml());
    }

    // Helmet's default Referrer-Policy is no-referrer, which makes browsers
    // send `Origin: null` on this page's form POST, so isSameOrigin() rejected
    // every approval with a 403. same-origin keeps the real Origin on the
    // POST back to us while still sending nothing to other sites.
    res.setHeader("Referrer-Policy", "same-origin");
    res.send(authorizeHtml({
      clientId: client_id,
      redirectUri: redirect_uri,
      state,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
      resource,
    }));
  }));

  // Process form submission (Allow / Deny)
  router.post("/oauth/authorize", wrap(async (req, res) => {
    const { redirect_uri, state, code_challenge, code_challenge_method, resource, action } = req.body;

    if (!isAllowedRedirectUri(redirect_uri)) {
      return res.status(400).send("Invalid redirect_uri");
    }
    if (!isSameOrigin(req)) {
      return res.status(403).send("Invalid request origin");
    }
    if (!resourceMatches(req, resource)) {
      return res.status(400).send("Invalid resource");
    }

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

    const owner = await checkOwner(req);
    if (owner !== "owner") {
      return res.status(owner === "signed-out" ? 401 : 403).send(notOwnerHtml());
    }

    const code = crypto.randomBytes(32).toString("hex");
    authCodes.set(code, {
      expiresAt: Date.now() + 5 * 60 * 1000,
      codeChallenge: code_challenge,
      redirectUri: redirect_uri,
      resource: typeof resource === "string" && resource ? resource : undefined,
    });

    redirectUrl.searchParams.set("code", code);
    if (state) redirectUrl.searchParams.set("state", state);
    res.redirect(redirectUrl.toString());
  }));

  // Owner-only page to disconnect Claude: deletes every MCP access and
  // refresh token, so Claude must go through the consent page again.
  router.get("/oauth/connections", wrap(async (req, res) => {
    const owner = await checkOwner(req);
    if (owner === "signed-out") return res.status(401).send(signInRequiredHtml(req.originalUrl));
    if (owner === "not-owner") return res.status(403).send(notOwnerHtml());
    res.send(messageHtml(
      "Claude connection",
      `<p>Disconnecting signs Claude out of your journal right away. You can reconnect from Claude's connector settings.</p>
       <form method="POST" action="/oauth/connections/revoke"><button type="submit">Disconnect Claude</button></form>`
    ));
  }));

  router.post("/oauth/connections/revoke", wrap(async (req, res) => {
    if (!isSameOrigin(req)) return res.status(403).send("Invalid request origin");
    const owner = await checkOwner(req);
    if (owner !== "owner") return res.status(owner === "signed-out" ? 401 : 403).send(notOwnerHtml());
    await revokeAllTokens();
    res.send(messageHtml("Claude disconnected", "<p>Claude no longer has access to your journal.</p>"));
  }));

  // Token exchange endpoint
  router.post("/oauth/token", async (req, res) => {
    const {
      grant_type,
      code,
      client_id,
      client_secret,
      redirect_uri,
      code_verifier,
      refresh_token,
      resource,
    } = req.body;

    // Validate client identity. MCP_TOKEN is now only the client secret;
    // it is never handed out as an access token.
    const expectedSecret = process.env.MCP_TOKEN;
    if (!process.env.OAUTH_CLIENT_ID || !expectedSecret) {
      return res.status(503).json({ error: "server_error", error_description: "OAuth not configured" });
    }
    if (!clientIdMatches(client_id) || !safeEqual(client_secret, expectedSecret)) {
      return res.status(401).json({ error: "invalid_client" });
    }

    try {
      if (grant_type === "authorization_code") {
        const stored = typeof code === "string" ? authCodes.get(code) : undefined;
        if (typeof code === "string") authCodes.delete(code); // single use
        if (!stored || Date.now() > stored.expiresAt) {
          return res.status(400).json({ error: "invalid_grant", error_description: "Authorization code expired or invalid" });
        }
        if (redirect_uri !== stored.redirectUri) {
          return res.status(400).json({ error: "invalid_grant", error_description: "redirect_uri mismatch" });
        }
        if (typeof code_verifier !== "string" || !verifyPkce(code_verifier, stored.codeChallenge)) {
          return res.status(400).json({ error: "invalid_grant", error_description: "PKCE verification failed" });
        }
        if (!resourceMatches(req, resource)) {
          return res.status(400).json({ error: "invalid_target" });
        }
      } else if (grant_type === "refresh_token") {
        if (typeof refresh_token !== "string" || !(await consumeRefreshToken(refresh_token))) {
          return res.status(400).json({ error: "invalid_grant", error_description: "Refresh token expired or invalid" });
        }
      } else {
        return res.status(400).json({ error: "unsupported_grant_type" });
      }

      const { accessToken, refreshToken } = await issueTokenPair();
      res.set("Cache-Control", "no-store");
      res.json({
        access_token: accessToken,
        token_type: "bearer",
        expires_in: ACCESS_TOKEN_TTL_SECONDS,
        refresh_token: refreshToken,
      });
    } catch (err) {
      console.error("[oauth] token error", err);
      res.status(500).json({ error: "server_error" });
    }
  });

  return router;
}
