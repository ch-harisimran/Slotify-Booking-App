import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

function toDateInput(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}
function toTimeInput(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function formatSlot(iso) {
  return new Date(iso).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const statusColors = {
  confirmed: { bg: '#dcfce7', text: '#166534' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
  rescheduled: { bg: '#fef9c3', text: '#854d0e' },
};

export default function BookingCard({ booking, onCancel, onReschedule, onAiReschedule }) {
  const [mode, setMode] = useState(null); // null | 'manual' | 'ai'
  const [date, setDate] = useState(toDateInput(booking.start_time));
  const [time, setTime] = useState(toTimeInput(booking.start_time));
  const [aiMessage, setAiMessage] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const durationMinutes = booking.services?.duration_minutes || 30;
  const canModify = booking.status !== 'cancelled';
  const colors = statusColors[booking.status] || statusColors.confirmed;

  function resetPanels() {
    setMode(null);
    setError('');
    setAiSuggestions(null);
  }

  async function submitReschedule() {
    setBusy(true);
    setError('');
    try {
      const startTime = new Date(`${date}T${time}:00`);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
      await onReschedule(booking.id, startTime.toISOString(), endTime.toISOString());
      resetPanels();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitAiReschedule() {
    setBusy(true);
    setError('');
    setAiSuggestions(null);
    try {
      await onAiReschedule(booking.id, aiMessage);
      setAiMessage('');
      resetPanels();
    } catch (err) {
      setError(err.message);
      if (err.data?.nearest_slots?.length) {
        setAiSuggestions(err.data.nearest_slots);
      }
    } finally {
      setBusy(false);
    }
  }

  async function applySuggestedSlot(slot) {
    setBusy(true);
    setError('');
    try {
      await onReschedule(booking.id, slot.start_time, slot.end_time);
      resetPanels();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    setError('');
    try {
      await onCancel(booking.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{booking.services?.name || 'Service'}</Text>
          <Text style={styles.date}>{new Date(booking.start_time).toLocaleString()}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.badgeText, { color: colors.text }]}>{booking.status}</Text>
        </View>
      </View>

      {canModify && mode === null && (
        <View style={styles.actions}>
          <Pressable style={styles.btn} onPress={() => setMode('ai')} disabled={busy}>
            <Text style={styles.btnText}>Ask AI</Text>
          </Pressable>
          <Pressable style={styles.btnSecondary} onPress={() => setMode('manual')} disabled={busy}>
            <Text style={styles.btnSecondaryText}>Reschedule</Text>
          </Pressable>
          <Pressable style={styles.btnDanger} onPress={handleCancel} disabled={busy}>
            <Text style={styles.btnDangerText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {canModify && mode === 'manual' && (
        <View style={{ marginTop: 12 }}>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>New date</Text>
              <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>New time</Text>
              <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="HH:MM" />
            </View>
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.btn} onPress={submitReschedule} disabled={busy}>
              <Text style={styles.btnText}>{busy ? 'Saving…' : 'Save'}</Text>
            </Pressable>
            <Pressable style={styles.btnSecondary} onPress={resetPanels} disabled={busy}>
              <Text style={styles.btnSecondaryText}>Cancel edit</Text>
            </Pressable>
          </View>
        </View>
      )}

      {canModify && mode === 'ai' && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.label}>Tell the AI when you'd like to move it</Text>
          <TextInput
            style={styles.input}
            value={aiMessage}
            onChangeText={setAiMessage}
            placeholder='e.g. "move it to Friday afternoon"'
          />
          <View style={styles.actions}>
            <Pressable style={styles.btn} onPress={submitAiReschedule} disabled={busy || !aiMessage.trim()}>
              <Text style={styles.btnText}>{busy ? 'Thinking…' : 'Send'}</Text>
            </Pressable>
            <Pressable style={styles.btnSecondary} onPress={resetPanels} disabled={busy}>
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </Pressable>
          </View>

          {aiSuggestions && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.suggestLabel}>Closest open times — tap one to book it:</Text>
              <View style={styles.slotWrap}>
                {aiSuggestions.map((slot) => (
                  <Pressable
                    key={slot.start_time}
                    style={styles.slot}
                    onPress={() => applySuggestedSlot(slot)}
                    disabled={busy}
                  >
                    <Text style={styles.slotText}>{formatSlot(slot.start_time)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 16, marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  date: { fontSize: 13, color: '#6b7280' },
  badge: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  row: { flexDirection: 'row', marginBottom: 8 },
  label: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  suggestLabel: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 8 },
  btn: { backgroundColor: '#4f46e5', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  btnText: { color: '#fff', fontWeight: '600' },
  btnSecondary: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  btnSecondaryText: { color: '#1a1d23', fontWeight: '600' },
  btnDanger: { backgroundColor: '#dc2626', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  btnDangerText: { color: '#fff', fontWeight: '600' },
  slotWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#fff' },
  slotText: { fontSize: 13, color: '#1a1d23' },
  error: { color: '#dc2626', marginTop: 8, fontSize: 13 },
});
