const router = require('express').Router();

const PohonController = require('../controllers/pohonController');
const upload = require('../middlewares/uploadPohonMiddleware');
const {verifyToken, allowRole} = require('../middlewares/authMiddleware');


router.get('/petugas-lapangan/pohon/scan', verifyToken, allowRole('petugas_lapangan'), PohonController.scanQRPage);
router.post('/petugas-lapangan/pohon/scan', verifyToken, allowRole('petugas_lapangan'), PohonController.processScanQR);

router.get('/petugas-lapangan/pohon/:id_penanaman', verifyToken, allowRole('petugas_lapangan'), PohonController.index);
router.post('/petugas-lapangan/pohon/create', verifyToken, allowRole('petugas_lapangan'), upload.array('foto_bukti_tanam', 10), PohonController.create);
router.get('/petugas-lapangan/pohon/detail/:id', verifyToken, allowRole('petugas_lapangan'), PohonController.detail);
router.post('/petugas-lapangan/pohon/update/:id', verifyToken, allowRole('petugas_lapangan'), upload.array('foto_bukti_tanam', 10), PohonController.update);

router.get('/petugas-lapangan/pohon/qr/:id', verifyToken, allowRole('petugas_lapangan'), PohonController.qrCode);
router.get('/petugas-lapangan/pohon/qr/download/:id', verifyToken, allowRole('petugas_lapangan'), PohonController.downloadQR);

module.exports = router;