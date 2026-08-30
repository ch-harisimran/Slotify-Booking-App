import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Modal, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { colors, radii, shadow } from '../../theme';
import { initials } from '../../lib/format';

function Row({ icon, label, onPress, danger }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.rowIcon, danger && { backgroundColor: colors.dangerSoft }]}>
        <Ionicons name={icon} size={16} color={danger ? colors.danger : colors.accent} />
      </View>
      <Text style={[styles.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { session, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [policyOpen, setPolicyOpen] = useState(null); // null | 'privacy' | 'terms'

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  async function saveName() {
    setSaving(true);
    try {
      const { error } = await supabase.from('users').update({ name }).eq('id', session.user.id);
      if (error) throw error;
      await refreshProfile();
      setEditOpen(false);
    } catch (err) {
      Alert.alert('Could not save', err.message);
    } finally {
      setSaving(false);
    }
  }

  function closePasswordModal() {
    setPasswordOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  }

  async function changePassword() {
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setPasswordSaving(true);
    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: profile?.email || session.user.email,
        password: currentPassword,
      });
      if (reauthError) throw new Error('Current password is incorrect.');

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      Alert.alert('Password updated', 'Your password has been changed.');
      closePasswordModal();
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 110 }}>
      <Text style={styles.title}>My Profile</Text>

      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(profile?.name, profile?.email)}</Text>
        </View>
        <View>
          <Text style={styles.name}>{profile?.name || 'Slotify user'}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Account Settings</Text>
      <View style={styles.card}>
        <Row icon="person-outline" label="Personal Information" onPress={() => setEditOpen(true)} />
        <Row icon="calendar-outline" label="Booking History" onPress={() => router.push('/(tabs)/bookings')} />
        <Row icon="heart-outline" label="Favorites" onPress={() => router.push('/(tabs)/favorites')} />
        <Row icon="lock-closed-outline" label="Password & Security" onPress={() => setPasswordOpen(true)} />
      </View>

      <Text style={styles.sectionLabel}>Policy Center</Text>
      <View style={styles.card}>
        <Row icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => setPolicyOpen('privacy')} />
        <Row icon="document-text-outline" label="Terms & Conditions" onPress={() => setPolicyOpen('terms')} />
      </View>

      <View style={[styles.card, { marginTop: 20 }]}>
        <Row icon="log-out-outline" label="Sign out" onPress={handleSignOut} danger />
      </View>

      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Personal Information</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
            <Text style={[styles.label, { marginTop: 10 }]}>Email</Text>
            <Text style={styles.emailReadonly}>{profile?.email}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
              <Pressable style={styles.modalBtnSecondary} onPress={() => setEditOpen(false)}>
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalBtn} onPress={saveName} disabled={saving}>
                <Text style={styles.modalBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={passwordOpen} transparent animationType="fade" onRequestClose={closePasswordModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Password & Security</Text>

            <Text style={styles.label}>Current password</Text>
            <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />

            <Text style={[styles.label, { marginTop: 10 }]}>New password</Text>
            <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry />

            <Text style={[styles.label, { marginTop: 10 }]}>Confirm new password</Text>
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
              <Pressable style={styles.modalBtnSecondary} onPress={closePasswordModal}>
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalBtn} onPress={changePassword} disabled={passwordSaving}>
                <Text style={styles.modalBtnText}>{passwordSaving ? 'Saving…' : 'Update'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!policyOpen} transparent animationType="fade" onRequestClose={() => setPolicyOpen(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{policyOpen === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {policyOpen === 'privacy' ? (
                <>
                  <Text style={styles.policyText}>Slotify collects the information you provide when booking appointments — your name, email, and the symptoms or notes you share with our AI assistant — to match you with the right doctor and manage your bookings.</Text>
                  <Text style={styles.policyText}>We never sell your personal data. Your health-related notes are visible only to you and the doctors you book with. You can request a copy or deletion of your data at any time by contacting support.</Text>
                  <Text style={styles.policyText}>Authentication is handled securely through Supabase, and passwords are never stored in plain text.</Text>
                </>
              ) : (
                <>
                  <Text style={styles.policyText}>By using Slotify, you agree to book appointments in good faith and to attend or cancel them with reasonable notice.</Text>
                  <Text style={styles.policyText}>Slotify's AI assistant offers general guidance and doctor recommendations, but is not a substitute for professional medical advice, diagnosis, or treatment.</Text>
                  <Text style={styles.policyText}>Accounts found to be abusing the booking system or submitting false information may be suspended.</Text>
                </>
              )}
            </ScrollView>
            <Pressable style={[styles.modalBtn, { marginTop: 16 }]} onPress={() => setPolicyOpen(null)}>
              <Text style={styles.modalBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 8, marginBottom: 18 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 26 },
  avatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 18 },
  name: { fontSize: 16.5, fontWeight: '800', color: colors.text },
  email: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8, marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderSoft, marginBottom: 20, overflow: 'hidden', ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  rowIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 13.5, fontWeight: '600', color: colors.text },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(28,36,32,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', backgroundColor: colors.surface, borderRadius: radii.lg, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.sm, padding: 11, fontSize: 14, color: colors.text },
  emailReadonly: { fontSize: 14, color: colors.textFaint, paddingVertical: 4 },
  modalBtn: { flex: 1, backgroundColor: colors.accent, borderRadius: radii.pill, paddingVertical: 12, alignItems: 'center' },
  modalBtnText: { color: colors.white, fontWeight: '700', fontSize: 13.5 },
  modalBtnSecondary: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: 12, alignItems: 'center' },
  modalBtnSecondaryText: { color: colors.text, fontWeight: '700', fontSize: 13.5 },
  errorText: { color: colors.danger, fontSize: 12.5, marginTop: 12 },
  policyText: { fontSize: 13, lineHeight: 19, color: colors.textMuted, marginBottom: 12 },
});
