const { supabaseAdmin } = require('../config/supabaseClient');

async function isSlotFree({ service_id, start_time, end_time, excludeBookingId }) {
  let query = supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('service_id', service_id)
    .neq('status', 'cancelled')
    .lt('start_time', end_time)
    .gt('end_time', start_time);

  if (excludeBookingId) {
    query = query.neq('id', excludeBookingId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data.length === 0;
}

// POST /api/bookings — create a booking (authenticated)
async function createBooking(req, res, next) {
  try {
    const { service_id, start_time, end_time } = req.body;
    if (!service_id || !start_time || !end_time) {
      return res.status(400).json({ error: 'service_id, start_time, and end_time are required' });
    }
    if (new Date(end_time) <= new Date(start_time)) {
      return res.status(400).json({ error: 'end_time must be after start_time' });
    }

    const free = await isSlotFree({ service_id, start_time, end_time });
    if (!free) {
      return res.status(409).json({ error: 'That slot is no longer available' });
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        user_id: req.user.id,
        service_id,
        start_time,
        end_time,
        status: 'confirmed',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/bookings/me — logged-in user's bookings
async function listMyBookings(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*, services(name, duration_minutes, price, specialty, photo_url)')
      .eq('user_id', req.user.id)
      .order('start_time', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/bookings/:id — manual reschedule/cancel (owner or admin)
async function updateBooking(req, res, next) {
  try {
    const { id } = req.params;
    const { start_time, end_time, status } = req.body;

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

    const updates = {};

    if (status) {
      if (!['confirmed', 'cancelled', 'rescheduled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updates.status = status;
    }

    if (start_time || end_time) {
      const newStart = start_time || booking.start_time;
      const newEnd = end_time || booking.end_time;
      if (new Date(newEnd) <= new Date(newStart)) {
        return res.status(400).json({ error: 'end_time must be after start_time' });
      }
      const free = await isSlotFree({
        service_id: booking.service_id,
        start_time: newStart,
        end_time: newEnd,
        excludeBookingId: id,
      });
      if (!free) {
        return res.status(409).json({ error: 'That slot is no longer available' });
      }
      updates.start_time = newStart;
      updates.end_time = newEnd;
      if (!status) updates.status = 'rescheduled';
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { createBooking, listMyBookings, updateBooking, isSlotFree };
