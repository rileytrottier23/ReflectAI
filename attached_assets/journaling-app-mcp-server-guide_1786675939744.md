# Turning Your Journaling App into an MCP Server

## The big decision first: local vs. remote

| | **Local (stdio)** | **Remote (HTTP)** |
|---|---|---|
| Works with | Claude Code / Claude Desktop only, on your machine | claude.ai, mobile app, Claude Desktop, Cowork — anywhere you're logged in |
| Hosting | None — runs as a subprocess | Needs a public HTTPS URL, always reachable |
| Auth | Not really needed | You should add at least a bearer token |
| Effort | Lower | A bit higher, but not much on Replit |

Since you said "connect it to Claude" generally (not "connect it to Claude Code"), you almost certainly want **remote**. That's the path this guide covers. If you only ever want this in Claude Code on your laptop, skip to the note at the bottom — it's much simpler.

---

## Step 1 — Decide your tool surface

MCP "tools" are the functions Claude will be able to call. Keep the first version small and mostly read/create — skip destructive tools (`delete_entry`, `delete_all`) until you trust the setup.

A reasonable starting set for a journaling app:

| Tool | Purpose |
|---|---|
| `create_entry` | Write a new journal entry (text, optional mood/tags) |
| `list_recent_entries` | Pull the last N entries |
| `search_entries` | Keyword or date-range search |
| `get_entry` | Fetch one entry by ID |
| `get_mood_summary` | Aggregate mood/tag trends over a period (if you track mood) |

## Step 2 — Add an MCP endpoint to your existing Repl

Don't build a separate app — add a route to your existing server so it reuses your current DB connection. Install the SDK in your Repl's shell:

```bash
npm install @modelcontextprotocol/sdk zod
```
*(Python equivalent: `pip install mcp` — FastMCP has a similarly concise API if your app is Flask/FastAPI instead of Node.)*

Create `mcp-server.js` (or add to your existing server file):

```javascript
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

// import your existing DB/ORM layer here
// import { db } from "./db.js";

const server = new McpServer({ name: "journal-mcp", version: "1.0.0" });

server.tool(
  "create_entry",
  "Create a new journal entry for the user",
  {
    text: z.string().describe("The journal entry content"),
    mood: z.string().optional().describe("Optional mood, e.g. 'good', 'stressed'"),
  },
  async ({ text, mood }) => {
    const entry = await db.createEntry({ text, mood, date: new Date() });
    return { content: [{ type: "text", text: `Saved entry ${entry.id} (${entry.date})` }] };
  }
);

server.tool(
  "search_entries",
  "Search journal entries by keyword",
  { query: z.string().describe("Keyword to search for") },
  async ({ query }) => {
    const results = await db.searchEntries(query);
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "list_recent_entries",
  "List the most recent journal entries",
  { count: z.number().default(5).describe("How many entries to return") },
  async ({ count }) => {
    const results = await db.listRecent(count);
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

// --- Wire up HTTP transport ---
const app = express();
app.use(express.json());

// simple auth check — see Step 4
app.use("/mcp", (req, res, next) => {
  const auth = req.headers["authorization"];
  if (auth !== `Bearer ${process.env.MCP_TOKEN}`) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
});

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(process.env.PORT || 3000, () => console.log("MCP server running"));
```

> The MCP SDK's exact API shifts occasionally — if something doesn't match, check the README at `@modelcontextprotocol/sdk` on npm for the current `StreamableHTTPServerTransport` signature. The shape above (tool → zod schema → handler → text content) has been stable.

**Fastest path:** paste this whole guide into Replit's Agent chat inside your existing journaling Repl and ask it to wire the tools up to your actual data layer. Since the app's already vibe-coded, this is a very natural next prompt for it.

## Step 3 — Test locally before deploying

```bash
npx @modelcontextprotocol/inspector
```
Point it at `http://localhost:3000/mcp`, confirm your tools show up in "List Tools," and try calling `create_entry` manually. Fix issues here — much faster than debugging through Claude's UI.

## Step 4 — Add a bearer token (don't skip this)

This is your personal journal — don't leave the endpoint open to anyone who finds the URL.

1. In Replit, open **Secrets** and add `MCP_TOKEN` = some long random string.
2. The middleware in the code above already checks for `Authorization: Bearer <token>`.
3. You'll paste this same token into Claude's connector setup in Step 6.

(OAuth is the more "correct" long-term answer, but it's overkill for a single-user personal tool — a fixed token is fine here.)

## Step 5 — Deploy on Replit

Click **Deploy** in your Repl:
- **Autoscale** — good default for a low-traffic personal tool; you only pay for actual requests.
- **Reserved VM** — better if you notice cold-start delays annoying you, since it never sleeps.

Either way, note the resulting `https://your-app.replit.app` URL (or your custom domain) — this is what you'll give Claude. Your MCP endpoint will be `https://your-app.replit.app/mcp`.

## Step 6 — Connect it as a Custom Connector in Claude

1. In claude.ai, go to **Settings → Connectors** (or the **+** button in a chat).
2. Click **Add custom connector**.
3. Paste `https://your-app.replit.app/mcp`.
4. Under **Advanced settings**, add a request header: `Authorization: Bearer <your MCP_TOKEN>` (this header feature is in beta rollout — if you don't see it yet, OAuth is the fallback).
5. Save, then enable the connector for a conversation.

## Step 7 — Test and iterate

Try prompts like:
- "Log a journal entry: had a good squash session, feeling good about the week."
- "What have I written about sleep training in the last month?"
- "Summarize my mood over the past two weeks."

Once it's working, expand the tool set — add `update_entry`, tag-based filtering, or a `get_mood_summary` resource. Keep tool **descriptions** specific and action-oriented; Claude decides which tool to call based on that text, so vague descriptions lead to wrong tool picks.

---

## If you only want this in Claude Code (simpler path)

Skip deployment and auth entirely. Use `StdioServerTransport` instead of the HTTP transport, run the server as a local script, and register it with:

```bash
claude mcp add journal -- node /path/to/mcp-server.js
```

No public URL, no token — but it only works on the machine you run it on.

---

### References
- MCP protocol & TypeScript SDK: modelcontextprotocol.io
- Claude custom connectors (remote MCP): support.claude.com — "Get started with custom connectors using remote MCP"
- Replit deployment types: docs.replit.com/features/publishing/deployment-types
