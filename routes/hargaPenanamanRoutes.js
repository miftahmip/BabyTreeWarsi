const router = require('express').Router();
const HargaPenanamanController = require('../controllers/hargaPenanamanController');
const {verifyToken, allowRole} = require('../middlewares/authMiddleware');


router.get(
  '/admin-wilayah/harga-penanaman/data/:id_penanaman',
  verifyToken,
  allowRole('admin_wilayah'),
  HargaPenanamanController.getDataHarga
);



router.post(
  '/admin-wilayah/harga-penanaman/upsert/:id_penanaman',
  verifyToken,
  allowRole('admin_wilayah'),
  HargaPenanamanController.upsertHarga
);


module.exports = router;