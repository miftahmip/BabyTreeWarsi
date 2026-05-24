const router = require('express').Router();

const JenisPohonController = require('../controllers/jenisPohonController');
const {verifyToken, allowRole} = require('../middlewares/authMiddleware');


router.get('/admin-wilayah/jenis-pohon', verifyToken, allowRole('admin_wilayah'), JenisPohonController.getAll);
router.post('/admin-wilayah/jenis-pohon/create', verifyToken, allowRole('admin_wilayah'), JenisPohonController.create);
router.post('/admin-wilayah/jenis-pohon/update/:id', verifyToken, allowRole('admin_wilayah'), JenisPohonController.update);
router.post('/admin-wilayah/jenis-pohon/delete/:id', verifyToken, allowRole('admin_wilayah'), JenisPohonController.delete);

module.exports = router;