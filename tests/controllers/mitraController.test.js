'use strict';

jest.mock('../../models', () => ({
  Mitra: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  }
}));

const { Mitra } = require('../../models');

const MitraController = require('../../controllers/mitraController');

describe('MitraController', () => {

  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});

    req = {
      params: {},
      body: {},
      user: {
        id_user: 'USR0001',
        nama_lengkap: 'Petugas'
      }
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      send: jest.fn()
    };

  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ======================================
  // GET ALL
  // ======================================

  describe('getAll', () => {

    test('berhasil menampilkan data mitra', async () => {

      const mockData = [
        {
          id_mitra: 'MTR0001',
          nama_mitra: 'Mitra A'
        }
      ];

      Mitra.findAll.mockResolvedValue(
        mockData
      );

      await MitraController.getAll(
        req,
        res
      );

      expect(Mitra.findAll)
        .toHaveBeenCalledWith({
          order: [['createdAt', 'DESC']]
        });

      expect(res.render)
        .toHaveBeenCalledWith(
          'petugas-lapangan/mitra',
          {
            title: 'Data Mitra',
            data: mockData,
            user: req.user
          }
        );

    });

    test('handle error getAll', async () => {

      Mitra.findAll.mockRejectedValue(
        new Error('DB Error')
      );

      await MitraController.getAll(
        req,
        res
      );

      expect(res.send)
        .toHaveBeenCalledWith(
          'DB Error'
        );

    });

  });

  // ======================================
  // CREATE
  // ======================================

  describe('create', () => {

    test('berhasil create mitra pertama', async () => {

      req.body = {
        nama_mitra: 'Mitra A',
        lembaga: 'Lembaga A',
        kontak: '08123',
        no_rekening: '123456',
        bank: 'BRI',
        atas_nama_bank: 'Budi'
      };

      Mitra.findOne.mockResolvedValue(
        null
      );

      Mitra.create.mockResolvedValue(
        {}
      );

      await MitraController.create(
        req,
        res
      );

      expect(Mitra.create)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            id_mitra: 'MTR0001'
          })
        );

      expect(res.redirect)
        .toHaveBeenCalledWith(
          '/petugas-lapangan/mitra'
        );

    });

    test('berhasil create mitra berikutnya', async () => {

      req.body = {
        nama_mitra: 'Mitra B',
        lembaga: 'Lembaga B',
        kontak: '08124',
        no_rekening: '654321',
        bank: 'BNI',
        atas_nama_bank: 'Andi'
      };

      Mitra.findOne.mockResolvedValue({
        id_mitra: 'MTR0009'
      });

      Mitra.create.mockResolvedValue(
        {}
      );

      await MitraController.create(
        req,
        res
      );

      expect(Mitra.create)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            id_mitra: 'MTR0010'
          })
        );

    });

    test('handle error create', async () => {

      Mitra.findOne.mockRejectedValue(
        new Error('DB Error')
      );

      await MitraController.create(
        req,
        res
      );

      expect(res.send)
        .toHaveBeenCalledWith(
          'DB Error'
        );

    });

  });

  // ======================================
  // UPDATE
  // ======================================

  describe('update', () => {

    test('berhasil update mitra', async () => {

      req.params.id = 'MTR0001';

      req.body = {
        nama_mitra: 'Update',
        lembaga: 'Update',
        kontak: '08111',
        no_rekening: '11111',
        bank: 'BCA',
        atas_nama_bank: 'Update'
      };

      Mitra.update.mockResolvedValue(
        [1]
      );

      await MitraController.update(
        req,
        res
      );

      expect(Mitra.update)
        .toHaveBeenCalledWith(
          {
            nama_mitra: 'Update',
            lembaga: 'Update',
            kontak: '08111',
            no_rekening: '11111',
            bank: 'BCA',
            atas_nama_bank: 'Update'
          },
          {
            where: {
              id_mitra: 'MTR0001'
            }
          }
        );

      expect(res.redirect)
        .toHaveBeenCalledWith(
          '/petugas-lapangan/mitra'
        );

    });

    test('handle error update', async () => {

      req.params.id = 'MTR0001';

      Mitra.update.mockRejectedValue(
        new Error('DB Error')
      );

      await MitraController.update(
        req,
        res
      );

      expect(res.send)
        .toHaveBeenCalledWith(
          'DB Error'
        );

    });

  });

  // ======================================
  // DELETE
  // ======================================

  describe('delete', () => {

    test('berhasil hapus mitra', async () => {

      req.params.id = 'MTR0001';

      Mitra.destroy.mockResolvedValue(
        1
      );

      await MitraController.delete(
        req,
        res
      );

      expect(Mitra.destroy)
        .toHaveBeenCalledWith({
          where: {
            id_mitra: 'MTR0001'
          }
        });

      expect(res.redirect)
        .toHaveBeenCalledWith(
          '/petugas-lapangan/mitra'
        );

    });

    test('handle error delete', async () => {

      req.params.id = 'MTR0001';

      Mitra.destroy.mockRejectedValue(
        new Error('DB Error')
      );

      await MitraController.delete(
        req,
        res
      );

      expect(res.send)
        .toHaveBeenCalledWith(
          'DB Error'
        );

    });

  });

});