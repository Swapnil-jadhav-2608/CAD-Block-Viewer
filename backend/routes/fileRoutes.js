// File: backend/routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

router.post('/upload', fileController.uploadFile);
router.get('/entities', fileController.getEntities);
router.get('/block/:name', fileController.getBlock); 
router.get('/entities/all', fileController.getAllEntities);
module.exports = router;