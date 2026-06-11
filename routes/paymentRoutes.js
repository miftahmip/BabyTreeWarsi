const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');

router.get(
  '/payment/:order_id',
  PaymentController.getPaymentPage
);

module.exports = router;