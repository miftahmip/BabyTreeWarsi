const router = require('express').Router();
const AdminPusatDashboardController = require('../controllers/adminPusatDashboardController');
const {verifyToken, allowRole} = require('../middlewares/authMiddleware');


router.get(
  '/admin-pusat/dashboard',
  verifyToken,
  allowRole('admin_pusat'),
  AdminPusatDashboardController.dashboard
);


module.exports = router;

