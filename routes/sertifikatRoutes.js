const express = require('express');
const router = express.Router();
const SertifikatController = require('../controllers/sertifikatController');
const { verifyToken, allowRole } = require('../middlewares/authMiddleware');

// daftar program yang bisa diklaim / sudah diklaim
router.get(
  '/donatur/sertifikat',
  verifyToken,
  allowRole(
    'donatur_umum',
    'donatur_corporate'
  ),
  SertifikatController.daftarProgramBisaDiklaim
);

// klaim sertifikat untuk suatu program
router.post(
  '/donatur/sertifikat/klaim/:id_program',
  verifyToken,
  allowRole(
    'donatur_umum',
    'donatur_corporate'
  ),
  SertifikatController.klaimSertifikat
);

// detail 1 sertifikat
router.get(
  '/donatur/sertifikat/:id_sertifikat',
  verifyToken,
  allowRole(
    'donatur_umum',
    'donatur_corporate'
  ),
  SertifikatController.detailSertifikat
);

// download PDF sertifikat
router.get(
  '/donatur/sertifikat/:id_sertifikat/download',
  verifyToken,
  allowRole(
    'donatur_umum',
    'donatur_corporate'
  ),
  SertifikatController.downloadSertifikat
);

module.exports = router;