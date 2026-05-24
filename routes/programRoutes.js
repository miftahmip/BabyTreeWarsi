const express = require('express');
const router = express.Router();

const ProgramDonasiController = require('../controllers/programDonasiController');
const { verifyToken, allowRole } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadProgram');
const WilayahService = require('../services/wilayahService');

router.get(
  '/admin-pusat/kelola-program',
  verifyToken,
  allowRole('admin_pusat'),
  ProgramDonasiController.index
);

router.post(
  '/admin-pusat/kelola-program/create',
  verifyToken,
  allowRole('admin_pusat'),
  upload.single('flyer'),
  ProgramDonasiController.store
);

router.post(
  '/admin-pusat/kelola-program/edit/:id',
  verifyToken,
  allowRole('admin_pusat'),
  upload.single('flyer'),
  ProgramDonasiController.update
);

router.post(
  '/admin-pusat/kelola-program/delete/:id',
  verifyToken,
  allowRole('admin_pusat'),
  ProgramDonasiController.destroy
);

/* API Wilayah */
router.get('/api/provinces', ProgramDonasiController.getProvinces);
router.get('/api/regencies/:provinceCode', ProgramDonasiController.getRegencies);
router.get('/api/districts/:regencyCode', ProgramDonasiController.getDistricts);
router.get('/api/villages/:districtCode', ProgramDonasiController.getVillages);

module.exports = router;