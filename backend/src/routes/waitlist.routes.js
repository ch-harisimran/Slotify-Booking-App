const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { listMyWaitlist, joinWaitlist, leaveWaitlist } = require('../controllers/waitlist.controller');

const router = express.Router();

router.use(requireAuth);

// GET /api/waitlist/me
router.get('/me', listMyWaitlist);

// POST /api/waitlist — body: { service_id }
router.post('/', joinWaitlist);

// DELETE /api/waitlist/:id
router.delete('/:id', leaveWaitlist);

module.exports = router;
