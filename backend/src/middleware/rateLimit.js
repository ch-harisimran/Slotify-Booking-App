/**
 * Simple in-memory rate limiter, keyed per signed-in user or, for
 * signed-out callers, per IP (fine for a single backend instance — swap for
 * a Redis-backed limiter before running multiple instances behind a load
 * balancer).
 *
 * IP is read straight from the raw socket connection (`req.socket.
 * remoteAddress`), not from `req.ip`/X-Forwarded-For — this app isn't
 * deployed behind a reverse proxy, so trusting a client-suppliable header
 * here would let anyone bypass the limit just by setting their own
 * X-Forwarded-For. If this ever moves behind a proxy (Render/Railway/Nginx/
 * etc.), switch this to `req.ip` and add `app.set('trust proxy', 1)` in
 * server.js — otherwise every request will collapse onto the proxy's own IP
 * and the limiter will apply to all callers combined instead of each one.
 */
function createRateLimiter({ windowMs, max }) {
  const hits = new Map(); // key -> array of request timestamps (ms)

  // Anonymous (IP-keyed) traffic can create unboundedly many distinct keys
  // over time — periodic sweep drops entries with no recent hits so the map
  // doesn't grow forever.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hits) {
      const fresh = timestamps.filter((t) => now - t < windowMs);
      if (fresh.length === 0) hits.delete(key);
      else hits.set(key, fresh);
    }
  }, windowMs);
  sweep.unref?.();

  return function rateLimiter(req, res, next) {
    const key = req.user?.id ? `user:${req.user.id}` : `ip:${req.socket?.remoteAddress || 'unknown'}`;

    const now = Date.now();
    const timestamps = (hits.get(key) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= max) {
      const retryAfterMs = windowMs - (now - timestamps[0]);
      res.set('Retry-After', String(Math.ceil(retryAfterMs / 1000)));
      return res.status(429).json({ error: 'Too many requests — try again later.' });
    }

    timestamps.push(now);
    hits.set(key, timestamps);
    next();
  };
}

module.exports = { createRateLimiter };
