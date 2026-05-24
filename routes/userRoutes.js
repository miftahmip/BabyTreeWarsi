const express = require('express');
const router = express.Router();

const UserManagementController = require('../controllers/userManagementController');
const {verifyToken, allowRole} = require('../middlewares/authMiddleware');


router.get(
    '/admin-pusat/kelola-akun',
    verifyToken,
    allowRole('admin_pusat'),
    UserManagementController.index
);

/* TAMBAH */
router.post(
    '/admin-pusat/kelola-akun/create',
    verifyToken,
    allowRole('admin_pusat'),
    UserManagementController.store
);

/* UPDATE */
router.post(
    '/admin-pusat/kelola-akun/edit/:id',
    verifyToken,
    allowRole('admin_pusat'),
    UserManagementController.update
);

/* DELETE */
router.post(
    '/admin-pusat/kelola-akun/delete/:id',
    verifyToken,
    allowRole('admin_pusat'),
    UserManagementController.destroy
);

module.exports = router;