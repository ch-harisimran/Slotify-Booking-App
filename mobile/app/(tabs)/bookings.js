import { useCallback, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import BookingCard from '../../components/BookingCard';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function BookingsScreen() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Registers for Expo push notifications (permission + token). Sending the
  // token to the backend for confirmation/reminder pushes is Week 4 polish.
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

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Sign in to see your bookings.</Text>
        <Text style={styles.link} onPress={() => router.push('/login')}>
          Sign in
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <BookingCard booking={item} onCancel={handleCancel} onReschedule={handleReschedule} />
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
        ListEmptyComponent={<Text style={styles.muted}>No bookings yet. Book a service from the Services tab.</Text>}
        ListFooterComponent={
          <View style={styles.aiPlaceholder}>
            <Text style={styles.aiTitle}>AI Reschedule</Text>
            <Text style={styles.aiText}>
              "Move my haircut to Friday afternoon" — the natural-language reschedule chat box arrives in Week 4,
              once the OpenRouter integration is wired in. Use "Reschedule" above for now.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  muted: { color: '#6b7280', textAlign: 'center', marginBottom: 8 },
  link: { color: '#4f46e5', fontWeight: '600' },
  error: { color: '#dc2626', padding: 16 },
  aiPlaceholder: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 16, opacity: 0.6, marginTop: 8 },
  aiTitle: { fontWeight: '700', marginBottom: 6 },
  aiText: { color: '#6b7280', fontSize: 13 },
});
