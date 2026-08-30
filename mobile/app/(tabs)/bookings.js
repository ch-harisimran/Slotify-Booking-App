import { useCallback, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import BookingCard from '../../components/BookingCard';
import EmptyState from '../../components/EmptyState';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { colors, radii } from '../../theme';

export default function BookingsScreen() {
  const { session, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Registers for Expo push notifications (permission + token). Sending the
  // token to the backend for confirmation/reminder pushes is still a TODO.
  usePushNotifications();

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const data = await apiFetch('/api/bookings/me', { token: session.access_token });
      setBookings(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      if (!authLoading) load();
    }, [authLoading, load])
  );

  async function handleCancel(bookingId) {
    await apiFetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      token: session.access_token,
      body: { status: 'cancelled' },
    });
    load();
  }

  async function handleReschedule(bookingId, start_time, end_time) {
    await apiFetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      token: session.access_token,
      body: { start_time, end_time },
    });
    load();
  }

  async function handleAiReschedule(bookingId, message) {
    const result = await apiFetch(`/api/bookings/${bookingId}/reschedule-ai`, {
      method: 'POST',
      token: session.access_token,
      body: { message },
    });
    load();
    return result;
  }

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <View style={styles.avatar}>
          <Ionicons name="calendar-outline" size={22} color={colors.white} />
        </View>
        <Text style={styles.muted}>Sign in to see your bookings.</Text>
        <Pressable style={styles.signInBtn} onPress={() => router.push('/login')}>
          <Text style={styles.signInBtnText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  const firstName = profile?.name?.split(' ')[0];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>{firstName ? `${firstName}'s bookings` : 'My Bookings'}</Text>
        <Text style={styles.subtitle}>Manage appointments, or ask the AI to move one.</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 110 }}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onCancel={handleCancel}
            onReschedule={handleReschedule}
            onAiReschedule={handleAiReschedule}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          <EmptyState
            variant="bookings"
            title="No bookings yet"
            subtitle="Find a doctor and book your first visit."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
  avatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  muted: { color: colors.textMuted, textAlign: 'center', marginBottom: 12 },
  signInBtn: { backgroundColor: colors.accent, borderRadius: radii.pill, paddingVertical: 12, paddingHorizontal: 24 },
  signInBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  error: { color: colors.danger, padding: 16 },
});
