const { supabaseAdmin } = require('../config/supabaseClient');

// GET /api/availability?service_id=&date=YYYY-MM-DD — open slots for a given day
async function getAvailability(req, res, next) {
  try {
    const { service_id, date } = req.query;

    if (!service_id || !date) {
      return res.status(400).json({ error: 'service_id and date are required' });
    }

    const parsedDate = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
    }
    const dayOfWeek = parsedDate.getUTCDay();

    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('id, duration_minutes')
      .eq('id', service_id)
      .single();
    if (serviceError || !service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const { data: windows, error: windowsError } = await supabaseAdmin
      .from('availability')
      .select('start_time, end_time')
      .eq('service_id', service_id)
      .eq('day_of_week', dayOfWeek);
    if (windowsError) throw windowsError;

    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd = `${date}T23:59:59.999Z`;
    const { data: existingBookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('start_time, end_time')
      .eq('service_id', service_id)
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

        if (!overlaps) {
          slots.push({ start_time: slotStart.toISOString(), end_time: slotEnd.toISOString() });
        }
        cursor = new Date(cursor.getTime() + duration * 60000);
      }
    }

    res.json({ service_id, date, duration_minutes: duration, slots });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAvailability };
