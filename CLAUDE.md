# CLAUDE.md — ReflectAI

Read `SPEC.md` first. It says what this app is, what must stay true, and what we're not building.

## How to work with Riley
- Plan before coding. For anything bigger than a small fix, write a short plan and wait for a yes.
- If a change isn't in `SPEC.md`, say so and ask whether to update the spec first.
- Push back. If an idea is weak, risky or out of scope, say why. Don't just agree.
- Explain changes in plain language. Riley is a PM, not a full-time engineer.
- Show a task list for multi-step work.

## Commands
| Task | Command |
|---|---|
| Install | `npm install` |
| Dev server (port 5000) | `npm run dev` |
| Typecheck | `npm run check` |
| Build | `npm run build` |
| Push DB schema | `npm run db:push` |

## Layout
- `client/` React app (Vite, Wouter, TanStack Query, shadcn/ui)
- `server/` Express API: `routes.ts`, `storage.ts` (all DB access), `auth.ts` (Better Auth), `ai-service.ts` (Claude reports), `mcp.ts` + `oauth.ts` (Claude connection), `field-crypto.ts` (encryption)
- `shared/` Drizzle schema and shared types

## Rules
- **Tests:** there's no test runner yet. When adding or changing logic, add Vitest and write tests for it. A feature isn't done until its tests pass and `npm run check` is clean.
- **User scoping:** every query in `storage.ts` filters by the signed-in user's ID. Never add a query that doesn't.
- **Encryption:** entries and reports are encrypted with `JOURNAL_ENCRYPTION_KEY`. Never log decrypted text or change how the key is used without asking.
- **Prompts:** keep journal text wrapped in delimiter tags and parse model output as JSON.
- **Secrets:** never commit `.env` or keys. This repo is public.
- **Schema changes:** say what `db:push` will change and ask before running it against a real database.
- `replit.md` is older notes and is partly out of date. Where it conflicts with the code, trust the code.

## Deploy
Railway deploys from `main`. CI runs on every push and PR.
