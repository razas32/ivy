# Supabase Migration Plan (From Local Storage)

## 1) Goals
- Migrate persisted app data from browser `localStorage` to Supabase Postgres.
- Keep the app working during migration with no breaking UX changes.
- Avoid monkey patches and keep a clean data-access layer.
- Support your current preference: no user-auth implementation required for initial migration.

## 2) Current Persisted Data Inventory
Current client persistence keys in `lib/storage.ts`:
- `ivy-study-assistant:courses`
- `ivy-study-assistant:tasks`
- `ivy-study-assistant:deadlines`
- `ivy-study-assistant:flashcards`
- `ivy-study-assistant:quizzes`
- `ivy-study-assistant:generated-assets`
- `ivy-study-assistant:career-reports`

Primary write paths:
- `app/page.tsx` (courses/tasks/deadlines/flashcards/quizzes)
- `app/courses/[id]/page.tsx` (courses/tasks/deadlines)
- `app/cover-letter-generator/page.tsx` (generated-assets)
- `app/resume-analyzer/page.tsx` (career-reports)

## 3) Data Modeling Decisions
### 3.1 Normalize core academic domain
- `courses`, `tasks`, `deadlines` become relational tables.
- `tasks.parent_task_id` remains a self-reference for subtasks.

### 3.2 Keep AI outputs first-class but simple
- Persist flashcards and quizzes as generated sets with child items.
- Persist career artifacts (`cover_letter`, `resume_report`) in a single table.

### 3.3 Remove redundant derived fields where possible
`courses.progress`, `courses.tasksCompleted`, `courses.totalTasks` are derived from tasks today and can drift.
- Plan: compute via query/view; do not treat as source-of-truth.
- Optionally keep cached columns later only if profiling proves needed.

### 3.4 Date handling
Current dates are free-form text (`dueDate`).
- Store both:
  - `due_at timestamptz null` (machine-sortable when parseable)
  - `due_text text` (original user text)

## 4) Target Schema (v1)
### 4.1 Core tables
- `profiles`
  - `id uuid primary key default gen_random_uuid()`
  - `installation_id text unique not null`
  - `created_at timestamptz default now()`
  - `updated_at timestamptz default now()`

- `courses`
  - `id uuid primary key`
  - `profile_id uuid not null references profiles(id) on delete cascade`
  - `code text not null`
  - `name text not null`
  - `color text not null check (color in ('blue','purple','green','orange','red','pink'))`
  - `due_text text not null`
  - `created_at timestamptz default now()`
  - `updated_at timestamptz default now()`

- `tasks`
  - `id uuid primary key`
  - `profile_id uuid not null references profiles(id) on delete cascade`
  - `course_id uuid not null references courses(id) on delete cascade`
  - `parent_task_id uuid null references tasks(id) on delete cascade`
  - `title text not null`
  - `completed boolean not null default false`
  - `created_at timestamptz not null`
  - `due_text text null`
  - `due_at timestamptz null`
  - `priority text null check (priority in ('low','medium','high'))`
  - `description text null`
  - `category text null`
  - Indexes: `(profile_id, course_id)`, `(profile_id, parent_task_id)`, `(profile_id, due_at)`

- `deadlines`
  - `id uuid primary key`
  - `profile_id uuid not null references profiles(id) on delete cascade`
  - `course_id uuid not null references courses(id) on delete cascade`
  - `title text not null`
  - `due_text text not null`
  - `due_at timestamptz null`
  - `priority text not null check (priority in ('low','medium','high'))`
  - `description text null`
  - `created_at timestamptz default now()`
  - Indexes: `(profile_id, course_id)`, `(profile_id, due_at)`

### 4.2 AI output tables
- `study_sets`
  - `id uuid primary key default gen_random_uuid()`
  - `profile_id uuid not null references profiles(id) on delete cascade`
  - `kind text not null check (kind in ('flashcards','quiz'))`
  - `title text not null default 'Generated set'`
  - `created_at timestamptz default now()`

- `flashcards`
  - `id uuid primary key`
  - `study_set_id uuid not null references study_sets(id) on delete cascade`
  - `front text not null`
  - `back text not null`
  - `position int not null default 0`

- `quiz_questions`
  - `id uuid primary key`
  - `study_set_id uuid not null references study_sets(id) on delete cascade`
  - `type text not null check (type in ('mcq','truefalse','fill'))`
  - `prompt text not null`
  - `options jsonb not null default '[]'::jsonb`
  - `answer text not null`
  - `position int not null default 0`

- `career_assets`
  - `id uuid primary key`
  - `profile_id uuid not null references profiles(id) on delete cascade`
  - `type text not null check (type in ('cover_letter','resume_report'))`
  - `title text not null`
  - `content jsonb not null`
  - `created_at timestamptz default now()`
  - Indexes: `(profile_id, type, created_at desc)`

## 5) No-Auth-First Strategy (Recommended for this project now)
You do **not** have to implement Supabase Auth to migrate storage.

Approach:
- Generate and persist `installation_id` in local storage once.
- Backend route handlers map `installation_id -> profiles.id`.
- All DB reads/writes happen server-side (Route Handlers) using service role key.
- Keep public client free of direct table access for now.

Why this is the best fit now:
- Preserves your no-auth requirement.
- Keeps RLS complexity out of phase 1.
- Easy upgrade path: later map `profiles` to `auth.users` if you enable auth.

Security note:
- This is suitable for single-user/personal app usage, not strong multi-user isolation.

## 6) Migration Phases
### Phase 0: Baseline and flags
- Add `NEXT_PUBLIC_DATA_BACKEND=local|supabase` feature flag.
- Add Supabase server client helper and typed repository interfaces.
- Keep `local` as default until parity is validated.

### Phase 1: Create schema migrations
- `supabase/migrations/*_create_profiles.sql`
- `supabase/migrations/*_create_courses_tasks_deadlines.sql`
- `supabase/migrations/*_create_study_sets.sql`
- `supabase/migrations/*_create_career_assets.sql`
- `supabase/migrations/*_indexes_and_updated_at_triggers.sql`

### Phase 2: Repository abstraction
- Introduce interfaces:
  - `CourseRepo`, `TaskRepo`, `DeadlineRepo`, `StudyRepo`, `CareerRepo`
- Implement:
  - `Local*Repo` (existing behavior)
  - `Supabase*Repo` (server-side SQL/SDK)
- Wire pages/routes through repositories, not direct storage calls.

### Phase 3: Write-through migration endpoint
- Add `/api/migrate/local-to-supabase`.
- Input: full exported local payload + `installation_id`.
- Behavior:
  - Idempotent upserts by primary key.
  - Transactional import per entity group.
  - Return per-entity counts and warnings.

### Phase 4: Read-path cutover
- Enable `NEXT_PUBLIC_DATA_BACKEND=supabase` for reads first.
- Keep dual-write (local + supabase) for 1 release cycle.
- Add diff logging in dev to catch data mismatches.

### Phase 5: Full cutover
- Remove local writes, keep local read fallback only for empty remote profile.
- Offer one-time “Import local data” CTA if remote is empty.

### Phase 6: Cleanup
- Remove deprecated local persistence codepaths after stabilization window.
- Keep explicit export/import utilities for backup portability.

## 7) Data Migration Mapping
- `courses[]` -> `courses`
- `tasks[]` -> `tasks` (`parentTaskId` -> `parent_task_id`)
- `deadlines[]` -> `deadlines`
- `flashcards[]` -> one `study_sets(kind='flashcards')` + many `flashcards`
- `quizzes[]` -> one `study_sets(kind='quiz')` + many `quiz_questions`
- `generated-assets[]` -> `career_assets(type='cover_letter', content={draft})`
- `career-reports[]` -> `career_assets(type='resume_report', content=<report json>)`

## 8) Testing Plan
- Unit:
  - Repository contract tests (local vs supabase implementations).
  - Date parsing + `due_at` normalization tests.
- Integration:
  - Create/edit/delete course cascades to tasks/deadlines.
  - Subtask parent-child integrity.
  - Migration endpoint idempotency (run twice, same result).
- E2E:
  - Dashboard CRUD parity.
  - Course details updates reflected in calendar.
  - Flashcard/quiz generation persistence and reload behavior.

## 9) Known Risks and Mitigations
- Free-form date strings may be unparsable.
  - Mitigation: always preserve `due_text`; parse best-effort into `due_at`.
- Redundant progress fields can drift.
  - Mitigation: compute from tasks in query/view.
- No-auth model weak for shared environments.
  - Mitigation: keep server-only DB access in phase 1, add auth later if needed.

## 10) Definition of Done
- All current localStorage-backed features read/write via Supabase repositories.
- Local import runs once and is idempotent.
- No data loss for courses/tasks/deadlines/AI artifacts.
- Existing UX and route behavior unchanged.
- Typed checks and build pass.
