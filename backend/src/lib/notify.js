const { supabaseAdmin } = require('../config/supabaseClient');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Sends a push notification through Expo's push service. Expo tokens need no
 * special provider credentials (unlike raw FCM/APNs), so this works out of
 * the box. Failures are logged and swallowed — a push failing should never
 * break the booking/cancel/reschedule request that triggered it.
 */
async function sendExpoPush(pushToken, { title, body, data } = {}) {
  if (!pushToken || !pushToken.startsWith('ExponentPushToken')) return;
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ to: pushToken, title, body, data, sound: 'default' }),
    });
    if (!res.ok) {
      console.error('[push] Expo push request failed', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error('[push] Failed to send push notification', err.message);
  }
}

/** Looks up a user's saved Expo push token and sends them a notification, if they have one. */
async function notifyUser(userId, { title, body, data } = {}) {
  const { data: user } = await supabaseAdmin.from('users').select('push_token').eq('id', userId).single();
  if (!user?.push_token) return;
  await sendExpoPush(user.push_token, { title, body, data });
}

function formatWhen(iso) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

/** Fetches a booking's service name for use in a notification body. */
async function serviceNameFor(serviceId) {
  const { data } = await supabaseAdmin.from('services').select('name').eq('id', serviceId).single();
  return data?.name || 'your appointment';
}

async function notifyBookingConfirmed(booking) {
  const serviceName = await serviceNameFor(booking.service_id);
  await notifyUser(booking.user_id, {
    title: 'Booking confirmed',
    body: `${serviceName} on ${formatWhen(booking.start_time)}`,
    data: { type: 'booking_confirmed', bookingId: booking.id },
  });
}

async function notifyBookingCancelled(booking) {
  const serviceName = await serviceNameFor(booking.service_id);
  await notifyUser(booking.user_id, {
    title: 'Booking cancelled',
    body: `${serviceName} on ${formatWhen(booking.start_time)} was cancelled`,
    data: { type: 'booking_cancelled', bookingId: booking.id },
  });
}

async function notifyBookingRescheduled(booking) {
  const serviceName = await serviceNameFor(booking.service_id);
  await notifyUser(booking.user_id, {
    title: 'Booking rescheduled',
    body: `${serviceName} moved to ${formatWhen(booking.start_time)}`,
    data: { type: 'booking_rescheduled', bookingId: booking.id },
  });
}

module.exports = {
  sendExpoPush,
  notifyUser,
  notifyBookingConfirmed,
  notifyBookingCancelled,
  notifyBookingRescheduled,
};
