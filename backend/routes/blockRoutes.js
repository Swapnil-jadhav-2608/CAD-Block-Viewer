// routes/blockRoutes.js
const express = require('express');
const router = express.Router();
const blockController = require('../controllers/blockController');

router.get('/', blockController.getBlocks);
router.get('/:name', blockController.getBlockByName); // Changed from ID to name

module.exports = router;