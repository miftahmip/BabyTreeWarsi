const express = require('express');
const router = express.Router();
const midtransWebhookController = require('../controllers/midtransWebhookController');

router.post('/midtrans/notification', midtransWebhookController.handleNotification);

module.exports = router;