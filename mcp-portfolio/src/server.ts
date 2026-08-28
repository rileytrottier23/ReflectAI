/**
 * Entry point — wires together the Express app, OAuth router, and MCP endpoint.
 *
 * Run:
 *   cp .env.example .env   # fill in your values
 *   npm run dev
 *
 * Then point your MCP client at http://localhost:3000/mcp.
 */

import express from "express";
import { createOAuthRouter } from "./oauth.js";
import { mcpAuthMiddleware } from "./mcpAuth.js";
import { handleMcpRequest } from "./mcp.js";
import { InMemoryJournalStore } from "./journalStore.js";

const app = express();

// Body parsers — must come before routes that read req.body
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// OAuth 2.0 endpoints (metadata, consent page, token exchange)
app.use(createOAuthRouter());

// MCP endpoint — stateless Streamable HTTP transport
const store = new InMemoryJournalStore();

app.post("/mcp", mcpAuthMiddleware, async (req, res) => {
  try {
    await handleMcpRequest(store, req, res);
  } catch (err) {
    console.error("[mcp] unhandled error", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal MCP error" });
    }
  }
});

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Journal MCP server listening on port ${port}`);
  console.log(`  MCP endpoint:      POST http://localhost:${port}/mcp`);
  console.log(`  OAuth metadata:    GET  http://localhost:${port}/.well-known/oauth-authorization-server`);
  console.log(`  Consent page:      GET  http://localhost:${port}/oauth/authorize`);
});
