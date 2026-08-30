const { supabaseAdmin } = require('../config/supabaseClient');

// --- Services ---

async function listServicesAdmin(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin.from('services').select('*').order('name');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function createService(req, res, next) {
  try {
    const { name, duration_minutes, price, description } = req.body;
    if (!name || !duration_minutes) {
      return res.status(400).json({ error: 'name and duration_minutes are required' });
    }
    const { data, error } = await supabaseAdmin
      .from('services')
      .insert({ name, duration_minutes, price: price || 0, description })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

async function updateService(req, res, next) {
  try {
    const { id } = req.params;
    const { name, duration_minutes, price, description } = req.body;
    const { data, error } = await supabaseAdmin
      .from('services')
      .update({ name, duration_minutes, price, description })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Service not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// --- Availability ---

async function listAvailabilityAdmin(req, res, next) {
  try {
    const { service_id } = req.query;
    let query = supabaseAdmin.from('availability').select('*').order('day_of_week');
    if (service_id) query = query.eq('service_id', service_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function createAvailability(req, res, next) {
  try {
    const { service_id, day_of_week, start_time, end_time } = req.body;
    if (service_id === undefined || day_of_week === undefined || !start_time || !end_time) {
      return res.status(400).json({ error: 'service_id, day_of_week, start_time, and end_time are required' });
    }
    const { data, error } = await supabaseAdmin
      .from('availability')
      .insert({ service_id, day_of_week, start_time, end_time })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

async function updateAvailability(req, res, next) {
  try {
    const { id } = req.params;
    const { day_of_week, start_time, end_time } = req.body;
    const { data, error } = await supabaseAdmin
      .from('availability')
      .update({ day_of_week, start_time, end_time })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Availability window not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// --- Bookings (read-all for admins) ---

async function listAllBookings(req, res, next) {
  try {
    const { date, service_id, status } = req.query;
    let query = supabaseAdmin
      .from('bookings')
      .select('*, users(name, email), services(name, specialty, price, duration_minutes)')
      .order('start_time', { ascending: true });

    if (date) {
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      const dayEnd = new Date(`${date}T23:59:59.999Z`);
      query = query.gte('start_time', dayStart.toISOString()).lte('start_time', dayEnd.toISOString());
    }
    if (service_id) query = query.eq('service_id', service_id);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listServicesAdmin,
  createService,
  updateService,
  listAvailabilityAdmin,
  createAvailability,
  updateAvailability,
  listAllBookings,
};
