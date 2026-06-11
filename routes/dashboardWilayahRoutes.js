const router = require('express').Router();
const DashboardWilayahController = require('../controllers/dashboardWilayahController');
const {verifyToken, allowRole} = require('../middlewares/authMiddleware');

router.get(
  '/admin-wilayah/dashboard',
  verifyToken,
  allowRole('admin_wilayah'),
  DashboardWilayahController.index
);

module.exports = router;