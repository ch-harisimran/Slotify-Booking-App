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

- `GET /api/services` — public, list doctors (the `services` table doubles as the doctor-profile table — `specialty`, `photo_url`, `rating`, `reviews_count`, `experience_years`, `bio`, `why_choose`, `education`)
- `GET /api/availability?service_id=&date=YYYY-MM-DD` — public, open slots for a day
- `POST /api/bookings` — authenticated, create a booking
- `GET /api/bookings/me` — authenticated, your bookings
- `PATCH /api/bookings/:id` — authenticated, manual reschedule/cancel (owner or admin)
- `POST /api/bookings/:id/reschedule-ai` — authenticated, natural-language reschedule (see below)
- `POST /api/ai/chat` — signed-in or signed-out, unified AI assistant (greeting, symptom triage + doctor recommendations, booking, and signed-in-only lookups of the user's own upcoming appointments / past symptom checks — see below)
- `GET /api/ai/history` — authenticated, resumes the user's persisted chat thread
- `GET /api/favorites/me` / `POST /api/favorites` / `DELETE /api/favorites/:serviceId` — authenticated, saved doctors
- `GET/POST/PATCH /api/admin/services` — admin-only
- `GET/POST/PATCH /api/admin/availability` — admin-only
- `GET /api/admin/bookings` — admin-only, all bookings

## AI assistant

`POST /api/ai/chat` with body `{ "message": "...", "history": [{ role, text }] }` (history is optional, used for multi-turn context like "which doctor is best for that?"):

1. Classifies the message into one intent (`greeting`, `symptom`, `which_doctor`, `book`, `my_bookings`, `past_checkups`) and, for symptom-related intents, fetches the current doctor roster from `services` and sends it to OpenRouter, asking for a likely affected area, a non-diagnostic condition guess, and one recommended specialty (from the roster's actual specialty list).
2. Independently re-fetches doctors from the DB matching that specialty (never trusts the model to invent a doctor) and returns up to 3, sorted with any doctor the model named by name placed first.
3. `book` resolves the named doctor + requested day/time and creates the booking directly through the conversation; `my_bookings`/`past_checkups` are answered from the user's own DB rows, never from the model.
4. Every exchange is logged to `symptom_check_logs`, which also backs `GET /api/ai/history` so the chat thread survives a reload.

Rate-limited to 40 requests/hour per IP+user. Works for signed-out visitors (`optionalAuth`) so the assistant is usable before sign-in; booking and the two lookups still require auth.

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

- Push notifications on booking confirmation/reminders (mobile requests the Expo push token but never sends it to the backend — no `push_token` column or send step yet)
- Deployment (Render/Railway)
