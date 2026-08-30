const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { savePushToken } = require('../controllers/users.controller');

const router = express.Router();

router.use(requireAuth);

// PATCH /api/users/push-token — body: { push_token }
router.patch('/push-token', savePushToken);

module.exports = router;
