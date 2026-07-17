'use strict';

const mockSendMail = jest.fn().mockResolvedValue(true);

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail
  }))
}));

jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn()
  },
  PasswordReset: {
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  }
}));

jest.mock('crypto');
jest.mock('bcryptjs');

jest.mock('sequelize', () => ({
  Op: {
    gt: Symbol('gt')
  }
}));

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const {
  User,
  PasswordReset
} = require('../../models');

const ForgotPasswordController =
  require('../../controllers/ForgotPasswordController');


describe('ForgotPasswordController', () => {

  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    req = {
      body: {},
      query: {}
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ======================================================
  // forgotPasswordPage
  // ======================================================
  describe('forgotPasswordPage', () => {

    test('render halaman forgot password', async () => {
      req.query = {
        success: 'ok',
        error: 'no'
      };

      await ForgotPasswordController.forgotPasswordPage(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'forgot-password',
        expect.objectContaining({
          title: 'Lupa Password',
          success: 'ok',
          error: 'no'
        })
      );
    });

    test('handle error internal server', async () => {
      const fakeRes = {
        render: jest.fn(() => {
          throw new Error('fail');
        }),
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      await ForgotPasswordController.forgotPasswordPage(req, fakeRes);

      expect(fakeRes.status).toHaveBeenCalledWith(500);
    });

  });

  // ======================================================
  // sendResetEmail
  // ======================================================
  describe('sendResetEmail', () => {

    test('email kosong → redirect error', async () => {
      req.body = {
        email: ''
      };

      await ForgotPasswordController.sendResetEmail(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        '/forgot-password?error=Email+harus+diisi'
      );
    });

    test('email tidak ditemukan → tetap success message', async () => {
      req.body = {
        email: 'test@mail.com'
      };

      User.findOne.mockResolvedValue(null);

      await ForgotPasswordController.sendResetEmail(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        '/forgot-password?success=Jika+email+terdaftar,+link+reset+telah+dikirim'
      );
    });

    test('email valid → create token & send email', async () => {
      req.body = {
        email: 'user@mail.com'
      };

      User.findOne.mockResolvedValue({
        id_user: 1,
        email: 'user@mail.com',
        nama_lengkap: 'Budi'
      });

      PasswordReset.destroy.mockResolvedValue(true);
      PasswordReset.create.mockResolvedValue(true);

      crypto.randomBytes.mockReturnValue({
        toString: () => 'abc123token'
      });

      process.env.BASE_URL = 'http://localhost';

      await ForgotPasswordController.sendResetEmail(req, res);

      expect(PasswordReset.destroy).toHaveBeenCalled();
      expect(PasswordReset.create).toHaveBeenCalled();
      expect(mockSendMail).toHaveBeenCalled();

      expect(res.redirect).toHaveBeenCalledWith(
        '/forgot-password?success=Link+reset+password+telah+dikirim+ke+email+Anda'
      );
    });

    test('error handling sendResetEmail', async () => {
      req.body = {
        email: 'user@mail.com'
      };

      User.findOne.mockRejectedValue(
        new Error('DB error')
      );

      await ForgotPasswordController.sendResetEmail(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('error=')
      );
    });

  });

  // ======================================================
  // resetPasswordPage
  // ======================================================
  describe('resetPasswordPage', () => {

    test('tanpa token → redirect error', async () => {
      req.query = {};

      await ForgotPasswordController.resetPasswordPage(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        '/forgot-password?error=Token+tidak+valid'
      );
    });

    test('token tidak valid → redirect expired', async () => {
      req.query = {
        token: 'abc'
      };

      PasswordReset.findOne.mockResolvedValue(null);

      await ForgotPasswordController.resetPasswordPage(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        '/forgot-password?error=Link+reset+tidak+valid+atau+sudah+kadaluarsa'
      );
    });

    test('token valid → render reset password', async () => {
      req.query = {
        token: 'abc'
      };

      PasswordReset.findOne.mockResolvedValue({
        token: 'abc'
      });

      await ForgotPasswordController.resetPasswordPage(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'reset-password',
        expect.objectContaining({
          title: 'Reset Password',
          token: 'abc'
        })
      );
    });

    test('resetPasswordPage handle error', async () => {

    req.query = {
        token: 'abc'
    };

    PasswordReset.findOne.mockRejectedValue(
        new Error('DB Error')
    );

    await ForgotPasswordController.resetPasswordPage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('DB Error');
    });

  });

  // ======================================================
  // processResetPassword
  // ======================================================
  describe('processResetPassword', () => {

    test('tanpa token → redirect error', async () => {
      req.body = {};

      await ForgotPasswordController.processResetPassword(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        '/forgot-password?error=Token+tidak+valid'
      );
    });

    test('password kurang dari 6 karakter', async () => {
      req.body = {
        token: 'abc',
        password_baru: '123',
        konfirmasi_password: '123'
      };

      await ForgotPasswordController.processResetPassword(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        '/reset-password?token=abc&error=Password+minimal+6+karakter'
      );
    });

    test('password tidak cocok', async () => {
      req.body = {
        token: 'abc',
        password_baru: '123456',
        konfirmasi_password: '999999'
      };

      await ForgotPasswordController.processResetPassword(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        '/reset-password?token=abc&error=Konfirmasi+password+tidak+cocok'
      );
    });

    test('token valid → reset password sukses', async () => {
      req.body = {
        token: 'abc',
        password_baru: '123456',
        konfirmasi_password: '123456'
      };

      const userUpdate = jest.fn().mockResolvedValue(true);
      const recordUpdate = jest.fn().mockResolvedValue(true);

      PasswordReset.findOne.mockResolvedValue({
        user: {
          update: userUpdate
        },
        update: recordUpdate
      });

      bcrypt.hash.mockResolvedValue('hashedpass');

      await ForgotPasswordController.processResetPassword(req, res);

      expect(userUpdate).toHaveBeenCalled();
      expect(recordUpdate).toHaveBeenCalled();

      expect(res.redirect).toHaveBeenCalledWith(
        '/login?success=Password+berhasil+direset,+silakan+login'
      );
    });

    test('password kosong', async () => {

    req.body = {
        token: 'abc',
        password_baru: '',
        konfirmasi_password: ''
    };

    await ForgotPasswordController.processResetPassword(req, res);

    expect(res.redirect).toHaveBeenCalledWith(
        '/reset-password?token=abc&error=Password+minimal+6+karakter'
    );
    });

    test('token tidak valid → redirect error', async () => {
      req.body = {
        token: 'abc',
        password_baru: '123456',
        konfirmasi_password: '123456'
      };

      PasswordReset.findOne.mockResolvedValue(null);

      await ForgotPasswordController.processResetPassword(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        '/forgot-password?error=Link+reset+tidak+valid+atau+sudah+kadaluarsa'
      );
    });

    test('error handling process reset', async () => {
      req.body = {
        token: 'abc',
        password_baru: '123456',
        konfirmasi_password: '123456'
      };

      PasswordReset.findOne.mockRejectedValue(
        new Error('DB down')
      );

      await ForgotPasswordController.processResetPassword(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('error=')
      );
    });

  });

});