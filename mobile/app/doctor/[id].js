import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { addRecentlyViewed } from '../../lib/recentlyViewed';
import { colors, radii, shadow } from '../../theme';
import { getSpecialtyStyle } from '../../lib/specialties';

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

const TABS = ['About', 'Availability', 'Education', 'Reviews'];

export default function DoctorDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const days = useMemo(() => nextDays(21), []);
  const [doctor, setDoctor] = useState(null);
  const [tab, setTab] = useState('About');
  const [favorited, setFavorited] = useState(false);
  const [date, setDate] = useState(toISODate(days[0]));
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [waitlistEntry, setWaitlistEntry] = useState(null);
  const [waitlistBusy, setWaitlistBusy] = useState(false);

  useEffect(() => {
    apiFetch('/api/services').then((services) => setDoctor(services.find((s) => s.id === id) || null));
    if (id) addRecentlyViewed(id);
  }, [id]);

  useEffect(() => {
    if (!session) return setFavorited(false);
    apiFetch('/api/favorites/me', { token: session.access_token })
      .then((rows) => setFavorited(rows.some((r) => r.service_id === id)))
      .catch(() => {});
  }, [session, id]);

  useEffect(() => {
    if (!session) return setWaitlistEntry(null);
    apiFetch('/api/waitlist/me', { token: session.access_token })
      .then((rows) => setWaitlistEntry(rows.find((w) => w.service_id === id && w.status === 'waiting') || null))
      .catch(() => {});
  }, [session, id]);

  useEffect(() => {
    if (tab !== 'Availability' || !id || !date) return;
    setSelectedSlot(null);
    setLoadingSlots(true);
    setError('');
    apiFetch(`/api/availability?service_id=${id}&date=${date}`)
      .then((res) => setSlots(res.slots || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingSlots(false));
  }, [id, date, tab]);

  async function toggleFavorite() {
    if (!session) return router.push('/login');
    setFavorited((f) => !f);
    try {
      if (favorited) {
        await apiFetch(`/api/favorites/${id}`, { method: 'DELETE', token: session.access_token });
      } else {
        await apiFetch('/api/favorites', { method: 'POST', token: session.access_token, body: { service_id: id } });
      }
    } catch {
      setFavorited((f) => !f);
    }
  }

  async function toggleWaitlist() {
    if (!session) return router.push('/login');
    setWaitlistBusy(true);
    try {
      if (waitlistEntry) {
        await apiFetch(`/api/waitlist/${waitlistEntry.id}`, { method: 'DELETE', token: session.access_token });
        setWaitlistEntry(null);
      } else {
        const created = await apiFetch('/api/waitlist', {
          method: 'POST',
          token: session.access_token,
          body: { service_id: id },
        });
        setWaitlistEntry(created);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setWaitlistBusy(false);
    }
  }

  async function handleConfirm() {
    if (!session) return router.push('/login');
    if (!selectedSlot) return;
    setConfirming(true);
    setError('');
    try {
      await apiFetch('/api/bookings', {
        method: 'POST',
        token: session.access_token,
        body: { service_id: id, start_time: selectedSlot.start_time, end_time: selectedSlot.end_time },
      });
      Alert.alert('Booking confirmed', `${doctor?.name} on ${new Date(selectedSlot.start_time).toLocaleString()}`, [
        { text: 'View my bookings', onPress: () => router.replace('/(tabs)/bookings') },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  }

  if (!doctor) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const { icon: specIcon, bg: specBg, fg: specFg } = getSpecialtyStyle(doctor.specialty);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={[styles.photoWrap, { backgroundColor: specBg }]}>
        {doctor.photo_url && <Image source={{ uri: doctor.photo_url }} style={styles.photo} resizeMode="cover" />}
        <Pressable style={[styles.heart, favorited && styles.heartActive]} onPress={toggleFavorite}>
          <Ionicons name={favorited ? 'heart' : 'heart-outline'} size={18} color={favorited ? colors.danger : colors.textMuted} />
        </Pressable>
      </View>

      <View style={[styles.badge, { backgroundColor: specBg, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
        <Ionicons name={specIcon} size={12} color={specFg} />
        <Text style={[styles.badgeText, { color: specFg }]}>{doctor.specialty}</Text>
      </View>
      <Text style={styles.name}>{doctor.name}</Text>
      <Text style={styles.price}>
        ${Number(doctor.price).toFixed(0)}<Text style={styles.priceUnit}>/visit</Text>
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{doctor.experience_years}/Yr</Text>
          <Text style={styles.statLabel}>Experience</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{doctor.reviews_count}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning }]}>★ {Number(doctor.rating).toFixed(1)}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <Pressable key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'About' && (
        <View>
          <Text style={styles.bio}>{doctor.bio}</Text>
          {doctor.why_choose?.length > 0 && (
            <>
              <Text style={styles.subheading}>Why Choose {doctor.name}?</Text>
              {doctor.why_choose.map((reason, i) => (
                <View key={i} style={styles.reasonRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.reasonText}>{reason}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}

      {tab === 'Availability' && (
        <View>
          <Text style={styles.label}>Choose Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            {days.map((d) => {
              const iso = toISODate(d);
              const selected = iso === date;
              return (
                <Pressable key={iso} style={[styles.datePill, selected && styles.datePillSelected]} onPress={() => setDate(iso)}>
                  <Text style={[styles.dow, selected && styles.dowSelected]}>{d.toLocaleDateString([], { weekday: 'short' })}</Text>
                  <Text style={[styles.dom, selected && styles.domSelected]}>{d.getDate()}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[styles.label, { marginTop: 16 }]}>Choose Time</Text>
          {loadingSlots && <ActivityIndicator style={{ marginTop: 8 }} color={colors.accent} />}
          {!loadingSlots && slots.length === 0 && (
            <>
              <Text style={styles.muted}>No open slots on this day — try another date.</Text>
              <Pressable
                style={[styles.waitlistBtn, waitlistEntry && styles.waitlistBtnActive]}
                onPress={toggleWaitlist}
                disabled={waitlistBusy}
              >
                <Ionicons name="notifications-outline" size={14} color={waitlistEntry ? colors.text : colors.white} />
                <Text style={[styles.waitlistBtnText, waitlistEntry && styles.waitlistBtnTextActive]}>
                  {waitlistEntry ? "You're on the waitlist — leave" : `Notify me when ${doctor.name} has an opening`}
                </Text>
              </Pressable>
            </>
          )}
          <View style={styles.slotWrap}>
            {slots.map((slot) => {
              const selected = selectedSlot?.start_time === slot.start_time;
              return (
                <Pressable key={slot.start_time} style={[styles.slot, selected && styles.slotSelected]} onPress={() => setSelectedSlot(slot)}>
                  <Text style={selected ? styles.slotTextSelected : styles.slotText}>{formatSlotTime(slot.start_time)}</Text>
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
      )}

      {tab === 'Education' && (
        <View>
          <Text style={styles.subheading}>Education Qualification</Text>
          {(doctor.education || []).map((e, i) => (
            <View key={i} style={styles.eduCard}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.eduDegree}>{e.degree}</Text>
                <Text style={styles.eduSchool}>{e.school} · {e.year}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {tab === 'Reviews' && (
        <View style={styles.reviewCard}>
          <Text style={styles.reviewRating}>★ {Number(doctor.rating).toFixed(1)}</Text>
          <Text style={styles.muted}>Based on {doctor.reviews_count} patient reviews.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  photoWrap: { width: '100%', aspectRatio: 1.1, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.surface2, ...shadow },
  photo: { width: '100%', height: '100%' },
  heart: { position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  heartActive: {},
  badge: { alignSelf: 'flex-start', backgroundColor: colors.accentSoft, borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: 12, marginTop: 16 },
  badgeText: { color: colors.accent, fontSize: 11.5, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 8 },
  price: { fontSize: 16, fontWeight: '800', color: colors.accent, marginTop: 2 },
  priceUnit: { fontWeight: '500', color: colors.textFaint, fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: 28, marginTop: 18 },
  statItem: {},
  statValue: { fontSize: 15, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  tabRow: { flexDirection: 'row', gap: 4, marginTop: 20, marginBottom: 16, backgroundColor: colors.surface2, borderRadius: radii.pill, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radii.pill },
  tabBtnActive: { backgroundColor: colors.surface, ...shadow },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.text },
  bio: { fontSize: 13.5, color: colors.textMuted, lineHeight: 20, marginBottom: 16 },
  subheading: { fontSize: 14.5, fontWeight: '700', color: colors.text, marginBottom: 10 },
  reasonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  reasonText: { flex: 1, fontSize: 12.5, color: colors.textMuted, lineHeight: 18 },
  label: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted, marginBottom: 8 },
  datePill: { alignItems: 'center', justifyContent: 'center', minWidth: 54, paddingVertical: 10, marginRight: 8, borderRadius: 18, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  datePillSelected: { backgroundColor: colors.text, borderColor: colors.text },
  dow: { fontSize: 10.5, fontWeight: '700', color: colors.textFaint, textTransform: 'uppercase' },
  dowSelected: { color: colors.white },
  dom: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2 },
  domSelected: { color: colors.white },
  muted: { color: colors.textMuted, marginTop: 4 },
  waitlistBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: colors.accent, borderRadius: radii.pill, paddingVertical: 9, paddingHorizontal: 14, marginTop: 10,
  },
  waitlistBtnActive: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  waitlistBtnText: { color: colors.white, fontWeight: '700', fontSize: 12.5 },
  waitlistBtnTextActive: { color: colors.text },
  slotWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  slot: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: 9, paddingHorizontal: 16, backgroundColor: colors.surface },
  slotSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  slotText: { color: colors.text, fontWeight: '600', fontSize: 13.5 },
  slotTextSelected: { color: colors.white, fontWeight: '600', fontSize: 13.5 },
  error: { color: colors.danger, marginTop: 12 },
  confirmBtn: { backgroundColor: colors.accent, borderRadius: radii.pill, paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  confirmBtnDisabled: { backgroundColor: colors.accentDisabled },
  confirmBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  eduCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderSoft, padding: 14, marginBottom: 10 },
  eduDegree: { fontSize: 13, fontWeight: '700', color: colors.text },
  eduSchool: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  reviewCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderSoft, padding: 16 },
  reviewRating: { fontSize: 20, fontWeight: '800', color: colors.warning },
});
