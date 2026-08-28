const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createBooking, listMyBookings, updateBooking } = require('../controllers/bookings.controller');

const router = express.Router();

router.use(requireAuth);

// POST /api/bookings
router.post('/', createBooking);

// GET /api/bookings/me
router.get('/me', listMyBookings);

// PATCH /api/bookings/:id
router.patch('/:id', updateBooking);

module.exports = router;
