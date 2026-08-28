const { supabaseAdmin } = require('../config/supabaseClient');

// GET /api/services — public
async function listServices(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { listServices };
