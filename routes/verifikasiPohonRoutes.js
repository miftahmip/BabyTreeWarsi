const router =
  require('express').Router();

const VerifikasiPohonController =
  require('../controllers/verifikasiPohonController');

const {
  verifyToken,
  allowRole
} = require('../middlewares/authMiddleware');


// =================================================
// LIST PENANAMAN
// =================================================
router.get(

  '/admin-wilayah/verifikasi-pohon',

  verifyToken,
  allowRole('admin_wilayah'),

  VerifikasiPohonController.index

);


// =================================================
// DETAIL VERIFIKASI
// =================================================
router.get(

  '/admin-wilayah/verifikasi-pohon/:id_penanaman',

  verifyToken,
  allowRole('admin_wilayah'),

  VerifikasiPohonController.detail

);


// =================================================
// APPROVE MASSAL
// =================================================
router.post(

  '/admin-wilayah/verifikasi-pohon/approve',

  verifyToken,
  allowRole('admin_wilayah'),

  VerifikasiPohonController.approve

);


// =================================================
// REVISI MASSAL
// =================================================
router.post(

  '/admin-wilayah/verifikasi-pohon/revisi',

  verifyToken,
  allowRole('admin_wilayah'),

  VerifikasiPohonController.revisi

);

router.post(
  '/admin-wilayah/verifikasi-monitoring/approve',
  verifyToken,
  allowRole('admin_wilayah'),

  VerifikasiPohonController.approveMonitoring
);

router.post(
  '/admin-wilayah/verifikasi-monitoring/revisi',
  verifyToken,
  allowRole('admin_wilayah'),

  VerifikasiPohonController.revisiMonitoring
);

module.exports = router;