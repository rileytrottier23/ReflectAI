# ReflectAI

An AI journaling app. You write one entry a day and rate how happy you felt from 1 to 10. At the end of each month, and each year, Claude writes you a report on the patterns in what you wrote, with specific observations drawn from your own entries rather than generic wellness advice.

Live at [reflectai.net](https://reflectai.net). I wrote about building it here: [How I built ReflectAI, an AI journaling app](https://personal-site-production-7acd.up.railway.app/posts/building-reflectai/).

## Features

- **Calendar-based journal**: one entry per day, organized by date
- **Happiness tracking**: a 1–10 score on every entry
- **Monthly and yearly reports**: Claude identifies patterns, cites specific entries and suggests next steps; reports are saved so you can look back on them
- **Accounts**: email and password sign-in with email verification, plus optional Google sign-in

## Privacy and safety

- Every read and write is scoped to the signed-in user at the storage layer, so an entry ID or date alone is never enough to reach someone's data.
- The database allows only one entry per user per day.
- Journal text is treated as untrusted input when it's sent to the model: entries are wrapped in delimiter tags, the model is told to ignore any instructions inside them, and responses are parsed as structured JSON.

## Stack

- **Frontend**: React 18, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend**: Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better Auth (self-hosted), bridged to local user records by verified email
- **AI**: Anthropic Claude
- **Hosting**: Railway

## Running locally

1. `npm install`
2. Set environment variables (e.g. in a `.env` file):
   - `DATABASE_URL`: Postgres connection string
   - `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`: Better Auth settings
   - `ANTHROPIC_API_KEY`: for reports
   - `RESEND_API_KEY` and `EMAIL_FROM`: for verification and password-reset emails
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: optional, enables Google sign-in
3. `npm run db:push` to create the tables
4. `npm run dev`, then open http://localhost:5000

To build and run for production: `npm run build`, then `npm start`.

## Related

- [journal-mcp-server](https://github.com/rileytrottier23/journal-mcp-server): a standalone reference version of the MCP server that lets Claude read and write ReflectAI journal entries.

## License

MIT
