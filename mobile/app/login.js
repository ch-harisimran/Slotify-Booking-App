import { useState } from 'react';
import { Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabaseClient';

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
      <Text style={styles.title}>{mode === 'signup' ? 'Create an account' : 'Sign in'}</Text>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 13, color: '#6b7280', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10 },
  btn: { backgroundColor: '#4f46e5', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  btnDisabled: { backgroundColor: '#a5a6f6' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  error: { color: '#dc2626', marginTop: 12, textAlign: 'center' },
  info: { color: '#16a34a', marginTop: 12, textAlign: 'center' },
  switch: { color: '#4f46e5', marginTop: 20, textAlign: 'center' },
});
