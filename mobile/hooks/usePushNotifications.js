import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Requests push notification permission and returns the device's Expo push token.
 *
 * Week 4 TODO: send this token to the backend (e.g. a `push_token` column on
 * `public.users`) so booking confirmations/reminders can actually be sent via
 * Expo's push service. This hook only handles the client-side registration.
 */
export function usePushNotifications() {
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
