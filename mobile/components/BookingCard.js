import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, statusColors } from '../theme';

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

const GREETING = 'Tell me when you\'d like to move this — try "Friday afternoon" or "next Tuesday at 10am".';

export default function BookingCard({ booking, onCancel, onReschedule, onAiReschedule }) {
  const [mode, setMode] = useState(null); // null | 'manual' | 'ai'
  const [date, setDate] = useState(toDateInput(booking.start_time));
  const [time, setTime] = useState(toTimeInput(booking.start_time));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [chat, setChat] = useState([{ role: 'assistant', text: GREETING }]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const chatThreadRef = useRef(null);

  const durationMinutes = booking.services?.duration_minutes || 30;
  const canModify = booking.status !== 'cancelled';
  const colorSet = statusColors[booking.status] || statusColors.confirmed;

  // Keeps the newest message (or the "Thinking…" bubble) in view instead of
  // leaving the user to scroll the mini chat down manually.
  useEffect(() => {
    requestAnimationFrame(() => chatThreadRef.current?.scrollToEnd({ animated: true }));
  }, [chat.length, chatBusy]);

  function resetPanels() {
    setMode(null);
    setError('');
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

  async function sendChatMessage() {
    const message = chatInput.trim();
    if (!message) return;

    setChat((c) => [...c, { role: 'user', text: message }]);
    setChatInput('');
    setChatBusy(true);

    try {
      const result = await onAiReschedule(booking.id, message);
      if (result?.needsInfo) {
        setChat((c) => [...c, { role: 'assistant', text: result.reply }]);
      } else if (result?.booking) {
        setChat((c) => [...c, { role: 'assistant', text: `Done — I've moved it to ${formatSlot(result.booking.start_time)}.` }]);
      }
    } catch (err) {
      const suggestions = err.data?.nearest_slots?.length ? err.data.nearest_slots : null;
      setChat((c) => [...c, { role: 'error', text: err.message, suggestions }]);
    } finally {
      setChatBusy(false);
    }
  }

  async function applySuggestedSlot(slot) {
    setChatBusy(true);
    try {
      await onReschedule(booking.id, slot.start_time, slot.end_time);
      setChat((c) => [...c, { role: 'assistant', text: `Booked for ${formatSlot(slot.start_time)}.` }]);
    } catch (err) {
      setChat((c) => [...c, { role: 'error', text: err.message }]);
    } finally {
      setChatBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', gap: 10, flex: 1 }}>
          <View style={styles.avatar}>
            {booking.services?.photo_url ? (
              <Image source={{ uri: booking.services.photo_url }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
            ) : (
              <Ionicons name="medkit-outline" size={16} color={colors.white} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{booking.services?.name || 'Doctor'}</Text>
            {booking.services?.specialty && <Text style={styles.specialty}>{booking.services.specialty}</Text>}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
              <Text style={styles.date}>
                {new Date(booking.start_time).toLocaleString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: colorSet.bg }]}>
          <Text style={[styles.badgeText, { color: colorSet.text }]}>{booking.status}</Text>
        </View>
      </View>

      {canModify && mode === null && (
        <View style={styles.actions}>
          <Pressable style={styles.btnAccent} onPress={() => setMode('ai')} disabled={busy}>
            <Ionicons name="sparkles" size={13} color={colors.white} />
            <Text style={styles.btnAccentText}>Ask AI</Text>
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
            <Pressable style={styles.btnAccent} onPress={submitReschedule} disabled={busy}>
              <Text style={styles.btnAccentText}>{busy ? 'Saving…' : 'Save'}</Text>
            </Pressable>
            <Pressable style={styles.btnSecondary} onPress={resetPanels} disabled={busy}>
              <Text style={styles.btnSecondaryText}>Cancel edit</Text>
            </Pressable>
          </View>
        </View>
      )}

      {canModify && mode === 'ai' && (
        <View style={{ marginTop: 12 }}>
          <ScrollView ref={chatThreadRef} style={styles.chatThread} nestedScrollEnabled>
            {chat.map((msg, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <View
                  style={[
                    styles.bubble,
                    msg.role === 'user' && styles.bubbleUser,
                    msg.role === 'assistant' && styles.bubbleAssistant,
                    msg.role === 'error' && styles.bubbleError,
                  ]}
                >
                  <Text style={msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleText}>{msg.text}</Text>
                </View>
                {msg.suggestions && (
                  <View style={styles.slotWrap}>
                    {msg.suggestions.map((slot) => (
                      <Pressable
                        key={slot.start_time}
                        style={styles.slot}
                        onPress={() => applySuggestedSlot(slot)}
                        disabled={chatBusy}
                      >
                        <Text style={styles.slotText}>{formatSlot(slot.start_time)}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            ))}
            {chatBusy && (
              <View style={[styles.bubble, styles.bubbleAssistant]}>
                <Text style={styles.bubbleText}>Thinking…</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Type a message…"
              editable={!chatBusy}
            />
            <Pressable
              style={[styles.sendBtn, (chatBusy || !chatInput.trim()) && styles.sendBtnDisabled]}
              onPress={sendChatMessage}
              disabled={chatBusy || !chatInput.trim()}
            >
              <Ionicons name="send" size={15} color={colors.white} />
            </Pressable>
          </View>
          <Pressable style={[styles.btnSecondary, { marginTop: 10, alignSelf: 'flex-start' }]} onPress={resetPanels}>
            <Text style={styles.btnSecondaryText}>Close</Text>
          </Pressable>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radii.md, padding: 16, marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  name: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  specialty: { fontSize: 11.5, color: colors.textMuted, marginBottom: 3 },
  date: { fontSize: 12.5, color: colors.textMuted },
  badge: { borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: 10 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  row: { flexDirection: 'row', marginBottom: 8 },
  label: { fontSize: 12, color: colors.textMuted, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.sm, padding: 9, fontSize: 13.5 },
  btnAccent: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.accent, borderRadius: radii.pill, paddingVertical: 9, paddingHorizontal: 15 },
  btnAccentText: { color: colors.white, fontWeight: '700', fontSize: 12.5 },
  btnSecondary: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: 9, paddingHorizontal: 15 },
  btnSecondaryText: { color: colors.text, fontWeight: '700', fontSize: 12.5 },
  btnDanger: { backgroundColor: colors.danger, borderRadius: radii.pill, paddingVertical: 9, paddingHorizontal: 15 },
  btnDangerText: { color: colors.white, fontWeight: '700', fontSize: 12.5 },
  chatThread: { maxHeight: 220, backgroundColor: colors.surface2, borderRadius: radii.md, padding: 10 },
  bubble: { maxWidth: '85%', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14 },
  bubbleAssistant: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  bubbleError: { alignSelf: 'flex-start', backgroundColor: colors.dangerSoft, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 13, color: colors.text, lineHeight: 18 },
  bubbleTextUser: { fontSize: 13, color: colors.white, lineHeight: 18 },
  slotWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  slot: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.surface },
  slotText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  chatInputRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  chatInput: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: 10, paddingHorizontal: 16, fontSize: 13.5 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: colors.accentDisabled },
  error: { color: colors.danger, marginTop: 8, fontSize: 13 },
});
