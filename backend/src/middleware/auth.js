const { supabaseAdmin } = require('../config/supabaseClient');

/**
 * Validates the Supabase session token (Authorization: Bearer <token>)
 * and attaches the authenticated user + their app profile (role) to req.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    return res.status(401).json({ error: 'No matching user profile' });
  }

  req.user = profile;
  next();
}

/** Gate a route to admins only. Use after requireAuth. */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Like requireAuth, but doesn't reject when no/invalid token is present —
 * just leaves req.user undefined. Used for routes (like the AI symptom
 * checker) that should work for signed-out visitors too.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return next();

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return next();

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role')
    .eq('id', data.user.id)
    .single();

  if (profile) req.user = profile;
  next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth };
