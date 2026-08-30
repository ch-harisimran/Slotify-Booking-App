const express = require('express');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { chat, getHistory } = require('../controllers/aiAssistant.controller');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const chatLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 40 });

// POST /api/ai/chat — body: { message, history? } — works signed-in or signed-out.
// Handles greetings, symptom triage + doctor recommendations, "which doctor is
// best", booking an appointment entirely through the conversation, and
// signed-in-only lookups of the user's own upcoming appointments / past
// symptom checks.
router.post('/chat', optionalAuth, chatLimiter, chat);

// GET /api/ai/history — signed-in only. Returns the user's persisted chat
// thread so the AI screen can resume instead of resetting on every visit.
router.get('/history', requireAuth, getHistory);

module.exports = router;
