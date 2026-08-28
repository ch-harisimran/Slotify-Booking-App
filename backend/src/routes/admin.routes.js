const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  listServicesAdmin,
  createService,
  updateService,
  listAvailabilityAdmin,
  createAvailability,
  updateAvailability,
  listAllBookings,
} = require('../controllers/admin.controller');

const router = express.Router();

router.use(requireAuth, requireAdmin);

// Services
router.get('/services', listServicesAdmin);
router.post('/services', createService);
router.patch('/services/:id', updateService);

// Availability
router.get('/availability', listAvailabilityAdmin);
router.post('/availability', createAvailability);
router.patch('/availability/:id', updateAvailability);

// Bookings (read-only overview)
router.get('/bookings', listAllBookings);

module.exports = router;
