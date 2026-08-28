import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import { colors, radii, shadow } from '../theme';

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setInfo('Account created! Check your email to confirm, then sign in.');
          setMode('signin');
        } else {
          router.back();
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.back();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.avatar}>
        <Ionicons name="calendar" size={24} color={colors.white} />
      </View>
      <Text style={styles.title}>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</Text>
      <Text style={styles.subtitle}>
        {mode === 'signup' ? 'Book appointments in a few taps.' : 'Sign in to manage your bookings.'}
      </Text>

      <View style={styles.card}>
        {mode === 'signup' && (
          <>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} autoCapitalize="words" />
          </>
        )}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

        <Pressable style={[styles.btn, submitting && styles.btnDisabled]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.btnText}>{submitting ? 'Please wait…' : mode === 'signup' ? 'Sign up' : 'Sign in'}</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <Pressable
          onPress={() => {
            setError('');
            setInfo('');
            setMode(mode === 'signup' ? 'signin' : 'signup');
          }}
        >
          <Text style={styles.switch}>
            {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', color: colors.text },
  subtitle: { fontSize: 13.5, color: colors.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 22 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: 22,
    ...shadow,
  },
  label: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: 12,
    fontSize: 14.5,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 22,
  },
  btnDisabled: { backgroundColor: '#b9cdfb' },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  error: { color: colors.danger, marginTop: 12, textAlign: 'center' },
  info: { color: colors.success, marginTop: 12, textAlign: 'center' },
  switch: { color: colors.accent, fontWeight: '600', marginTop: 18, textAlign: 'center' },
});
