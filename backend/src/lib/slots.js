const { supabaseAdmin } = require('../config/supabaseClient');

/**
 * Computes open booking slots for a service on a given date (YYYY-MM-DD).
 * Returns { duration_minutes, slots } or null if the service/date is invalid.
 * Shared by GET /api/availability and the AI reschedule "nearest slots" fallback.
 */
async function getOpenSlotsForDate(serviceId, date) {
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime())) return null;
  const dayOfWeek = parsedDate.getUTCDay();

  const { data: service, error: serviceError } = await supabaseAdmin
    .from('services')
    .select('id, duration_minutes')
    .eq('id', serviceId)
    .single();
  if (serviceError || !service) return null;

  const { data: windows, error: windowsError } = await supabaseAdmin
    .from('availability')
    .select('start_time, end_time')
    .eq('service_id', serviceId)
    .eq('day_of_week', dayOfWeek);
  if (windowsError) throw windowsError;

  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;
  const { data: existingBookings, error: bookingsError } = await supabaseAdmin
    .from('bookings')
    .select('start_time, end_time')
    .eq('service_id', serviceId)
    .neq('status', 'cancelled')
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd);
  if (bookingsError) throw bookingsError;

  const duration = service.duration_minutes;
  const slots = [];

  for (const window of windows) {
    const [startH, startM] = window.start_time.split(':').map(Number);
    const [endH, endM] = window.end_time.split(':').map(Number);

    let cursor = new Date(`${date}T00:00:00.000Z`);
    cursor.setUTCHours(startH, startM, 0, 0);
    const windowEnd = new Date(`${date}T00:00:00.000Z`);
    windowEnd.setUTCHours(endH, endM, 0, 0);

    while (cursor.getTime() + duration * 60000 <= windowEnd.getTime()) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(cursor.getTime() + duration * 60000);

      const overlaps = existingBookings.some((b) => {
        const bStart = new Date(b.start_time).getTime();
        const bEnd = new Date(b.end_time).getTime();
        return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
      });

      // Skip slots that have already started — otherwise a same-day search
      // shows "open" times earlier than right now, which nobody can book.
      if (!overlaps && slotStart.getTime() > Date.now()) {
        slots.push({ start_time: slotStart.toISOString(), end_time: slotEnd.toISOString() });
      }
      cursor = new Date(cursor.getTime() + duration * 60000);
    }
  }

  return { duration_minutes: duration, slots };
}

/**
 * Walks forward day-by-day from `fromDate` collecting open slots for a
 * service, up to `limit` slots or `maxDays` days out. Shared by the AI
 * reschedule and AI assistant controllers as their "here's the nearest
 * available time instead" fallback.
 */
async function findNearestSlots(serviceId, fromDate, maxDays = 7, limit = 3) {
  const found = [];
  const cursor = new Date(`${fromDate}T00:00:00.000Z`);

  for (let i = 0; i < maxDays && found.length < limit; i += 1) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const result = await getOpenSlotsForDate(serviceId, dateStr);
    if (result) {
      for (const slot of result.slots) {
        if (found.length >= limit) break;
        found.push(slot);
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return found;
}

module.exports = { getOpenSlotsForDate, findNearestSlots };
