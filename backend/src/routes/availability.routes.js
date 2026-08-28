const express = require('express');
const { getAvailability } = require('../controllers/availability.controller');

const router = express.Router();

// GET /api/availability?service_id=&date= — public
router.get('/', getAvailability);

module.exports = router;
