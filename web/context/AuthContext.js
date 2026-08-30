'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({ session: null, profile: null, loading: true });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(currentSession) {
    if (!currentSession) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from('users')
      .select('id, name, email, role, avatar_url')
      .eq('id', currentSession.user.id)
      .single();
    setProfile(data || null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      loadProfile(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function refreshProfile() {
    await loadProfile(session);
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
