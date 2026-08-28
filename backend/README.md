# Slotify Backend

Node.js/Express API for Slotify: DB schema, service/availability/booking CRUD, Supabase auth, and AI-powered natural-language rescheduling via OpenRouter.

## Supabase project

A Supabase project (`slotify-booking-app`) has already been created and the schema applied — tables `users`, `services`, `availability`, `bookings`, `reschedule_logs`, all with RLS enabled. New sign-ups get a `public.users` row automatically via a DB trigger.

- Project URL: `https://apzfnmkvvyeqifnfbykw.supabase.co`
- Dashboard: https://supabase.com/dashboard/project/apzfnmkvvyeqifnfbykw

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

`.env.example` already has `SUPABASE_URL` and `SUPABASE_ANON_KEY` filled in. You still need to add:

- `SUPABASE_SERVICE_ROLE_KEY` — Supabase Dashboard → Settings → API → `service_role` secret. The backend uses this key server-side to read/write data; never ship it to web or mobile.
- `OPENROUTER_API_KEY` — get one at https://openrouter.ai/keys. Required for AI reschedule; everything else works without it.

Requires Node 18+ (uses the built-in `fetch` for OpenRouter calls).

## Run

```bash
npm run dev    # nodemon, auto-restart
# or
npm start
```

Server listens on `http://localhost:4000` (`PORT` in `.env`). Health check: `GET /health`.

## Routes implemented

- `GET /api/services` — public, list services
- `GET /api/availability?service_id=&date=YYYY-MM-DD` — public, open slots for a day
- `POST /api/bookings` — authenticated, create a booking
- `GET /api/bookings/me` — authenticated, your bookings
- `PATCH /api/bookings/:id` — authenticated, manual reschedule/cancel (owner or admin)
- `POST /api/bookings/:id/reschedule-ai` — authenticated, natural-language reschedule (see below)
- `GET/POST/PATCH /api/admin/services` — admin-only
- `GET/POST/PATCH /api/admin/availability` — admin-only
- `GET /api/admin/bookings` — admin-only, all bookings

## AI reschedule

`POST /api/bookings/:id/reschedule-ai` with body `{ "message": "move it to Friday afternoon" }`:

1. Sends the message to OpenRouter (`OPENROUTER_MODEL`, default `openai/gpt-4o-mini`) with a system prompt that extracts `{ date, time }` as JSON, grounded on the server's current date.
2. Validates the parsed slot against `availability` and existing `bookings` for that service.
3. Every attempt is logged to `reschedule_logs` (raw message + parsed action + whether the slot was available) — the design doc's AI observability table.
4. If the slot is free: updates the booking (`status: 'rescheduled'`) and returns it.
5. If taken: returns `409` with the parsed `{ date, time }` and up to 3 `nearest_slots` (searching forward up to a week) for the client to offer instead.

Rate-limited to 5 requests/hour per user (in-memory — fine for a single instance; swap for Redis before scaling to multiple backend instances). Swapping models only requires changing `OPENROUTER_MODEL`; no code changes.

## Auth

Protected routes expect `Authorization: Bearer <supabase_session_access_token>`, the same token the Supabase Auth SDK returns on web/mobile after sign-in. The backend validates it against Supabase and loads the matching row from `public.users` (which must have `role` set — `customer` or `admin`) to check permissions.

## Not in this scaffold yet

- Admin panel routes exist, but there's no web UI for them yet
- Email/push notifications on booking confirmation
- Deployment (Render/Railway)
