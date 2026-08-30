const { supabaseAdmin } = require('../config/supabaseClient');

// GET /api/waitlist/me — the signed-in user's waitlist entries
async function listMyWaitlist(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('waitlist')
      .select('*, services(name, specialty, photo_url)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// POST /api/waitlist — body: { service_id } — join a service's waitlist
async function joinWaitlist(req, res, next) {
  try {
    const { service_id } = req.body;
    if (!service_id) {
      return res.status(400).json({ error: 'service_id is required' });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('waitlist')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('service_id', service_id)
      .eq('status', 'waiting')
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      return res.status(409).json({ error: "You're already on the waitlist for this doctor" });
    }

    const { data, error } = await supabaseAdmin
      .from('waitlist')
      .insert({ user_id: req.user.id, service_id, status: 'waiting' })
      .select('*, services(name, specialty, photo_url)')
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/waitlist/:id — leave a waitlist
async function leaveWaitlist(req, res, next) {
  try {
    const { id } = req.params;
    const { data: entry, error: fetchError } = await supabaseAdmin
      .from('waitlist')
      .select('user_id')
      .eq('id', id)
      .single();
    if (fetchError || !entry) {
      return res.status(404).json({ error: 'Waitlist entry not found' });
    }
    if (entry.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not your waitlist entry' });
    }
    const { error } = await supabaseAdmin.from('waitlist').delete().eq('id', id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { listMyWaitlist, joinWaitlist, leaveWaitlist };
