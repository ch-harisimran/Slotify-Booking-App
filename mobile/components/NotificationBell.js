import { useCallback, useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { colors, radii, shadow } from '../theme';

const SOON_WINDOW_MS = 48 * 60 * 60 * 1000; // appointments inside this window are "urgent"

function formatWhen(iso) {
  const start = new Date(iso);
  const diffHrs = (start.getTime() - Date.now()) / (1000 * 60 * 60);
  if (diffHrs < 24) {
    return `Today at ${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (diffHrs < 48) {
    return `Tomorrow at ${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  return start.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// Bell button that surfaces the user's own upcoming-appointment alerts,
// derived straight from /api/bookings/me — no backend "notifications" table
// needed. Appointments starting within 48h drive the unread-dot badge.
export default function NotificationBell() {
  const { session } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!session) {
        setBookings([]);
        return;
      }
      setLoading(true);
      apiFetch('/api/bookings/me', { token: session.access_token })
        .then((rows) => {
          const upcoming = rows
            .filter((b) => b.status !== 'cancelled' && new Date(b.start_time) > new Date())
            .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
          setBookings(upcoming);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [session])
  );

  const urgentCount = bookings.filter((b) => new Date(b.start_time).getTime() - Date.now() < SOON_WINDOW_MS).length;

  function goToBooking() {
    setOpen(false);
    router.push('/(tabs)/bookings');
  }

  return (
    <>
      <Pressable style={styles.bellBtn} onPress={() => setOpen(true)}>
        <Ionicons name="notifications-outline" size={19} color={colors.text} />
        {urgentCount > 0 && <View style={styles.dot} />}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.panelTitle}>Upcoming appointments</Text>

            {!session && <Text style={styles.muted}>Sign in to see your alerts.</Text>}
            {session && loading && <Text style={styles.muted}>Loading…</Text>}
            {session && !loading && bookings.length === 0 && (
              <Text style={styles.muted}>No upcoming appointments.</Text>
            )}

            <FlatList
              data={bookings.slice(0, 6)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const urgent = new Date(item.start_time).getTime() - Date.now() < SOON_WINDOW_MS;
                return (
                  <Pressable style={styles.row} onPress={goToBooking}>
                    <View style={[styles.rowIcon, urgent && styles.rowIconUrgent]}>
                      <Ionicons name="calendar-outline" size={14} color={urgent ? colors.danger : colors.textMuted} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{item.services?.name || 'Appointment'}</Text>
                      <Text style={styles.rowTime}>{formatWhen(item.start_time)}</Text>
                    </View>
                  </Pressable>
                );
              }}
            />

            <Pressable style={styles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.borderSoft, alignItems: 'center', justifyContent: 'center',
  },
  dot: {
    position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.danger, borderWidth: 1.5, borderColor: colors.surface,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-start', alignItems: 'flex-end', padding: 16, paddingTop: 64 },
  panel: {
    width: 300, maxHeight: 400, backgroundColor: colors.surface, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.borderSoft, padding: 14, ...shadow,
  },
  panelTitle: { fontSize: 11, fontWeight: '700', color: colors.textFaint, letterSpacing: 0.4, marginBottom: 8 },
  muted: { color: colors.textMuted, fontSize: 13, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  rowIcon: {
    width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  rowIconUrgent: { backgroundColor: colors.dangerSoft },
  rowTitle: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  rowTime: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  closeBtn: { marginTop: 8, alignSelf: 'flex-end' },
  closeBtnText: { fontSize: 13, fontWeight: '700', color: colors.accent },
});
