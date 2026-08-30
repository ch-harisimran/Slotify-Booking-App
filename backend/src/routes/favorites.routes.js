const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { listMyFavorites, addFavorite, removeFavorite } = require('../controllers/favorites.controller');

const router = express.Router();

router.use(requireAuth);

// GET /api/favorites/me
router.get('/me', listMyFavorites);

// POST /api/favorites — body: { service_id }
router.post('/', addFavorite);

// DELETE /api/favorites/:serviceId
router.delete('/:serviceId', removeFavorite);

module.exports = router;
