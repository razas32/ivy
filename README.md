# Ivy

Ivy is a student workspace built with Next.js that combines course planning, deadline tracking, and AI-assisted study workflows in one app.

The current product includes:

- a dashboard with course, task, and deadline overview
- an AI study assistant for chat, course extraction, flashcards, and quizzes
- a calendar view for dated and TBD work
- a resume analyzer for ATS keyword matching
- a cover letter generator for job-specific drafts
- lightweight auth plus Supabase-backed persistence

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase REST API
- OpenAI API

## Product Areas

### Academic workspace

- create, edit, and delete courses
- track tasks and deadlines
- export tasks and deadlines as CSV
- review workload in dashboard and calendar views

### AI workspace

- chat with uploaded PDF or text context
- extract course structure from syllabi or notes and turn it into app data
- generate flashcards from source material
- generate quiz questions for self-testing

### Career tools

- upload a resume PDF and compare it against a job description
- generate prioritized resume edits
- draft ATS-friendly cover letters with tone presets

## Architecture Notes

- UI uses client-rendered pages and components under `app/` and `components/`.
- Core data is loaded from `/api/data/bootstrap`.
- Auth is cookie-based and handled in [`lib/server/auth.ts`](./lib/server/auth.ts).
- Persistence is backed by Supabase through [`lib/server/supabaseRest.ts`](./lib/server/supabaseRest.ts).
- AI features currently run through server routes in `app/api/`.

## Local Development

### Requirements

- Node.js 18+
- npm
- Supabase project with the included SQL migration applied
- OpenAI API key for AI features

### Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env.local
```

3. Fill in the required values in `.env.local`.

4. Apply the Supabase migration in [`supabase/migrations/20260213170000_initial_auth_and_data.sql`](./supabase/migrations/20260213170000_initial_auth_and_data.sql).

5. Start the app:

```bash
npm run dev
```

6. Open `http://localhost:3000`.

## Environment Variables

See [`.env.example`](./.env.example) for the canonical list.

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `OPENAI_API_KEY`

If `OPENAI_API_KEY` is missing, parts of the career tooling fall back to deterministic non-AI responses. The main chat and study-generation flows require an API key.

## Scripts

- `npm run dev` starts the local dev server
- `npm run build` builds the production app
- `npm start` serves the production build
- `npm run lint` runs the TypeScript check
- `npm run test:unit` placeholder today
- `npm run test:integration` placeholder today
- `npm run test:e2e` placeholder today

## Current Gaps

These are real, known gaps in the repository today:

- automated tests are not wired up yet
- README-level deployment documentation is still minimal
- AI key handling is server-owned by default rather than bring-your-own-key
- some UI copy and branding are inconsistent with the underlying implementation

## Open Source Direction

The intended direction is to support a bring-your-own-key model so self-hosters can use their own API credentials rather than relying on a project-owned key. That work fits the current architecture and is a near-term improvement target.
