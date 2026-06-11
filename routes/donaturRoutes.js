const router = require('express').Router();

const DonaturController = require('../controllers/donaturController');
const {verifyToken, allowRole} = require('../middlewares/authMiddleware');

router.get(
  '/donatur/donasi-saya',
  verifyToken,
  allowRole('donatur_umum'),
  DonaturController.donasiSaya
);

router.get(
  '/donatur/dashboard-program/:id',
  verifyToken,
  allowRole('donatur_umum'),
  DonaturController.dashboardProgram
);

module.exports = router;