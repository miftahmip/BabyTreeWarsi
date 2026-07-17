'use strict';

jest.mock('bcryptjs', () => ({
  hash: jest.fn()
}));

jest.mock('axios', () => ({
  get: jest.fn()
}));

jest.mock('../../models', () => ({
  User: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    count: jest.fn(),
    create: jest.fn()
  }
}));

const bcrypt = require('bcryptjs');
const axios = require('axios');

const { User } = require('../../models');

const UserManagementController =
  require('../../controllers/UserManagementController');

describe('UserManagementController', () => {

  let req;
  let res;

  beforeEach(() => {

    jest.clearAllMocks();

    req = {
      params: {},
      body: {},
      user: {
        id_user: 'USR0001',
        nama_lengkap: 'Admin'
      }
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      send: jest.fn()
    };

  });



  describe('index', () => {

    test('berhasil render halaman kelola akun', async () => {

      User.findAll.mockResolvedValue([
        { id_user: 'USR0002' }
      ]);

      axios.get.mockResolvedValue({
        data: {
          data: [
            {
              code: '13',
              name: 'Sumatera Barat'
            }
          ]
        }
      });

      await UserManagementController.index(req, res);

      expect(User.findAll).toHaveBeenCalled();

      expect(axios.get).toHaveBeenCalled();

      expect(res.render).toHaveBeenCalledWith(
        'admin-pusat/kelola-akun',
        expect.objectContaining({
          pageTitle: 'Kelola Akun',
          activePage: 'kelola-akun'
        })
      );
    });

    test('index menggunakan array kosong jika data provinsi tidak tersedia', async () => {

    User.findAll.mockResolvedValue([]);

    axios.get.mockResolvedValue({
        data: {}
    });

    await UserManagementController.index(req, res);

    expect(res.render).toHaveBeenCalledWith(
        'admin-pusat/kelola-akun',
        expect.objectContaining({
        provinces: []
        })
    );

    });

    test('handle error index', async () => {

      User.findAll.mockRejectedValue(
        new Error('DB Error')
      );

      await UserManagementController.index(req, res);

      expect(res.send)
        .toHaveBeenCalledWith('DB Error');
    });

  });



  describe('store', () => {

    test('field kosong', async () => {

      req.body = {};

      await UserManagementController.store(req, res);

      expect(res.send)
        .toHaveBeenCalledWith(
          'Semua field wajib diisi'
        );
    });

    test('role tidak valid', async () => {

      req.body = {
        nama_lengkap: 'Budi',
        email: 'budi@mail.com',
        no_telepon: '08123',
        password: '123456',
        role: 'admin'
      };

      await UserManagementController.store(req, res);

      expect(res.send)
        .toHaveBeenCalledWith(
          'Role tidak valid'
        );
    });

    test('admin wilayah tanpa provinsi', async () => {

      req.body = {
        nama_lengkap: 'Budi',
        email: 'budi@mail.com',
        no_telepon: '08123',
        password: '123456',
        role: 'admin_wilayah'
      };

      await UserManagementController.store(req, res);

      expect(res.send)
        .toHaveBeenCalledWith(
          'Provinsi wajib dipilih'
        );
    });

    test('email sudah digunakan', async () => {

      req.body = {
        nama_lengkap: 'Budi',
        email: 'budi@mail.com',
        no_telepon: '08123',
        password: '123456',
        role: 'pimpinan'
      };

      User.findOne.mockResolvedValue({
        id_user: 'USR0001'
      });

      await UserManagementController.store(req, res);

      expect(res.send)
        .toHaveBeenCalledWith(
          'Email sudah digunakan'
        );
    });

    test('berhasil tambah admin wilayah', async () => {

      req.body = {
        nama_lengkap: 'Budi',
        email: 'budi@mail.com',
        no_telepon: '08123',
        password: '123456',
        role: 'admin_wilayah',
        kode_provinsi: '13'
      };

      User.findOne.mockResolvedValue(null);

      User.count.mockResolvedValue(5);

      bcrypt.hash.mockResolvedValue(
        'hashed-password'
      );

      User.create.mockResolvedValue({});

      await UserManagementController.store(req, res);

      expect(User.create)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            id_user: 'USR0006',
            kode_provinsi: '13',
            status: 'aktif'
          })
        );

      expect(res.redirect)
        .toHaveBeenCalledWith(
          '/admin-pusat/kelola-akun'
        );
    });

    test('berhasil tambah pimpinan', async () => {

      req.body = {
        nama_lengkap: 'Budi',
        email: 'budi@mail.com',
        no_telepon: '08123',
        password: '123456',
        role: 'pimpinan'
      };

      User.findOne.mockResolvedValue(null);

      User.count.mockResolvedValue(1);

      bcrypt.hash.mockResolvedValue(
        'hashed-password'
      );

      User.create.mockResolvedValue({});

      await UserManagementController.store(req, res);

      expect(User.create)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            kode_provinsi: null
          })
        );
    });

    test('handle error store', async () => {

      req.body = {
        nama_lengkap: 'Budi',
        email: 'budi@mail.com',
        no_telepon: '08123',
        password: '123456',
        role: 'pimpinan'
      };

      User.findOne.mockRejectedValue(
        new Error('DB Error')
      );

      await UserManagementController.store(req, res);

      expect(res.send)
        .toHaveBeenCalledWith(
          'DB Error'
        );
    });

  });



  describe('update', () => {

    test('user tidak ditemukan', async () => {

      req.params.id = 'USR0001';

      User.findByPk.mockResolvedValue(null);

      await UserManagementController.update(req, res);

      expect(res.send)
        .toHaveBeenCalledWith(
          'User tidak ditemukan'
        );
    });

    test('role tidak valid', async () => {

      req.params.id = 'USR0001';

      User.findByPk.mockResolvedValue({});

      req.body = {
        role: 'admin'
      };

      await UserManagementController.update(req, res);

      expect(res.send)
        .toHaveBeenCalledWith(
          'Role tidak valid'
        );
    });

    test('berhasil update admin wilayah', async () => {

      const updateMock =
        jest.fn().mockResolvedValue(true);

      req.params.id = 'USR0001';

      req.body = {
        nama_lengkap: 'Budi',
        email: 'budi@mail.com',
        no_telepon: '08123',
        role: 'admin_wilayah',
        kode_provinsi: '13',
        status: 'aktif'
      };

      User.findByPk.mockResolvedValue({
        update: updateMock
      });

      await UserManagementController.update(req, res);

      expect(updateMock)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            kode_provinsi: '13'
          })
        );

      expect(res.redirect)
        .toHaveBeenCalledWith(
          '/admin-pusat/kelola-akun'
        );
    });

    test('berhasil update non admin wilayah', async () => {

      const updateMock =
        jest.fn().mockResolvedValue(true);

      req.params.id = 'USR0001';

      req.body = {
        nama_lengkap: 'Budi',
        email: 'budi@mail.com',
        no_telepon: '08123',
        role: 'pimpinan',
        status: 'aktif'
      };

      User.findByPk.mockResolvedValue({
        update: updateMock
      });

      await UserManagementController.update(req, res);

      expect(updateMock)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            kode_provinsi: null
          })
        );
    });

    test('handle error update', async () => {

      User.findByPk.mockRejectedValue(
        new Error('DB Error')
      );

      await UserManagementController.update(req, res);

      expect(res.send)
        .toHaveBeenCalledWith(
          'DB Error'
        );
    });

  });



  describe('destroy', () => {

    test('user tidak ditemukan', async () => {

      req.params.id = 'USR0001';

      User.findByPk.mockResolvedValue(null);

      await UserManagementController.destroy(req, res);

      expect(res.send)
        .toHaveBeenCalledWith(
          'User tidak ditemukan'
        );
    });

    test('berhasil hapus user', async () => {

      const destroyMock =
        jest.fn().mockResolvedValue(true);

      req.params.id = 'USR0001';

      User.findByPk.mockResolvedValue({
        destroy: destroyMock
      });

      await UserManagementController.destroy(req, res);

      expect(destroyMock)
        .toHaveBeenCalled();

      expect(res.redirect)
        .toHaveBeenCalledWith(
          '/admin-pusat/kelola-akun'
        );
    });

    test('handle error destroy', async () => {

      User.findByPk.mockRejectedValue(
        new Error('DB Error')
      );

      await UserManagementController.destroy(req, res);

      expect(res.send)
        .toHaveBeenCalledWith(
          'DB Error'
        );
    });

  });

});