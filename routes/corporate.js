const router = require('express').Router();
const CorporateController = require('../controllers/corporateController');
const {verifyToken, allowRole} = require('../middlewares/authMiddleware');

router.get(
  '/corporate/donasi-saya',
  verifyToken,
  allowRole('donatur_corporate'),
  CorporateController.donasiSaya
);

router.get(
  '/corporate/dashboard-program/:id',
  verifyToken,
  allowRole('donatur_corporate'),
  CorporateController.dashboardProgram
);

router.get(
  '/corporate/export-csr/:id',
  verifyToken,
  allowRole('donatur_corporate'),
  CorporateController.exportCSR
);


module.exports = router;