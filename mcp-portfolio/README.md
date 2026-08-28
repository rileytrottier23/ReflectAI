# journal-mcp-server

A reference implementation of a remote MCP (Model Context Protocol) server extracted from a personal journaling app. It exposes journal read/write operations as typed tools that any MCP-compatible agent (Claude, GPT, etc.) can call over HTTP.

Built to demonstrate **agent tool design**, **permission scoping**, and **OAuth 2.0 integration** in a real-world single-user scenario.

---

## What this is

The journaling app this was extracted from stores daily entries with a happiness score (1–10). This MCP layer lets an AI assistant — connected via claude.ai or Claude Desktop — read, write, and analyse those entries on behalf of the owner.

The interesting design challenges this solves:

- **One owner, one agent.** No multi-tenancy required, but the auth model still uses proper OAuth 2.0 so it works with Claude's connector UI without any custom SDK.
- **Bearer token pinned to OAuth secret.** The issued `access_token` is the same value as the bearer token the `/mcp` route checks, so the OAuth consent flow and the API auth layer are a single secret — no separate token store.
- **Stateless transport.** Each HTTP request creates a fresh MCP session. No WebSocket, no persistent server-side session.
- **Storage abstracted behind an interface.** The `JournalStore` interface lets you swap the backing store (in-memory → SQLite → Postgres) without touching the tool definitions.

---

## Architecture

```
claude.ai / Claude Desktop
        │
        │  POST /mcp  (Bearer token)
        ▼
┌─────────────────────────────────────────┐
│  Express app                            │
│                                         │
│  mcpAuth middleware                     │  ← validates bearer token,
│      │                                  │    sets req.mcpUserId
│      ▼                                  │
│  handleMcpRequest()                     │  ← creates MCP session per request
│      │                                  │
│      ▼                                  │
│  McpServer (Streamable HTTP transport)  │
│      │                                  │
│      ▼                                  │
│  JournalStore interface                 │  ← swappable backing store
└─────────────────────────────────────────┘

OAuth endpoints (same server):
  GET  /.well-known/oauth-authorization-server  → RFC 8414 metadata
  GET  /oauth/authorize                         → consent page
  POST /oauth/authorize                         → issue auth code
  POST /oauth/token                             → exchange code for token
```

---

## Tools

| Tool | Description |
|---|---|
| `create_entry` | Create a journal entry for a given date (one per day). Returns an error if an entry already exists for that date. |
| `update_entry` | Edit the content and/or happiness score of an existing entry by date. |
| `delete_entry` | Permanently remove an existing entry by date; requires an explicit `DELETE` confirmation value. |
| `list_recent_entries` | Return the N most recent entries, newest first. |
| `get_entry` | Fetch a single entry by date (YYYY-MM-DD). |
| `search_entries` | Case-insensitive keyword search across all entry content, newest first. |
| `get_mood_summary` | Aggregate happiness scores across a date range — average, min, max, and a count by score tier (low/mid/high). |

All tools are defined with Zod schemas so the MCP SDK generates accurate JSON Schema for the agent's tool-use call.

---

## Auth model

### Bearer token (primary)

Every `POST /mcp` request must include:

```
Authorization: Bearer <MCP_TOKEN>
```

On a 401 the server returns a `WWW-Authenticate` header pointing to the OAuth metadata URL, which allows MCP clients that support dynamic discovery to kick off the OAuth flow automatically.

### OAuth 2.0 (for claude.ai connector UI)

Claude's connector UI only accepts OAuth credentials, not raw bearer tokens. This server implements a minimal Authorization Code flow (RFC 6749) with PKCE (RFC 7636) and server metadata (RFC 8414):

1. Claude fetches `/.well-known/oauth-authorization-server` to discover endpoints.
2. Claude redirects the user to `/oauth/authorize` — a consent page served by this server.
3. The user clicks **Allow**. The server issues a one-time auth code (5-minute TTL).
4. Claude exchanges the code at `/oauth/token`. The server validates PKCE and returns `MCP_TOKEN` as the `access_token`.
5. Claude uses the token as a bearer token on all subsequent `/mcp` calls.

**Credentials to enter in Claude's connector UI:**

| Field | Value |
|---|---|
| OAuth Client ID | `claude` (or whatever you set `OAUTH_CLIENT_ID` to) |
| OAuth Client Secret | your `MCP_TOKEN` value |
| Remote MCP Server URL | `https://your-domain.com/mcp` |

---

## Transport

**Streamable HTTP** (MCP spec §3.2) — the server creates a fresh `StreamableHTTPServerTransport` for every request. This is the simplest MCP transport: no WebSocket handshake, no persistent connection, works through any HTTP reverse proxy.

---

## Running locally

```bash
# 1. Install dependencies
npm install

# 2. Configure secrets
cp .env.example .env
# Edit .env — set MCP_TOKEN, MCP_USER_EMAIL, OAUTH_CLIENT_ID

# 3. Start the dev server (auto-reloads on file changes)
npm run dev
```

The server starts on port 3000 by default. Test with:

```bash
# Should return 401 with WWW-Authenticate header
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Should return tool list
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your MCP_TOKEN>" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# OAuth metadata
curl http://localhost:3000/.well-known/oauth-authorization-server
```

---

## Swapping the backing store

The `JournalStore` interface in `src/journalStore.ts` is the only contract the MCP tools depend on. To use a real database:

1. Implement `JournalStore` against your ORM or query builder of choice.
2. Pass your implementation to `handleMcpRequest(store, req, res)` in `src/server.ts`.

The `InMemoryJournalStore` included here is suitable for local development and testing — data is lost on server restart.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `MCP_TOKEN` | ✅ | Bearer token for `/mcp`. Also issued as the OAuth `access_token`. |
| `MCP_USER_EMAIL` | ✅ | Owner identifier — used as the `userId` passed to `JournalStore`. |
| `OAUTH_CLIENT_ID` | ✅ | OAuth `client_id` (e.g. `claude`). |
| `PORT` | optional | HTTP port, defaults to `3000`. |

---

## Related projects

- [Riley-Claude-Skills](https://github.com/rileytrottier23/Riley-Claude-Skills) — Riley's versioned Claude Skills portfolio: reusable instruction sets for PM workflows, personal finance, and more.

---

## License

MIT
