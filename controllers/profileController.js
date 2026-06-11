'use strict';

const { User } = require('../models');
const WilayahService = require('../services/wilayahService');
const bcrypt = require('bcryptjs');

class ProfileController {

  static async getProfile(req, res) {

    try {

      const id_user = req.user.id_user;

      const user = await User.findByPk(id_user, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).send('User tidak ditemukan');
      }

      // Mapping nama provinsi khusus admin_wilayah
      let nama_provinsi = null;

      if (user.role === 'admin_wilayah' && user.kode_provinsi) {

        const provinces = await WilayahService.getProvinces();
        const provinsi  = provinces.find(p => p.code === user.kode_provinsi);
        nama_provinsi   = provinsi ? provinsi.name : '-';

      }

      return res.render('profile/index', {
        title:        'Profil Saya',
        activePage:   'profile',
        user,
        nama_provinsi,
        success:      req.query.success || null,
        error:        req.query.error   || null,
      });

    } catch (error) {

      console.log(error);
      return res.status(500).send(error.message);

    }

  }

  static async updateProfile(req, res) {

    try {

      const id_user = req.user.id_user;

      const {
        nama_lengkap,
        no_telepon,
        email,
        password_lama,
        password_baru,
        konfirmasi_password,
      } = req.body;

      const user = await User.findByPk(id_user);

      if (!user) {
        return res.redirect('/profile?error=User+tidak+ditemukan');
      }

      // ── Validasi email unik (kecuali milik sendiri) ──
      if (email && email !== user.email) {

        const emailExist = await User.findOne({
          where: { email }
        });

        if (emailExist) {
          return res.redirect('/profile?error=Email+sudah+digunakan+oleh+akun+lain');
        }

      }

      // ── Update data dasar ────────────────────────────
      const updateData = {};

      if (nama_lengkap && nama_lengkap.trim())
        updateData.nama_lengkap = nama_lengkap.trim();

      if (no_telepon && no_telepon.trim())
        updateData.no_telepon = no_telepon.trim();

      if (email && email.trim())
        updateData.email = email.trim();

      // ── Ganti password (opsional) ────────────────────
      const inginGantiPassword =
        password_lama || password_baru || konfirmasi_password;

      if (inginGantiPassword) {

        if (!password_lama) {
          return res.redirect('/profile?error=Password+lama+harus+diisi');
        }

        const passwordValid = await bcrypt.compare(password_lama, user.password);

        if (!passwordValid) {
          return res.redirect('/profile?error=Password+lama+tidak+sesuai');
        }

        if (!password_baru || password_baru.length < 6) {
          return res.redirect('/profile?error=Password+baru+minimal+6+karakter');
        }

        if (password_baru !== konfirmasi_password) {
          return res.redirect('/profile?error=Konfirmasi+password+tidak+cocok');
        }

        updateData.password = await bcrypt.hash(password_baru, 10);

      }

      await user.update(updateData);

      return res.redirect('/profile?success=Profil+berhasil+diperbarui');

    } catch (error) {

      console.log(error);
      return res.redirect('/profile?error=' + encodeURIComponent(error.message));

    }

  }

}

module.exports = ProfileController;