# Slotify Mobile

React Native + Expo (Expo Router, SDK 54) app mirroring the web core flow — service list, login/signup, booking flow, AI-powered rescheduling, and a "My Bookings" screen. Talks to the same Express backend and Supabase project as the web app.

## Setup

```bash
cd mobile
npm install
cp .env.example .env
```

A `.npmrc` with `legacy-peer-deps=true` is already in this folder — some of `expo-router`'s web-tab dependencies (Radix UI) have peer ranges that conflict with the pinned React version; this is a known, harmless rough edge in the Expo/RN ecosystem, not a real incompatibility with your app.

`.env.example` already has your Supabase URL/anon key. Update `EXPO_PUBLIC_API_URL` for how you're running the backend:
- iOS Simulator → `http://localhost:4000` works as-is
- Android Emulator → use `http://10.0.2.2:4000`
- Physical device via Expo Go → use your computer's LAN IP, e.g. `http://192.168.1.23:4000`

**Make sure the backend (`../backend`) is running first**, with `OPENROUTER_API_KEY` set if you want AI reschedule to work.

If Expo Go complains your project needs a different SDK version, check Profile → the SDK version listed in Expo Go on your phone, and let me know — the packages in `package.json` are pinned to match SDK 54 specifically (Expo's own package versions don't always track "latest" the way you'd expect, and Expo Go on the App/Play Store doesn't always match the newest npm release either).

## Run

```bash
npx expo start -c
```

Scan the QR code with Expo Go (iOS/Android), or press `i` / `a` for a simulator/emulator.

## What's here

- **Services tab** (`app/(tabs)/index.js`) — `GET /api/services`, tap a card to book
- **Booking flow** (`app/service/[id].js`) — enter a date, see open slots (`GET /api/availability`), confirm (`POST /api/bookings`)
- **Login** (`app/login.js`) — Supabase Auth email/password sign in + sign up, opens as a modal
- **My Bookings tab** (`app/(tabs)/bookings.js`) — `GET /api/bookings/me`, each booking has three actions:
  - **Ask AI** — type something like "move it to Friday afternoon" (`POST /api/bookings/:id/reschedule-ai`). If the parsed time is taken, the nearest open slots show up as tappable buttons.
  - **Reschedule** — manual date/time text entry (`PATCH /api/bookings/:id`)
  - **Cancel**
- **Push notifications** (`hooks/usePushNotifications.js`) — requests permission and grabs an Expo push token on a physical device. Sending that token to the backend and actually triggering confirmation/reminder pushes is still a TODO; this hook only does client-side registration for now.

Date/time entry uses plain text inputs (`YYYY-MM-DD` / `HH:MM`) rather than a native picker, to avoid pulling in another native module at scaffold stage. Swap in `@react-native-community/datetimepicker` (`npx expo install @react-native-community/datetimepicker`) whenever you want a proper picker UI.

## Not in this scaffold yet

- Admin panel (web-only per the design doc)
- Actually sending push notifications from the backend
- App icons/splash screen (using Expo's defaults for now — add real assets before an EAS build)
- Deployment (EAS build)
