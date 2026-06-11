const express = require('express');
const router = express.Router();
const DonasiController = require('../controllers/donasiController');
const {verifyToken, allowRole} = require('../middlewares/authMiddleware');

// submit form donasi
router.post(
  '/donasi',
  DonasiController.submitDonasi
);

router.get(
  '/donasi/process',
  verifyToken,
  allowRole(
    'donatur_umum',
    'donatur_corporate'
  ),
  DonasiController.processPendingDonasi
);

router.get(
  '/admin-pusat/program/:id_program/donatur',
  verifyToken,
  allowRole('admin_pusat'),
  DonasiController.detailProgramDonasi
);

module.exports = router;