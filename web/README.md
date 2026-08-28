# Slotify Web (Week 2 scaffold)

Next.js (App Router) web frontend for Slotify — service list, booking flow, and user dashboard. Talks to the Week 1 Express backend and Supabase Auth directly.

## Setup

```bash
cd web
npm install
cp .env.local.example .env.local
```

`.env.local.example` already has your Supabase URL/anon key and points `NEXT_PUBLIC_API_URL` at `http://localhost:4000`. Update that last one if your backend runs elsewhere.

**Make sure the backend (`../backend`) is running first** (`npm run dev` there) — this app has nothing to show without it.

## Run

```bash
npm run dev
```

Opens on `http://localhost:3000`.

## What's here

- `/` — service list (public, `GET /api/services`)
- `/login` — Supabase Auth email/password sign in + sign up
- `/services/[id]/book` — pick a date, see open slots (`GET /api/availability`), confirm (`POST /api/bookings`)
- `/dashboard` — your bookings (`GET /api/bookings/me`), manual reschedule/cancel (`PATCH /api/bookings/:id`)

Auth state is handled by `context/AuthContext.js` (Supabase session, shared app-wide). `lib/api.js` is a small fetch wrapper that attaches the Supabase access token to authenticated backend calls.

New sign-ups automatically get a `public.users` row (via a Supabase DB trigger) with role `customer` — nothing extra needed for the profile insert the backend README mentioned.

Three sample services (Haircut, Deep Tissue Massage, Consultation Call) with Mon–Fri 9am–5pm availability are already seeded in Supabase so the booking flow has something to work with.

## Not in this scaffold (later weeks)

- Admin panel (manage services/availability, view all bookings) — Week 4
- AI reschedule chat box (OpenRouter) — Week 4, placeholder shown on the dashboard
- Mobile app — Week 3
