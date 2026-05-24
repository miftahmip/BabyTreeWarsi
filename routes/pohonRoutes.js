const router = require('express').Router();

const PohonController = require('../controllers/pohonController');
const upload = require('../middlewares/uploadPohonMiddleware');
const {verifyToken, allowRole} = require('../middlewares/authMiddleware');


// LIST DATA POHON
router.get(
  '/petugas-lapangan/pohon/:id_penanaman',
  verifyToken,
  allowRole('petugas_lapangan'),
  PohonController.index
);


// CREATE
router.post(
  '/petugas-lapangan/pohon/create',
  verifyToken,
  allowRole('petugas_lapangan'),
  upload.array('foto_bukti_tanam', 10),
  PohonController.create
);


// DETAIL
router.get(
  '/petugas-lapangan/pohon/detail/:id',
  verifyToken,
  allowRole('petugas_lapangan'),
  PohonController.detail
);


// UPDATE
router.post(
  '/petugas-lapangan/pohon/update/:id',
  verifyToken,
  allowRole('petugas_lapangan'),
  upload.array('foto_bukti_tanam', 10),
  PohonController.update
);


// HALAMAN QR CODE
router.get(
  '/petugas-lapangan/pohon/qr/:id',
  verifyToken,
  allowRole('petugas_lapangan'),
  PohonController.qrCode
);


// DOWNLOAD QR CODE
router.get(
  '/petugas-lapangan/pohon/qr/download/:id',
  verifyToken,
  allowRole('petugas_lapangan'),
  PohonController.downloadQR
);

module.exports = router;