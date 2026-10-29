# ReflectAI — Spec

> Living spec. Update it before changing what the app does. Items marked *(draft)* are Claude's best reading of the current app and need Riley's confirmation.

## What it is
A journaling app. You write one entry a day and rate how happy you felt (1–10). Each month and year, Claude writes a report on patterns in your entries, citing specific entries rather than giving generic advice.

Live at https://reflectai.net. Hosted on Railway.

## Who it's for
- Riley, as a daily journal.
- A small number of people who want honest, specific feedback on their own journaling.

## Core features (v1)
| Feature | Notes |
|---|---|
| Calendar journal | One entry per user per day (enforced in the DB) |
| Happiness score | 1–10 on every entry |
| Monthly + yearly reports | Claude finds patterns, cites entries, suggests next steps; reports are saved |
| Accounts | Email/password with verification, optional Google sign-in (Better Auth) |
| Claude connection (MCP) | Lets Claude read and write the signed-in user's entries via OAuth |

## Must stay true
- Every read and write is scoped to the signed-in user at the storage layer.
- Journal entries and saved reports are encrypted at rest.
- Journal text sent to the model is treated as untrusted input (delimiters, ignore embedded instructions, structured JSON output).
- Report generation stays rate-limited to control AI spend.
- Database stays private (no public connection); backups run inside Railway.

## Not building (v1) *(draft)*
- Mobile apps (web only)
- Social or sharing features
- Multiple entries per day
- Therapy or crisis support; reports are reflection, not clinical advice
- Paid plans or billing

## Open questions
- Should `replit.md` be retired now that this spec and CLAUDE.md exist?
