# Slotify Web

Next.js (App Router) web frontend for Slotify — service list, booking flow, user dashboard, and AI-powered rescheduling. Talks to the Express backend and Supabase Auth directly.

## Setup

```bash
cd web
npm install
cp .env.local.example .env.local
```

`.env.local.example` already has your Supabase URL/anon key and points `NEXT_PUBLIC_API_URL` at `http://localhost:4000`. Update that last one if your backend runs elsewhere.

**Make sure the backend (`../backend`) is running first** (`npm run dev` there, with `OPENROUTER_API_KEY` set if you want AI reschedule to work) — this app has nothing to show without it.

## Run

```bash
npm run dev
```

Opens on `http://localhost:3000`.

## What's here

- `/` — service list (public, `GET /api/services`)
- `/login` — Supabase Auth email/password sign in + sign up
- `/services/[id]/book` — pick a date, see open slots (`GET /api/availability`), confirm (`POST /api/bookings`)
- `/dashboard` — your bookings (`GET /api/bookings/me`), each with three actions:
  - **Ask AI** — type something like "move it to Friday afternoon" (`POST /api/bookings/:id/reschedule-ai`). If the parsed time is taken, the nearest open slots show up as tappable buttons.
  - **Reschedule** — manual date/time picker (`PATCH /api/bookings/:id`)
  - **Cancel**

- `/admin` — admin-only (see below), three tabs:
  - **Services** — add/edit services
  - **Availability** — pick a service, add/edit its weekly windows
  - **All Bookings** — read-only list across every customer

Auth state is handled by `context/AuthContext.js` (Supabase session **and** the matching `public.users` row, so the UI knows the signed-in user's `role`). `lib/api.js` is a small fetch wrapper that attaches the Supabase access token to authenticated backend calls and surfaces `error.data` (e.g. `nearest_slots`) from failed requests.

New sign-ups automatically get a `public.users` row (via a Supabase DB trigger) with role `customer` — nothing extra needed for the profile insert.

### Granting admin access

Every new user starts as `customer`. To make one an admin, run this in the Supabase SQL editor (or ask me to run it — I have a Supabase connection):

```sql
update public.users set role = 'admin' where email = 'you@example.com';
```

The "Admin" link appears in the navbar, and `/admin` becomes accessible, as soon as that user signs in again (or refreshes).

Three sample services (Haircut, Deep Tissue Massage, Consultation Call) with Mon–Fri 9am–5pm availability are already seeded in Supabase so the booking flow has something to work with.

## Not in this scaffold yet

- Deployment (Vercel)
