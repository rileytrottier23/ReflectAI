import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { authUser, authSession, authAccount, authVerification } from "@shared/schema";
import { sendEmail } from "./email";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const googleEnabled = Boolean(googleClientId && googleClientSecret);

export const auth = betterAuth({
  // BETTER_AUTH_URL (e.g. https://reflectai.net) and BETTER_AUTH_SECRET are
  // read from the environment by Better Auth itself.
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: authUser,
      session: authSession,
      account: authAccount,
      verification: authVerification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // Journal data is bridged to a local user row by email, so an address
    // must be proven before it can be used to sign in.
    requireEmailVerification: true,
    minPasswordLength: 10,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your ReflectAI password",
        text: `Someone asked to reset the password for your ReflectAI account.\n\nReset it here (link expires in 1 hour):\n${url}\n\nIf this wasn't you, you can ignore this email.`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Confirm your email for ReflectAI",
        text: `Welcome to ReflectAI.\n\nConfirm your email address to start journaling:\n${url}\n\nIf you didn't create an account, you can ignore this email.`,
      });
    },
  },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
        },
      }
    : {},
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
});

/**
 * Creates the Better Auth tables if they don't exist yet. Production has no
 * migration step in its deploy, so this runs on every boot and is idempotent.
 * Keep in sync with the auth_* tables in shared/schema.ts.
 */
export async function ensureAuthTables(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS auth_user (
      id text PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      email_verified boolean NOT NULL DEFAULT false,
      image text,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS auth_session (
      id text PRIMARY KEY,
      expires_at timestamp NOT NULL,
      token text NOT NULL UNIQUE,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now(),
      ip_address text,
      user_agent text,
      user_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS auth_session_user_id_idx ON auth_session (user_id);
    CREATE TABLE IF NOT EXISTS auth_account (
      id text PRIMARY KEY,
      account_id text NOT NULL,
      provider_id text NOT NULL,
      user_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
      access_token text,
      refresh_token text,
      id_token text,
      access_token_expires_at timestamp,
      refresh_token_expires_at timestamp,
      scope text,
      password text,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS auth_account_user_id_idx ON auth_account (user_id);
    CREATE TABLE IF NOT EXISTS auth_verification (
      id text PRIMARY KEY,
      identifier text NOT NULL,
      value text NOT NULL,
      expires_at timestamp NOT NULL,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS auth_verification_identifier_idx ON auth_verification (identifier);
  `);
}
