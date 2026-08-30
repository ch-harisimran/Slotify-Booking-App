const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { savePushToken, sendWelcomePush, deleteAccount } = require('../controllers/users.controller');

const router = express.Router();

router.use(requireAuth);

// PATCH /api/users/push-token — body: { push_token }
router.patch('/push-token', savePushToken);

// POST /api/users/welcome-push
router.post('/welcome-push', sendWelcomePush);

// DELETE /api/users/me — permanently deletes the account (cancels bookings first)
router.delete('/me', deleteAccount);

module.exports = router;
