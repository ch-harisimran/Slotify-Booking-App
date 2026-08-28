const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createBooking, listMyBookings, updateBooking } = require('../controllers/bookings.controller');
const { rescheduleWithAi } = require('../controllers/aiReschedule.controller');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.use(requireAuth);

const aiRescheduleLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5 });

// POST /api/bookings
router.post('/', createBooking);

// GET /api/bookings/me
router.get('/me', listMyBookings);

// PATCH /api/bookings/:id
router.patch('/:id', updateBooking);

// POST /api/bookings/:id/reschedule-ai — body: { message } — rate-limited (5/hour/user)
router.post('/:id/reschedule-ai', aiRescheduleLimiter, rescheduleWithAi);

module.exports = router;
