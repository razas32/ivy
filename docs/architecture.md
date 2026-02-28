# Ivy Architecture

## Overview

Ivy is a Next.js App Router application with client-rendered product surfaces and server routes for persistence, authentication, uploads, and AI orchestration.

## Major Flows

### Authentication

- Auth is handled with app-managed users and session cookies.
- Session helpers live in `lib/server/auth.ts`.
- Most write actions and AI routes require an authenticated user.

### Persistence

- The client loads bootstrap data from `/api/data/bootstrap`.
- Server routes persist app state through Supabase REST helpers in `lib/server/supabaseRest.ts`.
- Client pages keep local UI state but sync durable records through the API layer in `lib/clientApi.ts`.

### AI Requests

- AI routes currently live under `app/api/chat`, `app/api/resume/analyze`, and `app/api/cover-letter/generate`.
- Shared key resolution lives in `lib/server/openai.ts`.
- Request precedence is:
  1. user-provided API key from request header
  2. server `OPENAI_API_KEY`
  3. route-specific fallback behavior when implemented

### Client-Side BYOK

- The browser stores a user-supplied OpenAI key in local storage only.
- The key is attached to AI requests through a dedicated request header.
- The key is not written to Supabase or server-side storage.

## Important Tradeoffs

- The app mixes mock bootstrap defaults with persisted data to keep development friction low.
- AI orchestration is route-local today; prompt logic is not yet centralized.
- Rate limiting is lightweight and in-process, which is fine for development but not enough for larger deployments.

## Near-Term Improvements

- add automated tests around AI key resolution and fallback behavior
- centralize prompt/version management
- document deployment expectations for Supabase and self-hosted OpenAI usage
