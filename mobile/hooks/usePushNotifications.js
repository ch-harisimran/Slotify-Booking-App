import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { apiFetch } from '../lib/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Requests push notification permission, grabs the device's Expo push
 * token, and — once a session is available — saves it to the backend
 * (`users.push_token`) so booking confirmation/cancellation/reschedule
 * pushes and waitlist "a slot opened up" alerts can actually be sent.
 * Pass the current Supabase session's access_token; the hook re-saves
 * whenever either the token or the session changes.
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
    apiFetch('/api/users/push-token', {
      method: 'PATCH',
      token: accessToken,
      body: { push_token: expoPushToken },
    }).catch(() => {});
  }, [expoPushToken, accessToken]);

  return { expoPushToken, error };
}

async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.warn('[usePushNotifications] Push notifications require a physical device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('[usePushNotifications] Permission not granted.');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync();
  return token;
}
