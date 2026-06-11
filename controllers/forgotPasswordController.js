'use strict';

const { User, PasswordReset } = require('../models');
const nodemailer = require('nodemailer');
const crypto     = require('crypto');
const bcrypt     = require('bcryptjs');
const { Op }     = require('sequelize');

// ── Konfigurasi nodemailer ────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

class ForgotPasswordController {

  // ── HALAMAN FORGOT PASSWORD ───────────────────
  static async forgotPasswordPage(req, res) {
    try {
      return res.render('forgot-password', {
        title:   'Lupa Password',
        success: req.query.success || null,
        error:   req.query.error   || null,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send(error.message);
    }
  }

  // ── PROSES KIRIM EMAIL RESET ──────────────────
  static async sendResetEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email || !email.trim()) {
        return res.redirect('/forgot-password?error=Email+harus+diisi');
      }

      const user = await User.findOne({
        where: { email: email.trim() }
      });

      // Respons sama meski email tidak ditemukan
      // (hindari user enumeration attack)
      if (!user) {
        return res.redirect(
          '/forgot-password?success=Jika+email+terdaftar,+link+reset+telah+dikirim'
        );
      }

      // Hapus token lama milik user ini (jika ada)
      await PasswordReset.destroy({
        where: { id_user: user.id_user }
      });

      // Generate token unik
      const token  = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

      await PasswordReset.create({
        id_user: user.id_user,
        token,
        expiry,
        used: false,
      });

      // URL reset
      const resetUrl = `${process.env.BASE_URL}/reset-password?token=${token}`;

      // Kirim email
      await transporter.sendMail({
        from:    process.env.MAIL_FROM,
        to:      user.email,
        subject: 'Reset Password - BabyTreeWarsi',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #f0faf4; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #1a4731; margin: 0;">🌱 BabyTreeWarsi</h2>
            </div>
            <div style="background: #fff; border-radius: 10px; padding: 28px 24px;">
              <h3 style="color: #1a4731; margin-top: 0;">Reset Password</h3>
              <p style="color: #444; line-height: 1.6;">
                Halo <strong>${user.nama_lengkap}</strong>,<br><br>
                Kami menerima permintaan reset password untuk akun Anda.
                Klik tombol di bawah untuk membuat password baru.
              </p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${resetUrl}"
                   style="background: #2d6a4f; color: #fff; padding: 12px 32px;
                          border-radius: 8px; text-decoration: none; font-weight: 600;
                          font-size: 15px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="color: #888; font-size: 13px; line-height: 1.6;">
                Link ini hanya berlaku selama <strong>1 jam</strong>.<br>
                Jika Anda tidak merasa meminta reset password, abaikan email ini.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #aaa; font-size: 12px; margin: 0;">
                Atau salin link berikut ke browser Anda:<br>
                <a href="${resetUrl}" style="color: #40916c; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
          </div>
        `,
      });

      return res.redirect(
        '/forgot-password?success=Link+reset+password+telah+dikirim+ke+email+Anda'
      );

    } catch (error) {
      console.log(error);
      return res.redirect(
        '/forgot-password?error=' + encodeURIComponent(error.message)
      );
    }
  }

  // ── HALAMAN RESET PASSWORD ────────────────────
  static async resetPasswordPage(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.redirect('/forgot-password?error=Token+tidak+valid');
      }

      // Cek token valid, belum expired, belum dipakai
      const record = await PasswordReset.findOne({
        where: {
          token,
          used:   false,
          expiry: { [Op.gt]: new Date() },
        },
      });

      if (!record) {
        return res.redirect(
          '/forgot-password?error=Link+reset+tidak+valid+atau+sudah+kadaluarsa'
        );
      }

      return res.render('reset-password', {
        title: 'Reset Password',
        token,
        error: req.query.error || null,
      });

    } catch (error) {
      console.log(error);
      return res.status(500).send(error.message);
    }
  }

  // ── PROSES RESET PASSWORD ─────────────────────
  static async processResetPassword(req, res) {
    try {
      const { token, password_baru, konfirmasi_password } = req.body;

      if (!token) {
        return res.redirect('/forgot-password?error=Token+tidak+valid');
      }

      // Validasi input
      if (!password_baru || password_baru.length < 6) {
        return res.redirect(
          `/reset-password?token=${token}&error=Password+minimal+6+karakter`
        );
      }

      if (password_baru !== konfirmasi_password) {
        return res.redirect(
          `/reset-password?token=${token}&error=Konfirmasi+password+tidak+cocok`
        );
      }

      // Cek token
      const record = await PasswordReset.findOne({
        where: {
          token,
          used:   false,
          expiry: { [Op.gt]: new Date() },
        },
        include: [{ model: User, as: 'user' }],
      });

      if (!record) {
        return res.redirect(
          '/forgot-password?error=Link+reset+tidak+valid+atau+sudah+kadaluarsa'
        );
      }

      // Update password user
      const hashedPassword = await bcrypt.hash(password_baru, 10);

      await record.user.update({ password: hashedPassword });

      // Tandai token sudah dipakai
      await record.update({ used: true });

      return res.redirect('/login?success=Password+berhasil+direset,+silakan+login');

    } catch (error) {
      console.log(error);
      return res.redirect(
        '/forgot-password?error=' + encodeURIComponent(error.message)
      );
    }
  }

}

module.exports = ForgotPasswordController;