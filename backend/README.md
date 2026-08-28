# Slotify Backend (Week 1 scaffold)

Node.js/Express API for Slotify. This is the Week 1 build: backend scaffold, DB schema, service/availability/booking CRUD, and Supabase auth wired in. Web/mobile clients and the AI reschedule feature come in later weeks.

## Supabase project

A Supabase project (`slotify-booking-app`) has already been created and the schema applied — tables `users`, `services`, `availability`, `bookings`, `reschedule_logs`, all with RLS enabled.

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
- `OPENROUTER_API_KEY` — not needed until the Week 4 AI reschedule feature.

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
- `GET/POST/PATCH /api/admin/services` — admin-only
- `GET/POST/PATCH /api/admin/availability` — admin-only
- `GET /api/admin/bookings` — admin-only, all bookings

## Auth

Protected routes expect `Authorization: Bearer <supabase_session_access_token>`, the same token the Supabase Auth SDK returns on web/mobile after sign-in. The backend validates it against Supabase and loads the matching row from `public.users` (which must have `role` set — `customer` or `admin`) to check permissions.

The very first time a user signs up via Supabase Auth, insert a matching row into `public.users` (id, name, email, role) — either from a Supabase Auth webhook/trigger, or from the client right after sign-up. That wiring isn't included in this scaffold yet.

## Not in this scaffold (later weeks)

- Web frontend (Next.js)
- Mobile app (Expo)
- `POST /api/bookings/:id/reschedule-ai` (OpenRouter AI parsing)
- Rate limiting on the AI endpoint
- Email/push notifications
