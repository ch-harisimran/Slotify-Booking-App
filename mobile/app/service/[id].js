import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatSlotTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function BookServiceScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const [service, setService] = useState(null);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    apiFetch('/api/services')
      .then((services) => setService(services.find((s) => s.id === id) || null))
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (!id || !date) return;
    setSelectedSlot(null);
    setLoadingSlots(true);
    setError('');
    apiFetch(`/api/availability?service_id=${id}&date=${date}`)
      .then((res) => setSlots(res.slots || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingSlots(false));
  }, [id, date]);

  async function handleConfirm() {
    if (!session) {
      router.push('/login');
      return;
    }
    if (!selectedSlot) return;
    setConfirming(true);
    setError('');
    try {
      await apiFetch('/api/bookings', {
        method: 'POST',
        token: session.access_token,
        body: { service_id: id, start_time: selectedSlot.start_time, end_time: selectedSlot.end_time },
      });
      Alert.alert(
        'Booking confirmed',
        `${service?.name} on ${new Date(selectedSlot.start_time).toLocaleString()}`,
        [{ text: 'View my bookings', onPress: () => router.replace('/(tabs)/bookings') }]
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  }

  if (!service) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{service.name}</Text>
      <Text style={styles.meta}>
        {service.duration_minutes} min · ${Number(service.price).toFixed(2)}
      </Text>

      <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2026-08-29" autoCapitalize="none" />

      <Text style={styles.label}>Available times</Text>
      {loadingSlots && <ActivityIndicator style={{ marginTop: 8 }} />}
      {!loadingSlots && slots.length === 0 && (
        <Text style={styles.muted}>No open slots on this day — try another date.</Text>
      )}
      <View style={styles.slotWrap}>
        {slots.map((slot) => {
          const selected = selectedSlot?.start_time === slot.start_time;
          return (
            <Pressable
              key={slot.start_time}
              style={[styles.slot, selected && styles.slotSelected]}
              onPress={() => setSelectedSlot(slot)}
            >
              <Text style={selected ? styles.slotTextSelected : styles.slotText}>{formatSlotTime(slot.start_time)}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.btn, (!selectedSlot || confirming) && styles.btnDisabled]}
        disabled={!selectedSlot || confirming}
        onPress={handleConfirm}
      >
        <Text style={styles.btnText}>
          {authLoading ? 'Loading…' : !session ? 'Sign in to book' : confirming ? 'Booking…' : 'Confirm booking'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  meta: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  label: { fontSize: 13, color: '#6b7280', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, backgroundColor: '#fff' },
  muted: { color: '#6b7280', marginTop: 4 },
  slotWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  slot: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#fff' },
  slotSelected: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  slotText: { color: '#1a1d23' },
  slotTextSelected: { color: '#fff' },
  error: { color: '#dc2626', marginTop: 12 },
  btn: { backgroundColor: '#4f46e5', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  btnDisabled: { backgroundColor: '#a5a6f6' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
