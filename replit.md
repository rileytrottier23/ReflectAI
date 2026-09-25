# ReflectAI - Personal Journal Application

## Overview

ReflectAI is a full-stack personal journaling application that combines traditional journaling with AI-powered insights. The application provides users with a secure platform to write daily journal entries, track their emotional well-being through happiness scores, and receive personalized counselor reports generated using OpenAI's GPT models.

## System Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript, Vite for build tooling
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Authentication**: Better Auth (self-hosted, email/password + Google)
- **AI Integration**: OpenAI GPT for generating counselor reports
- **Query Management**: TanStack Query (React Query)

### Architecture Pattern
The application follows a monorepo structure with clear separation between client, server, and shared code:
- **Client**: React SPA serving the user interface
- **Server**: RESTful API handling authentication, data persistence, and AI services
- **Shared**: Common TypeScript types and database schemas

## Key Components

### Frontend Architecture
- **Component-based UI**: Built with React functional components and hooks
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with custom color palette (sage green/beige theme)
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Better Auth React client (`client/src/lib/auth-client.ts`), with custom sign-in/sign-up pages in `client/src/pages/auth.tsx`

### Backend Architecture
- **RESTful API**: Express.js with TypeScript providing structured endpoints
- **Authentication**: Better Auth mounted at `/api/auth/*` (`server/auth.ts`) with cookie-based sessions stored in Postgres
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe queries
- **AI Service**: OpenAI integration for generating counselor reports
- **Auth Bridge**: Email-based JIT provisioning links Better Auth sessions (verified emails only) to local `users` rows

### Database Design
- **Users Table**: Stores local app data; email is the bridge column linking to Better Auth identity
- **auth_* Tables**: Better Auth users, sessions, accounts and verification tokens; created on startup by `ensureAuthTables()`
- **Journal Entries Table**: Stores daily entries with content, happiness scores, and dates
- **Sessions Table**: Legacy table kept for backwards compatibility — not actively used
- **Unique Constraints**: One journal entry per user per date

## Data Flow

### Authentication Flow
1. User signs in/up on `/sign-in` or `/sign-up` with Google or email/password (email must be verified)
2. Better Auth issues a session cookie; sessions are stored in `auth_session`
3. `requireAuth` middleware bridges the Better Auth session to a local `users` row by verified email (JIT)
4. Protected routes use `req.dbUser.id` for all database queries

### Journal Entry Flow
1. User selects date from calendar widget
2. Client fetches existing entry or creates new form
3. User writes content and sets happiness score (1-10)
4. Auto-save functionality prevents data loss
5. Server validates and stores entry in database

### AI Report Generation Flow
1. User selects month/year for analysis
2. Server fetches all journal entries for specified period
3. Entries sent to OpenAI API with structured prompt
4. AI generates recommendations, analysis, and monthly score
5. Report displayed with visual metrics and insights

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: Database connection for PostgreSQL
- **drizzle-orm**: Type-safe ORM for database operations
- **openai**: Official OpenAI API client
- **better-auth**: Authentication (server + React client)
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **zod**: Runtime type validation

### UI Libraries
- **@radix-ui/***: Accessible UI primitives for components
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant management

## Deployment Strategy

### Development Environment
- **Vite Dev Server**: Hot module replacement for frontend
- **TSX Runtime**: Direct TypeScript execution for backend
- **Local Database**: PostgreSQL connection via DATABASE_URL

### Production Build
- **Frontend**: Vite builds React app to static files
- **Backend**: ESBuild compiles TypeScript to Node.js bundle
- **Single Server**: Express serves both API and static files
- **Environment Variables**: Required for database, auth, and AI API

### Required Environment Variables
- `DATABASE_URL` / `NEON_DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Random secret (32+ chars) used to sign sessions
- `BETTER_AUTH_URL`: Public base URL, e.g. `https://reflectai.net`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Google OAuth client; redirect URI is `<BETTER_AUTH_URL>/api/auth/callback/google`. Google sign-in is hidden when unset
- `RESEND_API_KEY` / `EMAIL_FROM`: Sends verification and password-reset emails. When unset, emails are logged instead of sent
- `AI_INTEGRATIONS_OPENAI_API_KEY`: Replit AI Integrations API key (auto-managed)
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: Replit AI Integrations base URL (auto-managed)
- `NODE_ENV`: Environment setting (development/production)

## Security Features

### Authentication Security
- **Better Auth identity**: Password hashing (scrypt), session issuance and OAuth handled by Better Auth
- **Email-based JIT bridge**: `requireAuth` looks up the local user by the session's email, and only if that email is verified
- **Cookie-based sessions**: Web auth uses Better Auth session cookies — no bearer tokens in browser requests
- **AI Report Rate Limiting**: Limited to 5 report generations per hour per IP

### Application Security
- **Security Headers**: Helmet.js providing X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, CORP, COOP, Referrer-Policy, X-DNS-Prefetch-Control
- **Prompt Injection Protection**: Journal entries wrapped in delimiter tags with instructions to AI to ignore embedded commands
- **Content Truncation**: Journal entries truncated to 5,000 characters before AI processing

## Changelog
```
Changelog:
- June 30, 2025. Initial setup
- July 29, 2025. Updated AI counselor prompt to use therapeutic approach: compassionate yet direct tone, pattern identification, specific feedback on emotional wellbeing, and actionable recommendations tied to observed behaviors. Added spell check functionality with red wavy underlines and right-click corrections.
- February 2, 2026. Security hardening: Switched to PostgreSQL session storage, added rate limiting, account lockout, password complexity requirements, security headers (Helmet), request size limits, AI prompt injection protection. Migrated to Replit AI Integrations for OpenAI.
- February 21, 2026. Comprehensive security review and fixes: Added rate limiting, fixed user enumeration on registration, removed GET logout handler, added Helmet security headers, enforced SESSION_SECRET, stripped password from deserialized user objects, sanitized error logging, added account lockout after 10 failures, changed cookie name to __reflectai_sid, added prompt injection protection.
- August 14, 2026. Migrated authentication from Passport.js local strategy to Clerk (Replit-managed). Auth now uses Clerk session cookies; local users table bridged by email via JIT provisioning in requireAuth middleware.
- September 25, 2026. Replaced Clerk with self-hosted Better Auth (email/password with verification, password reset, Google). Same email bridge to local users rows.
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```
