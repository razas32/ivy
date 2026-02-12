# Ivy – Detailed Implementation Plan

## Scope
Address two partially built areas:
- Career tools (Resume Analyzer + Cover Letter Generator) — move from UI stubs to functional flows.
- Planner depth — richer task management, calendar view, uploads, and analytics.

## Milestones & Order
1) Backend & persistence foundation  
2) Resume Analyzer parsing + scoring  
3) Cover Letter drafting with real LLM  
4) Planner depth (tasks inside courses, calendar)  
5) File uploads into Study Assistant  
6) Progress analytics rollups  
7) Testing & hardening

---

## 1) Backend & Persistence (Supabase target)
- **Data models**: users, courses, tasks, deadlines, uploads, generated_assets (flashcards/quizzes), career_reports.
- **API surface**: REST or RPC routes for CRUD; auth guard (email magic link or OAuth); RLS policies per user.
- **Client data hooks**: replace `loadFromStorage/saveToStorage` with Supabase client calls + SWR/React Query; keep a localStorage fallback for demo mode.
- **File storage**: Supabase Storage bucket `uploads` with signed URLs; 10MB limit; MIME validation.
- **Env/config**: add `.env.example`, Supabase keys, and a “demo mode” flag to bypass network when offline.

## 2) Resume Analyzer (functional)
- **Upload & parse**: accept PDF only; route `POST /api/resume/analyze`; use `pdf-parse` or `pdfjs-dist` server-side; size guard (<=10MB), page guard (<=15).
- **JD capture**: required text payload; strip HTML if pasted from ATS.
- **Comparison logic** (MVP deterministic):
  - Extract noun phrases/skills via keyword list + simple TF-IDF.
  - Compute match score = (matched keywords / unique JD keywords) * 100.
  - Surface: matched keywords, top 5 missing keywords, seniority cues.
- **LLM insights**:
  - Prompt to produce 5 prioritized resume edits (bullets to add/adjust).
  - Rate limit per user (5/min), retry with backoff; structured JSON schema.
- **UX**: progress states (upload → parsing → scoring → recommendations); show extracted text preview (first 1k chars); copy buttons; graceful error toasts.
- **Telemetry**: log timing + token usage (without PII).

## 3) Cover Letter Generator (LLM-backed)
- **Inputs**: JD text (required), resume summary (from analyzer output) or pasted text, optional tone preset.
- **API**: `POST /api/cover-letter/generate`; schema returns `draft`, `outline`, `keywords_used`.
- **Prompting**: build system + user prompt with JD highlights and resume achievements; enforce length (~300–400 words) and ATS-friendly formatting (plain text).
- **Safeguards**: profanity filter on inputs; truncate overly long resumes; same rate limit as analyzer.
- **UX**: live spinner, “insert missing details” checklist, one-click copy, save to Supabase `generated_assets`.

## 4) Planner Depth
- **Per-course task board** (`app/courses/[id]`):
  - Inline quick-add, priority, category/label, due date.
  - Subtasks: simple nested list stored with parent task id.
  - Completion toggles sync course progress.
- **Calendar/Deadline view** (`/calendar`):
  - Month/week toggle; color by course; click-through to course/task.
  - Sources: tasks with due dates + deadlines; show “TBD” bucket in sidebar.
  - Timezone-safe date helpers (centralized in `lib/deadlineUtils`).
- **Reminders (later if time)**: optional client notifications for due-soon items.

## 5) File Uploads for Lecture Notes (Study Assistant)
- **UI**: reuse drag/drop in StudyAssistant; allow PDF/TXT; show file chips.
- **Backend**: upload to storage, extract text server-side; pass text to `/api/chat` with generationType `course|flashcards|quiz`.
- **Safety**: size/page caps; OCR defer until needed; clear “processing” states.

## 6) Progress Analytics
- **Metrics**: tasks completed vs total, burn-down by week, deadlines by urgency, course health (on-track/at-risk).
- **Implementation**: helper in `lib/analytics.ts` to bucket by date; memoized selectors; feed dashboard cards + charts (lightweight chart lib or custom SVG).
- **Exports**: allow CSV export of tasks/deadlines for demos.

## 7) Testing & Hardening
- **Unit**: deadline/time bucketing, task progress calc, keyword extraction scoring.
- **Integration**: `/api/resume/analyze` (happy path, oversize PDF, empty JD), `/api/cover-letter/generate` schema compliance, `/api/chat` flashcard/quiz JSON schema parsing.
- **E2E (Playwright/Cypress)**: create course → add tasks → calendar renders; upload outline → tasks populate; resume upload → recommendations shown.
- **Error handling**: standardized error objects, user-friendly toasts, and logging without sensitive payloads.

## Dependencies & Tooling
- Add `pdf-parse` (server), `langchain` optional, `zod` for runtime validation, `rate-limiter-flexible` or simple in-memory limiter, `@supabase/supabase-js`, `react-query` or `swr`.
- Update `package.json` scripts: `test:unit`, `test:integration`, `test:e2e`, `lint:types`.

## Acceptance Criteria (per milestone)
- **Resume Analyzer**: Upload PDF + JD → returns match score, matched/missing keywords, and 5 actionable resume edits; handles oversize file with clear error.
- **Cover Letter**: JD + resume summary → returns draft within 10s, saved asset entry, copy works.
- **Planner Depth**: Course page shows tasks with priority/labels/subtasks; calendar page displays all dated items; progress updates when tasks toggle.
- **Uploads & Analytics**: StudyAssistant ingests uploaded notes; analytics cards render with real data from backend.
- **Tests**: Unit + integration suites pass; one happy-path E2E green.

## Risks & Mitigations
- **LLM latency/cost**: keep short context; stream output; cache per JD hash; enforce rate limits.
- **PDF variability**: add text-length truncation and graceful fallback message when extraction fails.
- **Date handling**: centralize parsing with timezone awareness; add unit tests around edge cases.
- **Supabase availability**: keep “demo/local” mode using localStorage if env keys missing.
