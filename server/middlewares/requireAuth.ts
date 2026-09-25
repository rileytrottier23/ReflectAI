import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth";
import { db } from "../db";
import { users } from "@shared/schema";
import { sql } from "drizzle-orm";

/**
 * Better Auth-based requireAuth middleware.
 * - Rejects unauthenticated requests with 401.
 * - Bridges the Better Auth session to a local users row by email (email bridge).
 *   Only verified emails are bridged, so nobody can claim another person's
 *   journal by registering with their address.
 * - JIT-provisions a new row on first authenticated request if none exists.
 * - Sets req.dbUser so route handlers can use req.dbUser.id for DB queries.
 */
export async function requireAuth(req: any, res: any, next: any) {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const email = session?.user.emailVerified ? session.user.email.toLowerCase() : undefined;

    if (!email) {
      return res.status(401).json({ message: "Please log in to continue" });
    }

    // Look up local user by email (bridge column)
    let [dbUser] = await db.select().from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);

    if (!dbUser) {
      // JIT-provision: create local row on first authenticated request.
      // Use a sentinel password value since Better Auth owns authentication.
      const [inserted] = await db
        .insert(users)
        .values({ email, password: "__better_auth_managed__" })
        .onConflictDoNothing()
        .returning();

      if (inserted) {
        dbUser = inserted;
      } else {
        [dbUser] = await db.select().from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
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
