const { supabaseAdmin } = require('../config/supabaseClient');

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

module.exports = { savePushToken };
