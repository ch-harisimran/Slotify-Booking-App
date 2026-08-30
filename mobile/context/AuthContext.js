import { createContext, useContext, useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabaseClient';
import { apiFetch } from '../lib/api';
import { registerForPushNotifications, savePushToken } from '../lib/push';

const AuthContext = createContext({ session: null, profile: null, loading: true });

// Supabase's OAuth flow hands tokens back in the URL fragment
// (slotify://auth/callback#access_token=...&refresh_token=...) rather than
// as query params, so they have to be parsed out by hand and turned into a
// session via setSession — expo-router's own Linking listener only cares
// about the path for navigation, it won't do this part for us.
function extractTokensFromUrl(url) {
  const hash = url.split('#')[1];
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

// Registers this device for push notifications (if not already granted),
// saves the token, then asks the backend to send the welcome push — the
// backend decides "Welcome to Slotify" vs "Welcome back" from how recently
// the account was created. Best-effort throughout: a denied permission or a
// failed request here should never block sign-in.
async function registerAndWelcome(accessToken) {
  try {
    const token = await registerForPushNotifications();
    if (token) await savePushToken(accessToken, token);
  } catch {
    // permission denied or registration failed — still try the welcome push below
  }
  apiFetch('/api/users/welcome-push', { method: 'POST', token: accessToken }).catch(() => {});
}

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

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      loadProfile(newSession);

      // 'SIGNED_IN' only fires for an actual interactive sign-in (password,
      // OTP verification, OAuth) — not for the silent session restore on
      // app relaunch or a background token refresh — so this is the right
      // moment to greet the user: register for push (if not already) and
      // fire the welcome/welcome-back push once a token is saved.
      if (event === 'SIGNED_IN' && newSession) {
        registerAndWelcome(newSession.access_token);
      }
    });

    // Catches the redirect back from the Google sign-in page (see
    // signInWithGoogle below), whether the app was already open or was
    // launched fresh by tapping the redirect link.
    async function handleIncomingUrl(url) {
      const tokens = extractTokensFromUrl(url);
      if (!tokens) return;
      await supabase.auth.setSession(tokens);
    }

    const urlSub = Linking.addEventListener('url', ({ url }) => handleIncomingUrl(url));
    Linking.getInitialURL().then((url) => {
      if (url) handleIncomingUrl(url);
    });

    return () => {
      listener.subscription.unsubscribe();
      urlSub.remove();
    };
  }, []);

  async function refreshProfile() {
    await loadProfile(session);
  }

  // Opens Google's sign-in page in the system browser. Supabase redirects
  // back to `slotify://auth/callback` with the session tokens in the URL
  // fragment, which the listener above picks up and turns into a session.
  // Requires the Google provider to be enabled in Supabase Auth settings and
  // this app's redirect URI to be allow-listed there and in Google Cloud
  // Console — see mobile/README.md.
  async function signInWithGoogle() {
    const redirectTo = Linking.createURL('auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (data?.url) {
      await Linking.openURL(data.url);
    }
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
