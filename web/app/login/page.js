'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { IconCalendar } from '../../components/icons';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
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

  return (
    <div style={{ maxWidth: 400, margin: '64px auto 0', position: 'relative' }}>
      <div className="hero" style={{ position: 'absolute', inset: '-20px -20px auto -20px', height: 160, zIndex: -1 }} />

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div className="avatar avatar-lg" style={{ margin: '0 auto 12px' }}>
          <IconCalendar size={24} />
        </div>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="muted" style={{ marginTop: 4 }}>
          {mode === 'signup' ? 'Book appointments in a few taps.' : 'Sign in to manage your bookings.'}
        </p>
      </div>

      <div className="card-lg">
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <button className="btn btn-accent btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'signup' ? 'Sign up' : 'Sign in'}
          </button>

          {error && <p className="error-text">{error}</p>}
          {info && <p className="success-text">{info}</p>}
        </form>

        <p className="muted" style={{ marginTop: 18, fontSize: '0.88rem', textAlign: 'center' }}>
          {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setError('');
              setInfo('');
              setMode(mode === 'signup' ? 'signin' : 'signup');
            }}
          >
            {mode === 'signup' ? 'Sign in' : 'Sign up'}
          </a>
        </p>
      </div>
    </div>
  );
}
