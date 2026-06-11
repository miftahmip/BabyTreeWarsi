'use strict';

const router = require('express').Router();
const ProfileController = require('../controllers/profileController');
const { verifyToken, allowRole } = require('../middlewares/authMiddleware');

const semuaRole = allowRole(
  'admin_pusat',
  'admin_wilayah',
  'petugas_lapangan',
  'donatur_umum',
  'donatur_corporate',
  'pimpinan'
);

router.get(
  '/profile',
  verifyToken,
  semuaRole,
  ProfileController.getProfile
);


router.post(
  '/profile/update',
  verifyToken,
  semuaRole,
  ProfileController.updateProfile
);

module.exports = router;