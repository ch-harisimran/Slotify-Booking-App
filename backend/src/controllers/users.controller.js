const { supabaseAdmin } = require('../config/supabaseClient');
const { notifyWelcome } = require('../lib/notify');
const { notifyWaitlistOnCancellation } = require('../lib/waitlist');

// PATCH /api/users/push-token — body: { push_token } (or null to clear on sign-out)
async function savePushToken(req, res, next) {
  try {
    const { push_token } = req.body;
    if (push_token !== null && typeof push_token !== 'string') {
      return res.status(400).json({ error: 'push_token must be a string or null' });
    }
    const { error } = await supabaseAdmin
      .from('users')
      .update({ push_token })
      .eq('id', req.user.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// A signed-in session that starts within this long of the account's
// created_at row is treated as "just signed up" (OTP verification takes a
// minute or two) — anything later is a returning sign-in.
const NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;

// POST /api/users/welcome-push — called by the mobile app right after a
// SIGNED_IN auth event. Fires "Welcome to Slotify" for a brand-new account
// or "Welcome back" for a returning one; a no-op if no push token is saved
// yet (best-effort, same as every other push in this app).
async function sendWelcomePush(req, res, next) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('created_at')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;

    const isNewAccount = !!user?.created_at && Date.now() - new Date(user.created_at).getTime() < NEW_ACCOUNT_WINDOW_MS;
    await notifyWelcome(req.user.id, isNewAccount);
    res.json({ ok: true, isNewAccount });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/users/me — permanently deletes the signed-in user's account.
// Cancels every upcoming booking first (so any waitlisted users for that
// doctor get notified a slot just opened up), then deletes the auth user —
// which cascades to the public.users row and, from there, to their
// bookings, favorites, and waitlist entries. Their past symptom-check logs
// are kept but anonymized (user_id set to null) rather than deleted, since
// they're also used for the app's own AI-quality history.
async function deleteAccount(req, res, next) {
  try {
    const userId = req.user.id;

    const { data: activeBookings, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, service_id')
      .eq('user_id', userId)
      .neq('status', 'cancelled');
    if (fetchError) throw fetchError;

    if (activeBookings && activeBookings.length > 0) {
      const bookingIds = activeBookings.map((b) => b.id);
      const { error: cancelError } = await supabaseAdmin
        .from('bookings')
        .update({ status: 'cancelled' })
        .in('id', bookingIds);
      if (cancelError) throw cancelError;

      const affectedServiceIds = [...new Set(activeBookings.map((b) => b.service_id))];
      await Promise.all(affectedServiceIds.map((serviceId) => notifyWaitlistOnCancellation(serviceId).catch(() => {})));
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { savePushToken, sendWelcomePush, deleteAccount };
