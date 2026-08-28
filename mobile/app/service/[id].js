import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { colors, radii, shadow } from '../../theme';

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function formatSlotTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function nextDays(count) {
  const days = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function BookServiceScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const days = useMemo(() => nextDays(21), []);
  const [service, setService] = useState(null);
  const [date, setDate] = useState(toISODate(days[0]));
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
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Ionicons name="cut-outline" size={20} color={colors.white} />
        </View>
        <View>
          <Text style={styles.title}>{service.name}</Text>
          <Text style={styles.meta}>
            {service.duration_minutes} min · ${Number(service.price).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Pick a date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          {days.map((d) => {
            const iso = toISODate(d);
            const selected = iso === date;
            return (
              <Pressable
                key={iso}
                style={[styles.datePill, selected && styles.datePillSelected]}
                onPress={() => setDate(iso)}
              >
                <Text style={[styles.dow, selected && styles.dowSelected]}>
                  {d.toLocaleDateString([], { weekday: 'short' })}
                </Text>
                <Text style={[styles.dom, selected && styles.domSelected]}>{d.getDate()}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={[styles.label, { marginTop: 16 }]}>Available times</Text>
        {loadingSlots && <ActivityIndicator style={{ marginTop: 8 }} color={colors.accent} />}
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
                <Text style={selected ? styles.slotTextSelected : styles.slotText}>
                  {formatSlotTime(slot.start_time)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.confirmBtn, (!selectedSlot || confirming) && styles.confirmBtnDisabled]}
          disabled={!selectedSlot || confirming}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmBtnText}>
            {authLoading ? 'Loading…' : !session ? 'Sign in to book' : confirming ? 'Booking…' : 'Confirm booking'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: 20,
    ...shadow,
  },
  label: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted, marginBottom: 8 },
  datePill: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  datePillSelected: { backgroundColor: colors.text, borderColor: colors.text },
  dow: { fontSize: 10.5, fontWeight: '700', color: colors.textFaint, textTransform: 'uppercase' },
  dowSelected: { color: colors.white },
  dom: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2 },
  domSelected: { color: colors.white },
  muted: { color: colors.textMuted, marginTop: 4 },
  slotWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  slot: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: 9,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  slotSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  slotText: { color: colors.text, fontWeight: '600', fontSize: 13.5 },
  slotTextSelected: { color: colors.white, fontWeight: '600', fontSize: 13.5 },
  error: { color: colors.danger, marginTop: 12 },
  confirmBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 22,
  },
  confirmBtnDisabled: { backgroundColor: '#b9cdfb' },
  confirmBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
