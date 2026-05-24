const router = require('express').Router();
const PenanamanController = require('../controllers/penanamanController');
const {verifyToken, allowRole} = require('../middlewares/authMiddleware');


router.get('/admin-wilayah/penanaman', verifyToken, allowRole('admin_wilayah'), PenanamanController.getAll);
router.post('/admin-wilayah/penanaman/create', verifyToken, allowRole('admin_wilayah'), PenanamanController.create);
router.post('/admin-wilayah/penanaman/delete/:id', verifyToken, allowRole('admin_wilayah'), PenanamanController.delete);
router.post('/admin-wilayah/penanaman/update/:id', verifyToken, allowRole('admin_wilayah'), PenanamanController.update);

// PETUGAS LAPANGAN
router.get('/petugas-lapangan/penanaman', verifyToken, allowRole('petugas_lapangan'), PenanamanController.getPetugasPenanaman);


module.exports = router;