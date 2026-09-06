import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// SSL is derived from DATABASE_URL itself (e.g. a hosted Postgres that sets
// ?sslmode=require) rather than forced from NODE_ENV — Railway's own Postgres
// has no SSL listener at all, so forcing it here broke every connection.
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
