import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { apiFetch } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Requests push notification permission and returns the device's Expo push
 * token (or null if unavailable/denied). Shared by usePushNotifications
 * (registers on the bookings screen) and AuthContext (registers right after
 * sign-in so the welcome push has a token to land on).
 */
export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.warn('[push] Push notifications require a physical device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('[push] Permission not granted.');
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

/** Saves an Expo push token to `users.push_token` for the signed-in user. */
export async function savePushToken(accessToken, pushToken) {
  if (!accessToken || !pushToken) return;
  await apiFetch('/api/users/push-token', {
    method: 'PATCH',
    token: accessToken,
    body: { push_token: pushToken },
  });
}
