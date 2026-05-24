const router = require('express').Router();
const MonitoringController = require('../controllers/monitoringController');
const upload = require('../middlewares/uploadMonitoringMiddleware');
const {verifyToken, allowRole} = require('../middlewares/authMiddleware');


router.post(
  '/petugas-lapangan/monitoring/create',
  verifyToken,
  allowRole('petugas_lapangan'),
  upload.array('foto_monitoring',10),

  MonitoringController.create
);


// =====================================
// UPDATE MONITORING
// =====================================

router.post(
  '/petugas-lapangan/monitoring/update/:id_monitoring/:id_pohon',
  verifyToken,
  allowRole('petugas_lapangan'),
  upload.array('foto_monitoring',10),

  MonitoringController.update
);

module.exports = router;