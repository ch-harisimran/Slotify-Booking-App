const { supabaseAdmin } = require('../config/supabaseClient');
const { isSlotFree } = require('./bookings.controller');
const { findNearestSlots } = require('../lib/slots');
const { chatJson, badResponseError } = require('../lib/openrouter');
const { notifyBookingRescheduled } = require('../lib/notify');

function buildSystemPrompt() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  return [
    `Today is ${weekday}, ${today}.`,
    "The user is rescheduling an existing appointment. Read their CURRENT message only (not the earlier conversation) for a target day and time.",
    '- date must be YYYY-MM-DD, resolved from relative terms like "tomorrow", "Friday", "next Tuesday" using today\'s date above — always on or after today.',
    '- time must be 24h "HH:MM". Map vague times of day: morning=09:00, afternoon=14:00, evening=17:00.',
    '- If the message does NOT clearly state both a day and a time (e.g. "reschedule it", "move it", "change my appointment", or anything else without an actual day/time in it), you MUST set both date and time to null — never invent or guess one just to have an answer.',
    '- reply: one short, warm sentence. If date/time is missing, ask for it (e.g. "Sure — what day and time works for you?"). If both are present, briefly confirm what you\'re about to do.',
    'Respond ONLY with minified JSON, no markdown fences, no commentary — the entire response must be exactly one JSON object:',
    '{"date": "YYYY-MM-DD or null", "time": "HH:MM or null", "reply": "string"}',
  ].join('\n');
}

const RESCHEDULE_ERROR = "Couldn't understand that — try a specific day and time, e.g. \"Friday at 2pm\".";

async function callOpenRouter(message) {
  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: message },
  ];
  // date/time are allowed to be null (means "ask the user") — only a
  // missing reply counts as a structurally invalid parse.
  return chatJson(messages, { isValid: (parsed) => !!parsed.reply, errorMessage: RESCHEDULE_ERROR });
}

// POST /api/bookings/:id/reschedule-ai — body: { message }
async function rescheduleWithAi(req, res, next) {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not your booking' });
    }

    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('duration_minutes')
      .eq('id', booking.service_id)
      .single();
    if (serviceError || !service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const parsed = await callOpenRouter(message);

    // The message didn't actually specify a day/time (e.g. "reschedule it")
    // — ask instead of guessing one and rescheduling anyway.
    if (!parsed.date || !parsed.time) {
      return res.json({
        needsInfo: true,
        reply: parsed.reply || "Sure — what day and time works for you?",
      });
    }

    const startTime = new Date(`${parsed.date}T${parsed.time}:00.000Z`);
    if (Number.isNaN(startTime.getTime())) throw badResponseError(RESCHEDULE_ERROR);

    if (startTime.getTime() <= Date.now()) {
      return res.json({
        needsInfo: true,
        reply: `${parsed.date} at ${parsed.time} has already passed — what's a future day and time you'd like instead?`,
      });
    }

    const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);

    const free = await isSlotFree({
      service_id: booking.service_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      excludeBookingId: id,
    });

    // Log every attempt (Week 5 spec's AI observability table), whether or not it succeeded.
    await supabaseAdmin.from('reschedule_logs').insert({
      booking_id: id,
      user_message: message,
      ai_parsed_action: { ...parsed, slot_available: free },
    });

    if (!free) {
      const nearestSlots = await findNearestSlots(booking.service_id, parsed.date);
      return res.status(409).json({
        error: 'That time is no longer available.',
        parsed,
        nearest_slots: nearestSlots,
      });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ start_time: startTime.toISOString(), end_time: endTime.toISOString(), status: 'rescheduled' })
      .eq('id', id)
      .select()
      .single();
    if (updateError) throw updateError;
    notifyBookingRescheduled(updated).catch(() => {});

    res.json({ booking: updated, parsed, reply: parsed.reply });
  } catch (err) {
    next(err);
  }
}

module.exports = { rescheduleWithAi };
