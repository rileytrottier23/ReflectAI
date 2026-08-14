import { getAuth } from "@clerk/express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Clerk-based requireAuth middleware.
 * - Rejects unauthenticated requests with 401.
 * - Bridges the Clerk session to a local users row by email (email bridge).
 * - JIT-provisions a new row on first authenticated request if none exists.
 * - Sets req.dbUser so route handlers can use req.dbUser.id for DB queries.
 */
export async function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const email = auth?.sessionClaims?.email as string | undefined;

  if (!email) {
    return res.status(401).json({ message: "Please log in to continue" });
  }

  try {
    // Look up local user by email (bridge column)
    let [dbUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!dbUser) {
      // JIT-provision: create local row on first authenticated request.
      // Use a sentinel password value since Clerk now owns authentication.
      const [inserted] = await db
        .insert(users)
        .values({ email, password: "__clerk_managed__" })
        .onConflictDoNothing()
        .returning();

      if (inserted) {
        dbUser = inserted;
      } else {
        [dbUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      }
    }

    if (!dbUser) {
      return res.status(401).json({ message: "Please log in to continue" });
    }

    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error("requireAuth error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
}
