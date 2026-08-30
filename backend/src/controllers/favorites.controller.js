const { supabaseAdmin } = require('../config/supabaseClient');

// GET /api/favorites/me — list the signed-in user's favorited doctors
async function listMyFavorites(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('favorites')
      .select('id, service_id, created_at, services(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// POST /api/favorites — body: { service_id }
async function addFavorite(req, res, next) {
  try {
    const { service_id } = req.body;
    if (!service_id) return res.status(400).json({ error: 'service_id is required' });

    const { data, error } = await supabaseAdmin
      .from('favorites')
      .insert({ user_id: req.user.id, service_id })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') return res.status(200).json({ already: true });
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/favorites/:serviceId
async function removeFavorite(req, res, next) {
  try {
    const { serviceId } = req.params;
    const { error } = await supabaseAdmin
      .from('favorites')
      .delete()
      .eq('user_id', req.user.id)
      .eq('service_id', serviceId);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { listMyFavorites, addFavorite, removeFavorite };
