'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { IconUser, IconMail, IconLock } from '../../components/icons';
import Logo from '../../components/Logo';

export default function LoginPage() {
  const router = useRouter();
  // 'form' = sign in / sign up | 'signupOtp' = enter code after signup |
  // 'forgotEmail' = ask for email to reset | 'forgotOtp' = enter code + new password
  const [stage, setStage] = useState('form');
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

  function resetMessages() {
    setError('');
    setInfo('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
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
          setStage('signupOtp');
        } else {
          router.push('/');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function verifySignupOtp(e) {
    e.preventDefault();
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
        router.push('/');
      } else {
        setInfo('Verified! You can now sign in.');
        setStage('form');
        setMode('signin');
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

  async function requestPasswordReset(e) {
    e.preventDefault();
    resetMessages();
    setSubmitting(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      if (resetError) throw resetError;
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setInfo(`We sent a 6-digit code to ${email}.`);
      setStage('forgotOtp');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNewPassword(e) {
    e.preventDefault();
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

      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div style={{ maxWidth: 400, margin: '64px auto 0', position: 'relative' }}>
      <div className="hero" style={{ position: 'absolute', inset: '-20px -20px auto -20px', height: 160, zIndex: -1 }} />

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ margin: '0 auto 12px', width: 56, height: 56 }}>
          <Logo size={56} rounded={18} />
        </div>
        <h1 style={{ margin: 0, fontSize: '1.6rem' }}>{titles[stage]}</h1>
        <p className="muted" style={{ marginTop: 4 }}>{subtitles[stage]}</p>
      </div>

      <div className="card-lg">
        {stage === 'form' && (
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="field">
                <label htmlFor="name">Name</label>
                <div className="input-with-icon">
                  <span className="icon-slot"><IconUser size={16} /></span>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Email</label>
              <div className="input-with-icon">
                <span className="icon-slot"><IconMail size={16} /></span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <span className="icon-slot"><IconLock size={16} /></span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </div>

            {mode === 'signin' && (
              <p style={{ textAlign: 'right', marginTop: -6, marginBottom: 14 }}>
                <a
                  href="#"
                  style={{ fontSize: '0.83rem' }}
                  onClick={(e) => {
                    e.preventDefault();
                    resetMessages();
                    setOtp('');
                    setStage('forgotEmail');
                  }}
                >
                  Forgot password?
                </a>
              </p>
            )}

            <button className="btn btn-accent btn-block" type="submit" disabled={submitting}>
              {submitting ? 'Please wait…' : mode === 'signup' ? 'Sign up' : 'Sign in'}
            </button>

            {error && <p className="error-text">{error}</p>}
            {info && <p className="success-text">{info}</p>}
          </form>
        )}

        {stage === 'signupOtp' && (
          <form onSubmit={verifySignupOtp}>
            <div className="field">
              <label htmlFor="otp">6-digit code</label>
              <div className="input-with-icon">
                <span className="icon-slot"><IconLock size={16} /></span>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button className="btn btn-accent btn-block" type="submit" disabled={submitting || otp.length < 6}>
              {submitting ? 'Verifying…' : 'Verify & continue'}
            </button>

            {error && <p className="error-text">{error}</p>}
            {info && <p className="success-text">{info}</p>}

            <p className="muted" style={{ marginTop: 18, fontSize: '0.88rem', textAlign: 'center' }}>
              Didn't get a code?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); resendSignupOtp(); }}>Resend</a>
            </p>
            <p className="muted" style={{ marginTop: 6, fontSize: '0.88rem', textAlign: 'center' }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  resetMessages();
                  setStage('form');
                  setMode('signin');
                }}
              >
                Back to sign in
              </a>
            </p>
          </form>
        )}

        {stage === 'forgotEmail' && (
          <form onSubmit={requestPasswordReset}>
            <div className="field">
              <label htmlFor="reset-email">Email</label>
              <div className="input-with-icon">
                <span className="icon-slot"><IconMail size={16} /></span>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button className="btn btn-accent btn-block" type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send code'}
            </button>

            {error && <p className="error-text">{error}</p>}
            {info && <p className="success-text">{info}</p>}

            <p className="muted" style={{ marginTop: 18, fontSize: '0.88rem', textAlign: 'center' }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  resetMessages();
                  setStage('form');
                }}
              >
                Back to sign in
              </a>
            </p>
          </form>
        )}

        {stage === 'forgotOtp' && (
          <form onSubmit={submitNewPassword}>
            <div className="field">
              <label htmlFor="reset-otp">6-digit code</label>
              <div className="input-with-icon">
                <span className="icon-slot"><IconLock size={16} /></span>
                <input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="new-password">New password</label>
              <div className="input-with-icon">
                <span className="icon-slot"><IconLock size={16} /></span>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="confirm-password">Confirm new password</label>
              <div className="input-with-icon">
                <span className="icon-slot"><IconLock size={16} /></span>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button className="btn btn-accent btn-block" type="submit" disabled={submitting || otp.length < 6}>
              {submitting ? 'Saving…' : 'Reset password'}
            </button>

            {error && <p className="error-text">{error}</p>}
            {info && <p className="success-text">{info}</p>}

            <p className="muted" style={{ marginTop: 18, fontSize: '0.88rem', textAlign: 'center' }}>
              Didn't get a code?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); requestPasswordReset(e); }}>Resend</a>
            </p>
            <p className="muted" style={{ marginTop: 6, fontSize: '0.88rem', textAlign: 'center' }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  resetMessages();
                  setStage('form');
                }}
              >
                Back to sign in
              </a>
            </p>
          </form>
        )}

        {stage === 'form' && (
          <p className="muted" style={{ marginTop: 18, fontSize: '0.88rem', textAlign: 'center' }}>
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                resetMessages();
                setMode(mode === 'signup' ? 'signin' : 'signup');
              }}
            >
              {mode === 'signup' ? 'Sign in' : 'Sign up'}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
