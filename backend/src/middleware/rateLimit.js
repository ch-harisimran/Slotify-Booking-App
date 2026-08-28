/**
 * Simple in-memory per-user rate limiter (fine for a single backend instance —
 * swap for a Redis-backed limiter before running multiple instances behind a
 * load balancer).
 */
function createRateLimiter({ windowMs, max }) {
  const hits = new Map(); // userId -> array of request timestamps (ms)

  return function rateLimiter(req, res, next) {
    const key = req.user?.id;
    if (!key) return next();

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
