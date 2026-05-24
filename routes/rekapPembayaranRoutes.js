const router = require('express').Router();
const RekapPembayaranController = require('../controllers/rekapPembayaranController');
const {verifyToken, allowRole} = require('../middlewares/authMiddleware');


router.get(
  '/admin-wilayah/rekap-pembayaran',
  verifyToken,
  allowRole('admin_wilayah'),
  RekapPembayaranController.listProgram
);


router.get(
  '/admin-wilayah/rekap-pembayaran/program/:id_program',
  verifyToken,
  allowRole('admin_wilayah'),
  RekapPembayaranController.listPenanaman
);


router.get(
  '/admin-wilayah/rekap-pembayaran/penanaman/:id_penanaman',
  verifyToken,
  allowRole('admin_wilayah'),
  RekapPembayaranController.detailRekap
);

router.get(
  '/admin-wilayah/rekap-pembayaran/export/:id_penanaman',
  verifyToken,
  allowRole('admin_wilayah'),
  RekapPembayaranController.exportExcel
);


module.exports = router;