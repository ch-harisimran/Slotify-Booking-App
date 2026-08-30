import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import SplashScreen from '../components/SplashScreen';
import { colors } from '../theme';

// Splash stays up at least this long so it reads as a deliberate brand
// moment rather than a flash, even when the session check resolves
// instantly (e.g. session already cached on disk).
const MIN_SPLASH_MS = 900;

// Slotify requires sign-in/sign-up before any part of the app is usable —
// this redirects to /login whenever there's no session, and out of
// /login or /auth (the Google sign-in callback) back into the app once a
// session exists. /auth is excluded from the "bounce to login" check too,
// so the callback screen has time to finish exchanging tokens for a
// session before AuthGate reacts.
function AuthGate({ children }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading) return;
    const inAuthFlow = segments[0] === 'login' || segments[0] === 'auth';

    if (!session && !inAuthFlow) {
      router.replace('/login');
    } else if (session && inAuthFlow) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, router]);

  if (loading || !minTimeElapsed) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      {children}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <Stack
          screenOptions={{
            headerTitleAlign: 'center',
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.bg },
            headerTitleStyle: { fontWeight: '800', color: colors.text },
            contentStyle: { backgroundColor: colors.bg },
            // Just the chevron, never a text label (iOS otherwise shows the
            // previous screen's route name, e.g. "(tabs)", next to it).
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitle: '',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
          <Stack.Screen name="doctor/[id]" options={{ title: 'Doctor Details' }} />
          <Stack.Screen name="service/[id]" options={{ title: 'Doctor Details' }} />
        </Stack>
      </AuthGate>
    </AuthProvider>
  );
}
