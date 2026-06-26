---
name: Neon HTTP Driver Zero-Row Bug
description: @neondatabase/serverless neon-http driver crashes on 0-row SELECT queries; fix is to use pg + drizzle-orm/node-postgres instead.
---

# Neon HTTP Driver Zero-Row Bug

## The Rule
Do NOT use `drizzle-orm/neon-http` + `neon()` for this project. Use `drizzle-orm/node-postgres` + `pg.Pool` instead.

**Why:** `@neondatabase/serverless` v0.10.4 (the installed version) throws `TypeError: Cannot read properties of null (reading 'map')` inside `processQueryResult` whenever a SELECT query returns 0 rows. This breaks registration (checking non-existent email), any date-based journal entry lookup with no result, and saved-reports listing for users with no reports.

**How to apply:** `server/db.ts` already uses `pg.Pool` + `drizzle-orm/node-postgres`. If anyone reverts it to neon-http (e.g., following framework docs), registration and empty-list endpoints will break again.

## Confirmed Fix
```ts
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });
```
