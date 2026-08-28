# Slotify Mobile (Week 3 scaffold)

React Native + Expo (Expo Router) app mirroring the web core flow — service list, login/signup, booking flow, and a "My Bookings" screen. Talks to the same Week 1 Express backend and Supabase project as the web app.

## Setup

```bash
cd mobile
npm install
npx expo install --fix
cp .env.example .env
```

`npx expo install --fix` re-resolves every Expo-managed package (expo-router, expo-notifications, react-native-screens, etc.) to the exact version this Expo SDK expects — run it right after `npm install` since the versions in `package.json` are best-effort pins.

`.env.example` already has your Supabase URL/anon key. Update `EXPO_PUBLIC_API_URL` for how you're running the backend:
- iOS Simulator → `http://localhost:4000` works as-is
- Android Emulator → use `http://10.0.2.2:4000`
- Physical device via Expo Go → use your computer's LAN IP, e.g. `http://192.168.1.23:4000`

**Make sure the backend (`../backend`) is running first.**

## Run

```bash
npx expo start
```

Scan the QR code with Expo Go (iOS/Android), or press `i` / `a` for a simulator/emulator.

## What's here

- **Services tab** (`app/(tabs)/index.js`) — `GET /api/services`, tap a card to book
- **Booking flow** (`app/service/[id].js`) — enter a date, see open slots (`GET /api/availability`), confirm (`POST /api/bookings`)
- **Login** (`app/login.js`) — Supabase Auth email/password sign in + sign up, opens as a modal
- **My Bookings tab** (`app/(tabs)/bookings.js`) — `GET /api/bookings/me`, reschedule/cancel via `PATCH /api/bookings/:id`, plus a placeholder for the Week 4 AI reschedule chat box
- **Push notifications** (`hooks/usePushNotifications.js`) — requests permission and grabs an Expo push token on a physical device. Sending that token to the backend and actually triggering confirmation/reminder pushes is Week 4 work; this hook only does client-side registration for now.

Date/time entry uses plain text inputs (`YYYY-MM-DD` / `HH:MM`) rather than a native picker, to avoid pulling in another native module at scaffold stage. Swap in `@react-native-community/datetimepicker` (`npx expo install @react-native-community/datetimepicker`) whenever you want a proper picker UI.

## Not in this scaffold (later weeks)

- AI reschedule chat box (OpenRouter) — Week 4
- Admin panel — Week 4 (web-only per the design doc)
- Actually sending push notifications from the backend
- App icons/splash screen (using Expo's defaults for now — add real assets before an EAS build)
