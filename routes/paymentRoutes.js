const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const {verifyToken, allowRole} = require('../middlewares/authMiddleware');

router.get(
  '/payment/:order_id',
  PaymentController.getPaymentPage
);

router.post(
  '/donasi/:id_donasi/retry-payment',
  verifyToken,
  allowRole(
    'donatur_umum',
    'donatur_corporate'
  ),
  PaymentController.retryPayment
);

module.exports = router;