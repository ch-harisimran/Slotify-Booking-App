# Slotify

Book a doctor's appointment without the phone tag — browse services, pick a slot, or just tell an AI assistant what's wrong and let it find you a time.

> **Personal project, not a commercial product.** Slotify is a portfolio/learning build. It is not a real clinic, doesn't process payments, and nothing in the AI assistant's replies is medical advice — always see an actual doctor for actual medical concerns.

![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-4.19-000000?logo=express&logoColor=white)
![Next.js](https://img.shields.io/badge/next.js-14.2-000000?logo=next.js&logoColor=white)
![Expo](https://img.shields.io/badge/expo-SDK%2054-000020?logo=expo&logoColor=white)
![Supabase](https://img.shields.io/badge/supabase-postgres%20%2B%20auth%20%2B%20storage-3ECF8E?logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/license-personal%20project-lightgrey)

## Table of contents

- [Why it exists](#why-it-exists)
- [Features](#features)
- [Tech stack](#tech-stack)
- [How the core features work](#how-the-core-features-work)
- [Architecture](#architecture)
- [Security model](#security-model)
- [Getting started](#getting-started)
- [Known limitations](#known-limitations)

## Why it exists

Slotify started as a way to build one real product across three surfaces — a backend API, a mobile app, and a web app — sharing the same Supabase project and the same rules, and to work through the problems that only show up once real users hit a shared resource at the same time (two people booking the same slot, one booking while another reschedules into it, and so on). The AI assistant piece exists to explore what a booking flow feels like when "pick a service, pick a slot" is replaced by "tell me what's wrong" and a model does the routing.

It's a single developer's project, built and iterated on solo — not a team effort, and not something running in production for real patients.

## Features

### Booking & scheduling

| Feature | Details |
| --- | --- |
| Browse & search | Filter doctors/services by specialty, view profiles, ratings, and available slots. |
| Manual booking | Pick a service and a time slot directly. |
| Reschedule & cancel | Move a booking to a new time or cancel it, from mobile or web. |
| Waitlist | Join a waitlist for a fully booked slot. |
| Favorites | Save doctors/services for quick access later. |
| Double-booking prevention | Enforced at the database level (see below) — two people can never end up holding the same slot, no matter which client or path they book through. |

### AI assistant

| Feature | Details |
| --- | --- |
| Conversational booking | Describe symptoms or intent in chat; the assistant classifies intent, suggests a service, and proposes slots. |
| AI reschedule | A dedicated endpoint lets the assistant move an existing booking based on a natural-language request. |
| Graceful conflict handling | If the AI's proposed slot gets taken mid-conversation, it catches the conflict and offers the nearest available alternatives instead of failing silently. |
| Model-agnostic | Runs through OpenRouter, so the underlying model is a config value, not a hard dependency. |

### Notifications

| Feature | Details |
| --- | --- |
| Push notifications | Mobile app registers for Expo push tokens and receives booking-related alerts. |
| In-app notification bell | Web and mobile both surface recent notifications in-app. |

### Account & security

| Feature | Details |
| --- | --- |
| Email/password + Google OAuth | Sign in with Supabase Auth (email/password or "Continue with Google"). |
| Avatar | Upload a profile photo, or fall back to initials on an accent-colored circle. Signing in with Google auto-populates the avatar from the Google profile photo. |
| Delete account | Self-serve account deletion. |
| Rate limiting | Per-user (signed in) or per-IP (signed out) request limiting on sensitive endpoints, including the AI chat. |

### Admin

| Feature | Details |
| --- | --- |
| Services & availability management | Admins manage the service catalog and availability windows. |
| Bookings overview | Admin-only view across all bookings. |
| Role-gated | Admin routes require `role = 'admin'` on the user row, enforced both by RLS and by an API-level `requireAdmin` check. |

## Tech stack

| Layer | Choice |
| --- | --- |
| Backend | Node.js, Express 4, plain JavaScript (CommonJS) |
| Mobile | React Native 0.81 (Expo SDK 54), Expo Router, React 19 |
| Web | Next.js 14 (App Router), React 18 |
| Database & Auth | Supabase (Postgres, Auth, Storage) |
| AI | OpenRouter (model configurable, defaults to `openai/gpt-4o-mini`) |
| Push notifications | Expo push notification service |

Backend and web are plain JavaScript, not TypeScript — no type-checking layer, so correctness leans on the database constraints and RLS policies described below rather than compile-time guarantees.

## How the core features work

**Double-booking prevention.** Every booking write — manual create, manual reschedule, AI-driven booking, and AI-driven reschedule — ultimately hits the same `bookings` table, which carries a Postgres exclusion constraint (`EXCLUDE USING gist`, via the `btree_gist` extension) over `(service_id, tstzrange(start_time, end_time))` for any non-cancelled booking. Two overlapping bookings for the same service can't both exist, period — not because the application code checks first (a check-then-insert has a race window), but because the database itself rejects the second write atomically. The application layer catches that rejection (Postgres error `23P01`) and turns it into a friendly `409` with the nearest available alternative slots, on every write path including the two AI ones.

**Auth & profile provisioning.** Supabase Auth handles sign-up/sign-in (email/password and Google OAuth). A database trigger on `auth.users` INSERT provisions the matching `public.users` row, pulling `avatar_url` out of the OAuth provider's metadata when the user signed up with Google.

**Avatars.** Users can upload a photo (stored in a Supabase Storage bucket, scoped so a user can only write to their own folder) or fall back to initials. Google sign-ins get their profile photo synced in automatically at provisioning time. The same `avatar_url` is read everywhere it's shown — profile screen, navbar, home screen — so there's one source of truth per platform.

**AI assistant flow.** A chat message hits `/api/ai/chat`, which classifies intent (greeting, symptom description, booking request, etc.) via OpenRouter, maps symptoms to a suggested service, and either continues the conversation or attempts a booking. Reschedule requests go through a dedicated `/api/bookings/:id/reschedule-ai` endpoint that parses the natural-language request and attempts the update — subject to the same exclusion constraint as every other write.

## Architecture

```
Slotify Booking App/
├── backend/                  Express API (Node, CommonJS)
│   └── src/
│       ├── server.js         App entry — mounts all routes
│       ├── routes/           services, availability, bookings, admin, ai, favorites, users, waitlist
│       ├── controllers/      Route handlers, incl. aiAssistant.controller.js, aiReschedule.controller.js
│       ├── middleware/       auth.js, rateLimit.js, errorHandler.js
│       ├── lib/               openrouter.js, slots.js, waitlist.js, notify.js
│       └── config/           supabaseClient.js
├── web/                       Next.js 14 App Router
│   ├── app/                  Routes: /, /search, /doctors/[id], /services/[id]/book,
│   │                         /dashboard, /favorites, /ai, /admin, /login, /profile
│   ├── components/           Navbar, DoctorCard, BookingCard, Avatar, admin/*, ...
│   ├── context/               AuthContext.js
│   └── lib/                   supabaseClient.js, api.js, avatar.js, ...
└── mobile/                     Expo Router (React Native)
    ├── app/
    │   ├── (tabs)/            index, search, bookings, favorites, ai, profile
    │   ├── doctor/[id].js, service/[id].js
    │   ├── login.js, auth/callback.js
    │   └── _layout.js         Auth-gated navigation stack
    ├── components/            BottomNav, DoctorCard, BookingCard, Avatar, ...
    ├── context/                AuthContext.js
    └── lib/                    supabaseClient.js, api.js, avatar.js, push.js, ...
```

All three apps talk to the same Supabase project for auth, data, and storage; mobile and web additionally call the Express backend for the AI-assistant and reschedule endpoints.

## Security model

| Layer | Mechanism |
| --- | --- |
| Row Level Security | RLS policies on every `public` table, scoped via `auth.uid()`; admin-only policies use a `SECURITY DEFINER` `is_admin()` helper rather than trusting a client-supplied role claim. |
| Double-booking | Postgres exclusion constraint on `bookings` (see above) — a DB-level guarantee, not just an application check. |
| Avatar storage | Dedicated `avatars` bucket with owner-scoped RLS (a user can only write inside their own folder), plus a server-enforced 5 MB file size limit and an image-MIME allowlist. |
| Rate limiting | In-memory limiter keyed per signed-in user, or per IP for signed-out callers (including the AI chat endpoint). IP is read from the raw socket, not `X-Forwarded-For`, since the app isn't deployed behind a reverse proxy — trusting that header here would let anyone bypass the limit by setting it themselves. |
| Admin gating | Enforced twice: RLS policies at the database layer, and a `requireAdmin` middleware check at the API layer. |
| Function grants | `handle_new_user()` (the auth-provisioning trigger function) has `EXECUTE` revoked from `anon`/`authenticated` — it should only ever run as a trigger, not be callable directly. |
| Account deletion | Self-serve delete-account flow removes the user's data rather than leaving orphaned rows. |

## Getting started

Three sub-projects, each with its own `package.json` and its own `.env` file (copy the matching `.env.example`).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your Supabase + OpenRouter keys
npm run dev             # nodemon, http://localhost:4000
```

Required env vars: `PORT`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`. Optional: `OPENROUTER_MODEL` (defaults to `openai/gpt-4o-mini`), `APP_URL`.

### 2. Web

```bash
cd web
npm install
npm run dev              # http://localhost:3000
```

Needs a Supabase URL + anon key configured for the client (see `web/lib/supabaseClient.js`).

### 3. Mobile

```bash
cd mobile
npm install
cp .env.example .env
npx expo start
```

Required env vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL` (point this at the backend — `http://localhost:4000` on iOS Simulator, `http://10.0.2.2:4000` on Android Emulator, or your machine's LAN IP for a physical device via Expo Go).

## Known limitations

- No automated test suite — correctness currently leans on the database constraints (exclusion constraint, RLS) and manual verification rather than CI-run tests.
- The rate limiter is in-memory and per-process — fine for a single instance, but it wouldn't hold a real limit across multiple backend instances behind a load balancer without moving to something like Redis.
- Backend has no reverse proxy in front of it by design (personal project, not deployed at scale), which is why the rate limiter trusts the raw socket IP instead of `X-Forwarded-For`. That decision would need revisiting before putting anything in front of it.
- Web supports email/password sign-in; Google OAuth "Continue with Google" is currently a mobile-only entry point.
- No payment processing — booking is scheduling only, nothing changes hands.
- The AI assistant's replies are not medical advice and shouldn't be treated as such — it's a scheduling aid, not a diagnostic tool.
- No scheduled jobs/cron — everything runs in response to a request; there's no background job clearing stale waitlist entries or similar.

---

Built by Mohammad Haris Imran.
