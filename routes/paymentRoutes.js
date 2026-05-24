const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/payment/:order_id', paymentController.getPaymentPage);

module.exports = router;