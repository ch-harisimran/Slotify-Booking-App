const express = require('express');
const { listServices } = require('../controllers/services.controller');

const router = express.Router();

// GET /api/services — public
router.get('/', listServices);

module.exports = router;
