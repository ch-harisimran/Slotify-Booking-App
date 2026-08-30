const { supabaseAdmin } = require('../config/supabaseClient');
const { notifyUser } = require('./notify');

/**
 * Called after a booking for `serviceId` is cancelled. Notifies the
 * longest-waiting person on that service's waitlist that a slot just opened
 * up, then marks them 'notified' so they don't get paged again for the same
 * opening. Only the next-in-line is notified (not everyone waiting) to avoid
 * a stampede onto a single freed slot.
 */
async function notifyWaitlistOnCancellation(serviceId) {
  if (!serviceId) return;

  const { data: next, error } = await supabaseAdmin
    .from('waitlist')
    .select('id, user_id, service_id, services(name)')
    .eq('service_id', serviceId)
    .eq('status', 'waiting')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !next) return;

  await supabaseAdmin
    .from('waitlist')
    .update({ status: 'notified', notified_at: new Date().toISOString() })
    .eq('id', next.id);

  await notifyUser(next.user_id, {
    title: 'A slot opened up',
    body: `A spot with ${next.services?.name || 'a doctor'} just opened up — book it before it's gone.`,
    data: { type: 'waitlist_opening', serviceId: next.service_id },
  });
}

module.exports = { notifyWaitlistOnCancellation };
