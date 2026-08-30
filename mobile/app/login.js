import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { colors, radii, shadow } from '../theme';
import Logo from '../components/Logo';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signInWithGoogle } = useAuth();

  // 'welcome' | 'form' | 'signupOtp' | 'forgotEmail' | 'forgotOtp'
  const [view, setView] = useState('welcome');
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  function resetMessages() {
    setError('');
    setInfo('');
  }

  function openForm(nextMode) {
    resetMessages();
    setMode(nextMode);
    setView('form');
  }

  async function handleSubmit() {
    resetMessages();
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
          setOtp('');
          setInfo(`We sent a 6-digit code to ${email}. Enter it below to verify your account.`);
          setView('signupOtp');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.replace('/(tabs)');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function verifySignupOtp() {
    resetMessages();
    setSubmitting(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });
      if (verifyError) throw verifyError;
      if (data.session) {
        router.replace('/(tabs)');
      } else {
        setInfo('Verified! You can now sign in.');
        setMode('signin');
        setView('form');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function resendSignupOtp() {
    resetMessages();
    setSubmitting(true);
    try {
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
      if (resendError) throw resendError;
      setInfo(`We sent a new code to ${email}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function requestPasswordReset() {
    resetMessages();
    setSubmitting(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      if (resetError) throw resetError;
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setInfo(`We sent a 6-digit code to ${email}.`);
      setView('forgotOtp');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNewPassword() {
    resetMessages();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery',
      });
      if (verifyError) throw verifyError;

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      router.replace('/(tabs)');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      Alert.alert('Could not sign in with Google', err.message);
    } finally {
      setGoogleBusy(false);
    }
  }

  const topPadding = Math.max(24, insets.top + 16);

  if (view === 'welcome') {
    return (
      <View style={[styles.screen, styles.welcomeInner, { paddingTop: topPadding }]}>
        <View style={styles.welcomeTop}>
          <Logo size={76} />
          <Text style={styles.brand}>Slotify</Text>
          <Text style={styles.subtitle}>Book trusted doctors in a few taps.</Text>
        </View>

        <View style={styles.optionsWrap}>
          <Pressable style={styles.primaryBtn} onPress={() => openForm('signup')}>
            <Text style={styles.primaryBtnText}>Sign up with email</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={() => openForm('signin')}>
            <Text style={styles.secondaryBtnText}>Log in with email</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable style={[styles.googleBtn, googleBusy && { opacity: 0.6 }]} onPress={handleGoogle} disabled={googleBusy}>
            <Ionicons name="logo-google" size={18} color="#EA4335" />
            <Text style={styles.googleBtnText}>{googleBusy ? 'Opening Google…' : 'Continue with Gmail'}</Text>
          </Pressable>
        </View>

        <Text style={styles.terms}>By continuing, you agree to Slotify's Terms & Privacy Policy.</Text>
      </View>
    );
  }

  const titles = {
    form: mode === 'signup' ? 'Create your account' : 'Welcome back',
    signupOtp: 'Verify your email',
    forgotEmail: 'Reset your password',
    forgotOtp: 'Enter your code',
  };
  const subtitles = {
    form: mode === 'signup' ? 'Book appointments in a few taps.' : 'Sign in to manage your bookings.',
    signupOtp: 'Enter the code we emailed you.',
    forgotEmail: "We'll email you a code to reset your password.",
    forgotOtp: 'Enter the code and choose a new password.',
  };

  function goBack() {
    resetMessages();
    if (view === 'form') setView('welcome');
    else if (view === 'forgotOtp') setView('forgotEmail');
    else setView('form');
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={[styles.backBtn, { top: topPadding }]} onPress={goBack} hitSlop={10}>
        <Ionicons name="chevron-back" size={20} color={colors.text} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.formScroll, { paddingTop: topPadding + 44 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignSelf: 'center', marginBottom: 14 }}>
          <Logo size={56} />
        </View>
        <Text style={styles.title}>{titles[view]}</Text>
        <Text style={styles.subtitle}>{subtitles[view]}</Text>

        {view === 'form' && (
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

            {mode === 'signin' && (
              <Pressable
                onPress={() => {
                  resetMessages();
                  setOtp('');
                  setView('forgotEmail');
                }}
              >
                <Text style={styles.forgotLink}>Forgot password?</Text>
              </Pressable>
            )}

            <Pressable style={[styles.btn, submitting && styles.btnDisabled]} onPress={handleSubmit} disabled={submitting}>
              <Text style={styles.btnText}>{submitting ? 'Please wait…' : mode === 'signup' ? 'Sign up' : 'Sign in'}</Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {info ? <Text style={styles.info}>{info}</Text> : null}

            <Pressable
              onPress={() => {
                resetMessages();
                setMode(mode === 'signup' ? 'signin' : 'signup');
              }}
            >
              <Text style={styles.switch}>
                {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </Text>
            </Pressable>
          </View>
        )}

        {view === 'signupOtp' && (
          <View style={styles.card}>
            <Text style={styles.label}>6-digit code</Text>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="123456"
              placeholderTextColor={colors.textFaint}
            />

            <Pressable
              style={[styles.btn, (submitting || otp.length < 6) && styles.btnDisabled]}
              onPress={verifySignupOtp}
              disabled={submitting || otp.length < 6}
            >
              <Text style={styles.btnText}>{submitting ? 'Verifying…' : 'Verify & continue'}</Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {info ? <Text style={styles.info}>{info}</Text> : null}

            <Pressable onPress={resendSignupOtp}>
              <Text style={styles.switch}>Didn't get a code? Resend</Text>
            </Pressable>
          </View>
        )}

        {view === 'forgotEmail' && (
          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Pressable style={[styles.btn, submitting && styles.btnDisabled]} onPress={requestPasswordReset} disabled={submitting}>
              <Text style={styles.btnText}>{submitting ? 'Sending…' : 'Send code'}</Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {info ? <Text style={styles.info}>{info}</Text> : null}
          </View>
        )}

        {view === 'forgotOtp' && (
          <View style={styles.card}>
            <Text style={styles.label}>6-digit code</Text>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="123456"
              placeholderTextColor={colors.textFaint}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>New password</Text>
            <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry />

            <Text style={[styles.label, { marginTop: 12 }]}>Confirm new password</Text>
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

            <Pressable
              style={[styles.btn, (submitting || otp.length < 6) && styles.btnDisabled]}
              onPress={submitNewPassword}
              disabled={submitting || otp.length < 6}
            >
              <Text style={styles.btnText}>{submitting ? 'Saving…' : 'Reset password'}</Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {info ? <Text style={styles.info}>{info}</Text> : null}

            <Pressable onPress={requestPasswordReset}>
              <Text style={styles.switch}>Didn't get a code? Resend</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  // ---------- Welcome (options) view ----------
  welcomeInner: { flex: 1, paddingHorizontal: 24, paddingBottom: 24, justifyContent: 'space-between' },
  welcomeTop: { alignItems: 'center', marginTop: 24 },
  brand: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 16 },
  optionsWrap: { width: '100%' },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingVertical: 15,
    alignItems: 'center',
    ...shadow,
  },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryBtnText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 12, fontWeight: '600', color: colors.textFaint },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingVertical: 14,
  },
  googleBtnText: { color: colors.text, fontWeight: '700', fontSize: 14.5 },
  terms: { fontSize: 11.5, color: colors.textFaint, textAlign: 'center', lineHeight: 16 },

  // ---------- Email form view ----------
  backBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  formScroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
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
  btnDisabled: { backgroundColor: colors.accentDisabled },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  error: { color: colors.danger, marginTop: 12, textAlign: 'center' },
  info: { color: colors.success, marginTop: 12, textAlign: 'center' },
  switch: { color: colors.accent, fontWeight: '600', marginTop: 18, textAlign: 'center' },
  forgotLink: { color: colors.accent, fontWeight: '600', fontSize: 12.5, textAlign: 'right', marginTop: 10 },
});
