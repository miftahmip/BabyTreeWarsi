const express = require('express');
const router = express.Router();
const donasiController = require('../controllers/donasiController');
const {verifyToken, allowRole} = require('../middlewares/authMiddleware');

// submit form donasi
router.post('/donasi', donasiController.submitDonasi);
router.get('/admin-pusat/program/:id_program/donatur', verifyToken, allowRole('admin_pusat'), donasiController.detailProgramDonasi);

module.exports = router;