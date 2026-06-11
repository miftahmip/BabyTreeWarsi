'use strict';

const router = require('express').Router();
const ForgotPasswordController = require('../controllers/forgotPasswordController');

router.get(
  '/forgot-password',
  ForgotPasswordController.forgotPasswordPage
);

router.post(
  '/forgot-password',
  ForgotPasswordController.sendResetEmail
);

router.get(
  '/reset-password',
  ForgotPasswordController.resetPasswordPage
);

router.post(
  '/reset-password',
  ForgotPasswordController.processResetPassword
);

module.exports = router;