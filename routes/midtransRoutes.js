const express = require('express');
const router = express.Router();
const MidtransWebhookController = require('../controllers/midtransWebhookController');

router.post(
  '/midtrans/notification',
  MidtransWebhookController.handleNotification
);

module.exports = router;