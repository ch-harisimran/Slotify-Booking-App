import { useEffect, useState } from 'react';
import { registerForPushNotifications, savePushToken } from '../lib/push';

/**
 * Requests push notification permission, grabs the device's Expo push
 * token, and — once a session is available — saves it to the backend
 * (`users.push_token`) so booking confirmation/cancellation/reschedule
 * pushes and waitlist "a slot opened up" alerts can actually be sent.
 * Pass the current Supabase session's access_token; the hook re-saves
 * whenever either the token or the session changes.
 *
 * This is a redundant safety net for whenever the bookings screen mounts —
 * the primary registration path is AuthContext's SIGNED_IN handler, which
 * runs immediately after login/signup so the welcome push has a token.
 */
export function usePushNotifications(accessToken) {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    registerForPushNotifications()
      .then((token) => {
        if (!cancelled) setExpoPushToken(token);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!expoPushToken || !accessToken) return;
    savePushToken(accessToken, expoPushToken).catch(() => {});
  }, [expoPushToken, accessToken]);

  return { expoPushToken, error };
}
