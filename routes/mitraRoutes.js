const router = require('express').Router();

const MitraController = require('../controllers/mitraController');
const {verifyToken, allowRole} = require('../middlewares/authMiddleware');


router.get('/petugas-lapangan/mitra', verifyToken, allowRole('petugas_lapangan'), MitraController.getAll);
router.post('/petugas-lapangan/mitra/create', verifyToken, allowRole('petugas_lapangan'), MitraController.create);
router.post('/petugas-lapangan/mitra/update/:id', verifyToken, allowRole('petugas_lapangan'), MitraController.update);
router.post('/petugas-lapangan/mitra/delete/:id', verifyToken, allowRole('petugas_lapangan'), MitraController.delete);


module.exports = router;