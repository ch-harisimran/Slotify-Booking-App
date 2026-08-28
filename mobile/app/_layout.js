import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { fontWeight: '800', color: colors.text },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ presentation: 'modal', title: 'Sign in' }} />
        <Stack.Screen name="service/[id]" options={{ title: 'Book appointment' }} />
      </Stack>
    </AuthProvider>
  );
}
