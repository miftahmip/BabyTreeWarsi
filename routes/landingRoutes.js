const express = require('express');
const router = express.Router();
const landingController = require('../controllers/landingController');

// landing page
router.get('/', landingController.landingPage);

// detail program
router.get('/program/:id', landingController.detailProgram);

module.exports = router;