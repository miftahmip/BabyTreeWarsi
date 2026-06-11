const router = require('express').Router();
const PimpinanDashboardController = require('../controllers/pimpinanDashboardController');
const {verifyToken, allowRole} = require('../middlewares/authMiddleware');

router.get(
  '/pimpinan/dashboard',
  verifyToken,
  allowRole('pimpinan'),
  PimpinanDashboardController.dashboard
);

module.exports = router;