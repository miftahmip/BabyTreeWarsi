const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

class AuthController {

    static loginPage(req, res) {
        const { email, returnUrl } = req.query;
        res.render('login', { formEmail: email || '', returnUrl: returnUrl || '' });
    }

    static registerPage(req, res) {
        const { email, nama, returnUrl } = req.query;
        res.render('register', { formEmail: email || '', formNama: nama || '', returnUrl: returnUrl || '' });
    }

    static async register(req, res) {
        try {
            const { role, nama_lengkap, email, no_telepon, password, konfirmasi_password, returnUrl } = req.body;

            if (!role || !['donatur_umum', 'donatur_corporate'].includes(role)) {
                return res.send('Role tidak valid');
            }

            if (!nama_lengkap || !email || !no_telepon || !password || !konfirmasi_password) {
                return res.send('Semua field wajib diisi');
            }

            if (password !== konfirmasi_password) return res.send('Konfirmasi password tidak sesuai');
            if (password.length < 8) return res.send('Password minimal 8 karakter');

            const checkEmail = await User.findOne({ where: { email } });
            if (checkEmail) return res.send('Email sudah terdaftar');

            const totalUser = await User.count();
            const id_user = 'USR' + String(totalUser + 1).padStart(4, '0');
            const hashPassword = await bcrypt.hash(password, 10);

            await User.create({
                id_user, nama_lengkap, email, no_telepon,
                password: hashPassword, role, status: 'aktif'
            });

            if (returnUrl) {
                return res.redirect(`/login?email=${encodeURIComponent(email)}&returnUrl=${encodeURIComponent(returnUrl)}`);
            }

            return res.redirect('/');

        } catch (error) {
            console.log(JSON.stringify(error, null, 2));
            return res.send(error.message);
        }
    }

    static async login(req, res) {
        const { email, password, returnUrl } = req.body;

        try {
            const user = await User.findOne({ where: { email } });

            if (!user) {
                return res.render('login', { error: 'Email tidak terdaftar. Periksa kembali email Anda.', formEmail: email, returnUrl: returnUrl || '' });
            }

            if (user.status !== 'aktif') {
                return res.render('login', { error: 'Akun Anda dinonaktifkan. Hubungi Admin untuk informasi lebih lanjut.', formEmail: email, returnUrl: returnUrl || '' });
            }

            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.render('login', { error: 'Password salah. Silakan coba lagi.', formEmail: email, returnUrl: returnUrl || '' });
            }

            const payload = { id_user: user.id_user, nama_lengkap: user.nama_lengkap, role: user.role };
            if (user.role === 'admin_wilayah') payload.kode_provinsi = user.kode_provinsi;

            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES });
            res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 });

            if (returnUrl && ['donatur_umum', 'donatur_corporate'].includes(user.role)) {
                return res.redirect(returnUrl);
            }

            switch (user.role) {
                case 'admin_pusat':       return res.redirect('/admin-pusat/dashboard');
                case 'admin_wilayah':     return res.redirect('/admin-wilayah/dashboard');
                case 'petugas_lapangan':  return res.redirect('/petugas-lapangan/dashboard');
                case 'donatur_umum':      return res.redirect('/donatur/donasi-saya');
                case 'donatur_corporate': return res.redirect('/corporate/donasi-saya');
                case 'pimpinan':          return res.redirect('/pimpinan/dashboard');
                default:                  return res.send('Role tidak valid');
            }

        } catch (error) {
            return res.render('login', {
                error: 'Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.',
                formEmail: email ?? '', returnUrl: returnUrl || ''
            });
        }
    }

    static logout(req, res) {
        res.clearCookie('token');
        return res.redirect('/login');
    }
}

module.exports = AuthController;