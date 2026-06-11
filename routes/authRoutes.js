const express = require('express');
const router = express.Router();

const auth = require('../controllers/authController');
const { verifyToken, allowRole } = require('../middlewares/authMiddleware');

router.get('/login', auth.loginPage);
router.post('/login', auth.login);
router.get('/register', auth.registerPage);
router.post('/register', auth.register);
router.get('/logout', auth.logout);


module.exports = router;