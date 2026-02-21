# ReflectAI - Personal Journal Application

## Overview

ReflectAI is a full-stack personal journaling application that combines traditional journaling with AI-powered insights. The application provides users with a secure platform to write daily journal entries, track their emotional well-being through happiness scores, and receive personalized counselor reports generated using OpenAI's GPT models.

## System Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript, Vite for build tooling
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Authentication**: Passport.js with local strategy (email/password)
- **AI Integration**: OpenAI GPT for generating counselor reports
- **Session Management**: Express sessions with PostgreSQL store
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
- **Authentication Context**: Custom auth provider managing user sessions

### Backend Architecture
- **RESTful API**: Express.js with TypeScript providing structured endpoints
- **Authentication Middleware**: Passport.js with session-based authentication
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe queries
- **AI Service**: OpenAI integration for generating counselor reports
- **Session Storage**: PostgreSQL-backed sessions for security

### Database Design
- **Users Table**: Stores user credentials (email/password hash)
- **Journal Entries Table**: Stores daily entries with content, happiness scores, and dates
- **Sessions Table**: Manages user sessions (required for authentication)
- **Unique Constraints**: One journal entry per user per date

## Data Flow

### Authentication Flow
1. User registers/logs in via email/password
2. Server validates credentials and creates session
3. Session cookie sent to client for subsequent requests
4. Protected routes verify authentication before data access

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
- **passport**: Authentication middleware
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
- **Environment Variables**: Required for database, session secret, and OpenAI API

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secure random string for session encryption
- `AI_INTEGRATIONS_OPENAI_API_KEY`: Replit AI Integrations API key (auto-managed)
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: Replit AI Integrations base URL (auto-managed)
- `NODE_ENV`: Environment setting (development/production)

## Security Features

### Authentication Security
- **Rate Limiting**: Login limited to 20 attempts per 15 minutes, registration limited to 5 per hour per IP
- **Account Lockout**: Accounts locked for 1 hour after 10 failed login attempts (in-memory tracking)
- **Password Complexity**: Requires 8+ characters with uppercase, lowercase, numbers, and special characters
- **User Enumeration Prevention**: Registration returns generic messages that don't reveal existing accounts
- **Custom Session Cookie Name**: Uses `__reflectai_sid` instead of default `connect.sid`
- **Password Stripping**: Password hash removed from user objects during session deserialization

### Application Security
- **Security Headers**: Helmet.js providing X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, CORP, COOP, Referrer-Policy, X-DNS-Prefetch-Control
- **Secure Cookies**: HttpOnly, SameSite=lax, and Secure (in production) cookie settings
- **POST-only Logout**: Logout only accepts POST requests to prevent CSRF logout attacks
- **Sanitized Error Logging**: Error details not logged to console to prevent sensitive data exposure

### AI Security
- **Replit AI Integrations**: Uses managed API keys (no user-managed secrets)
- **Prompt Injection Protection**: Journal entries wrapped in delimiter tags with instructions to AI to ignore embedded commands
- **Content Truncation**: Journal entries truncated to 5,000 characters before AI processing
- **AI Report Rate Limiting**: Limited to 5 report generations per hour per IP

## Changelog
```
Changelog:
- June 30, 2025. Initial setup
- July 29, 2025. Updated AI counselor prompt to use therapeutic approach: compassionate yet direct tone, pattern identification, specific feedback on emotional wellbeing, and actionable recommendations tied to observed behaviors. Added spell check functionality with red wavy underlines and right-click corrections.
- February 2, 2026. Security hardening: Switched to PostgreSQL session storage, added rate limiting, account lockout, password complexity requirements, security headers (Helmet), request size limits, AI prompt injection protection. Migrated to Replit AI Integrations for OpenAI.
- February 21, 2026. Comprehensive security review and fixes: Added rate limiting (express-rate-limit) to login/register/AI endpoints, fixed user enumeration on registration, removed GET logout handler, added Helmet security headers, enforced SESSION_SECRET, stripped password from deserialized user objects, sanitized error logging (removed console.error of sensitive data), added account lockout after 10 failures, changed cookie name to __reflectai_sid, added prompt injection protection with delimiter tags and content truncation for AI service.
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```