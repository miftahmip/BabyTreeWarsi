const express = require('express');
const router = express.Router();

const auth = require('../controllers/authController');
const {verifyToken,allowRole} = require('../middlewares/authMiddleware');

router.get('/login', auth.loginPage);
router.post('/login', auth.login);
router.get('/register', auth.registerPage);
router.post('/register', auth.register);
router.get('/logout', auth.logout);

/* Dashboard */

router.get('/dashboard/admin-pusat',
verifyToken,
  allowRole('admin_pusat'),
  (req, res) => {
      res.render('dashboard/admin-pusat', {
          pageTitle: 'Dashboard Admin Pusat',
          activePage: 'dashboard',
          user: req.user
      });
  }
);

router.get(
    '/dashboard/admin-wilayah',
    verifyToken,
    allowRole('admin_wilayah'),
    (req, res) => {
      res.render('dashboard/admin-wilayah', {
          pageTitle: 'Dashboard Admin Wilayah',
          activePage: 'dashboard',
          user: req.user
      });
    }
);

router.get(
    '/dashboard/petugas',
    verifyToken,
    allowRole('petugas_lapangan'),
    (req, res) => {
        res.render('dashboard/petugas', {
            pageTitle: 'Dashboard Petugas',
            activePage: 'dashboard',
            user: req.user
        });
    }
);

router.get(
    '/dashboard/donatur',
    verifyToken,
    allowRole('donatur_umum'),
    (req, res) => {
        res.send('Dashboard Donatur Umum');
    }
);

router.get(
    '/dashboard/corporate',
    verifyToken,
    allowRole('donatur_corporate'),
    (req, res) => {
        res.send('Dashboard Corporate');
    }
);

router.get(
    '/dashboard/pimpinan',
    verifyToken,
    allowRole('pimpinan'),
    (req, res) => {
        res.send('Dashboard Pimpinan');
    }
);

module.exports = router;