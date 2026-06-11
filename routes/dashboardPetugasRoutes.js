const router = require('express').Router();
const DashboardPetugasController = require('../controllers/dashboardPetugasController');
const {verifyToken, allowRole} = require('../middlewares/authMiddleware');

router.get(
  '/petugas-lapangan/dashboard',
  verifyToken,
  allowRole('petugas_lapangan'),
  DashboardPetugasController.index
);

module.exports = router;