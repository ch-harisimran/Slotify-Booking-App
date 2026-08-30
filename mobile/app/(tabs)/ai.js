import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Image, StyleSheet, KeyboardAvoidingView, Keyboard, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import MascotIcon from '../../components/MascotIcon';
import { colors, radii, shadow } from '../../theme';

const GREETING = "Hi, I'm Slotify's AI assistant. Tell me what's going on and I can help you find the right doctor — or just say hi!";

export default function AiAssistantScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [chat, setChat] = useState([{ role: 'assistant', text: GREETING }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef(null);

  // The input row needs extra bottom padding to clear the floating tab bar
  // pill when the keyboard is hidden, but that same padding leaves a dead
  // gap above the keyboard once it's up — so it's tracked and swapped here
  // instead of being a fixed style value.
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Runs after every render where the thread actually grew or the
  // "Thinking…" indicator toggled — unlike calling this right after
  // setChat(), an effect keyed on the real content is guaranteed to fire
  // once the new message(s) have actually been laid out, so it doesn't
  // occasionally land one message short.
  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [chat.length, busy]);

  // Resume a signed-in user's conversation instead of resetting to the
  // greeting every time this tab is opened.
  useEffect(() => {
    if (!session) return;
    apiFetch('/api/ai/history', { token: session.access_token })
      .then((res) => {
        if (res?.messages?.length > 0) setChat(res.messages);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function send(overrideText) {
    const message = (overrideText ?? input).trim();
    if (!message || busy) return;

    const history = chat.map((m) => ({ role: m.role, text: m.text }));
    setChat((c) => [...c, { role: 'user', text: message }]);
    setInput('');
    setBusy(true);

    try {
      const result = await apiFetch('/api/ai/chat', {
        method: 'POST',
        token: session?.access_token,
        body: { message, history },
      });
      setChat((c) => [...c, { role: 'assistant', text: result.reply, ...result }]);
    } catch (err) {
      setChat((c) => [...c, { role: 'error', text: err.message }]);
    } finally {
      setBusy(false);
    }
  }

  async function bookSlot(doctorId, slot) {
    if (!session) return router.push('/login');
    setBusy(true);
    try {
      const booking = await apiFetch('/api/bookings', {
        method: 'POST',
        token: session.access_token,
        body: { service_id: doctorId, start_time: slot.start_time, end_time: slot.end_time },
      });
      setChat((c) => [
        ...c,
        {
          role: 'assistant',
          intent: 'booking_confirmed',
          text: `Booked! You're set for ${new Date(booking.start_time).toLocaleString([], {
            weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
          })}.`,
        },
      ]);
    } catch (err) {
      setChat((c) => [...c, { role: 'error', text: err.message }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.avatar}>
          <MascotIcon size={20} color={colors.white} />
        </View>
        <View>
          <Text style={styles.title}>AI Assistant</Text>
          <Text style={styles.subtitle}>Ask about symptoms, or book right here.</Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.thread} contentContainerStyle={{ padding: 16 }}>
        {chat.map((msg, i) => (
          <View key={i} style={{ marginBottom: 14 }}>
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

            {msg.disclaimer && <Text style={styles.disclaimer}>{msg.disclaimer}</Text>}

            {msg.intent === 'auth_required' && (
              <Pressable style={styles.bookBtn} onPress={() => router.push('/login')}>
                <Text style={styles.bookBtnText}>Sign in</Text>
              </Pressable>
            )}

            {msg.doctors?.length > 0 && (
              <View style={{ gap: 8, marginTop: 10 }}>
                {msg.doctors.map((d) => (
                  <Pressable key={d.id} style={styles.doctorRow} onPress={() => router.push(`/doctor/${d.id}`)}>
                    <View style={styles.doctorPhoto}>
                      {d.photo_url && <Image source={{ uri: d.photo_url }} style={{ width: '100%', height: '100%' }} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.doctorName}>{d.name}</Text>
                      <Text style={styles.doctorSpecialty}>{d.specialty}</Text>
                    </View>
                    <Text style={styles.doctorRating}>★ {Number(d.rating).toFixed(1)}</Text>
                  </Pressable>
                ))}
                {(msg.intent === 'symptom' || msg.intent === 'which_doctor') && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                    <Pressable style={styles.bookBtn} onPress={() => send(`Book me with ${msg.doctors[0].name}`)}>
                      <Text style={styles.bookBtnText}>Book with {msg.doctors[0].name}</Text>
                    </Pressable>
                    <Pressable style={styles.searchBtn} onPress={() => router.push('/(tabs)/search')}>
                      <Text style={styles.searchBtnText}>Search doctors</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {msg.bookings?.length > 0 && (
              <View style={{ gap: 8, marginTop: 10 }}>
                {msg.bookings.map((b) => (
                  <View key={b.id} style={styles.doctorRow}>
                    <View style={styles.doctorPhoto}>
                      {b.services?.photo_url && <Image source={{ uri: b.services.photo_url }} style={{ width: '100%', height: '100%' }} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.doctorName}>{b.services?.name}</Text>
                      <Text style={styles.doctorSpecialty}>{b.services?.specialty}</Text>
                    </View>
                    <Text style={styles.bookingDate}>
                      {new Date(b.start_time).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  </View>
                ))}
                <Pressable style={styles.searchBtn} onPress={() => router.push('/(tabs)/bookings')}>
                  <Text style={styles.searchBtnText}>Manage bookings</Text>
                </Pressable>
              </View>
            )}

            {msg.checkups?.length > 0 && (
              <View style={{ gap: 6, marginTop: 10 }}>
                {msg.checkups.map((c, idx) => (
                  <View key={idx} style={styles.checkupCard}>
                    <Text style={styles.checkupDate}>
                      {new Date(c.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                    <Text style={styles.checkupText}>
                      {c.affected_area}
                      {c.condition_guess ? ` — ${c.condition_guess}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {msg.intent === 'book' && msg.doctor && (
              <View style={styles.doctorRow}>
                <View style={styles.doctorPhoto}>
                  {msg.doctor.photo_url && <Image source={{ uri: msg.doctor.photo_url }} style={{ width: '100%', height: '100%' }} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.doctorName}>{msg.doctor.name}</Text>
                  <Text style={styles.doctorSpecialty}>{msg.doctor.specialty}</Text>
                </View>
              </View>
            )}

            {msg.intent === 'booking_unavailable' && msg.nearest_slots?.length > 0 && (
              <View style={styles.slotWrap}>
                {msg.nearest_slots.map((slot) => (
                  <Pressable key={slot.start_time} style={styles.slot} onPress={() => bookSlot(msg.doctor.id, slot)}>
                    <Text style={styles.slotText}>
                      {new Date(slot.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {msg.intent === 'booking_confirmed' && (
              <Pressable style={styles.searchBtn} onPress={() => router.push('/(tabs)/bookings')}>
                <Text style={styles.searchBtnText}>View my bookings</Text>
              </Pressable>
            )}
          </View>
        ))}
        {busy && (
          <View style={[styles.bubble, styles.bubbleAssistant]}>
            <Text style={styles.bubbleText}>Thinking…</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputRow, { paddingBottom: keyboardVisible ? insets.bottom + 10 : 100 }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Say hi, describe symptoms, or book…"
          placeholderTextColor={colors.textFaint}
          editable={!busy}
        />
        <Pressable style={[styles.sendBtn, (busy || !input.trim()) && styles.sendBtnDisabled]} onPress={() => send()} disabled={busy || !input.trim()}>
          <Ionicons name="send" size={16} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  thread: { flex: 1 },
  bubble: { maxWidth: '88%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16 },
  bubbleAssistant: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 4, ...shadow },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  bubbleError: { alignSelf: 'flex-start', backgroundColor: colors.dangerSoft, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 13.5, color: colors.text, lineHeight: 19 },
  bubbleTextUser: { fontSize: 13.5, color: colors.white, lineHeight: 19 },
  disclaimer: { fontSize: 10.5, color: colors.textFaint, marginTop: 4, marginLeft: 2 },
  doctorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderSoft, padding: 10, marginTop: 10 },
  doctorPhoto: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface2, overflow: 'hidden' },
  doctorName: { fontSize: 13, fontWeight: '700', color: colors.text },
  doctorSpecialty: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  doctorRating: { fontSize: 12, fontWeight: '700', color: colors.warning },
  bookingDate: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textAlign: 'right' },
  checkupCard: { backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderSoft, padding: 10 },
  checkupDate: { fontSize: 10.5, fontWeight: '700', color: colors.textFaint },
  checkupText: { fontSize: 12.5, color: colors.text, marginTop: 3 },
  bookBtn: { backgroundColor: colors.accent, borderRadius: radii.pill, paddingVertical: 9, paddingHorizontal: 14, marginTop: 8, alignSelf: 'flex-start' },
  bookBtnText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  searchBtn: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: 9, paddingHorizontal: 14, marginTop: 8, alignSelf: 'flex-start' },
  searchBtnText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  slotWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  slot: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: colors.surface },
  slotText: { fontSize: 12, fontWeight: '600', color: colors.text },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 16, paddingTop: 8 },
  input: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: 11, paddingHorizontal: 16, fontSize: 13.5, backgroundColor: colors.surface, color: colors.text },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: colors.accentDisabled },
});
