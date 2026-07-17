'use strict';

jest.mock('../../models', () => ({
  JenisPohon: {
    findAll: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  }
}));

const { JenisPohon } = require('../../models');

const JenisPohonController =
  require('../../controllers/jenisPohonController');

describe('JenisPohonController', () => {

  let req;
  let res;

  beforeEach(() => {

    jest.clearAllMocks();

    jest.spyOn(console, 'log')
      .mockImplementation(() => {});

    req = {
      params: {},
      body: {},
      user: {
        id_user: 'USR0001',
        nama_lengkap: 'Admin Wilayah'
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

  // =========================
  // GET ALL
  // =========================

  describe('getAll', () => {

    test('berhasil menampilkan data jenis pohon', async () => {

      const mockData = [
        {
          id_jenis_pohon: 'JNS0001',
          nama_pohon: 'Mangrove'
        }
      ];

      JenisPohon.findAll
        .mockResolvedValue(mockData);

      await JenisPohonController.getAll(
        req,
        res
      );

      expect(
        JenisPohon.findAll
      ).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']]
      });

      expect(
        res.render
      ).toHaveBeenCalledWith(
        'admin-wilayah/jenis-pohon',
        {
          title: 'Data Jenis Pohon',
          activePage: 'jenis-pohon',
          data: mockData,
          user: req.user
        }
      );

    });

    test('handle error getAll', async () => {

      JenisPohon.findAll
        .mockRejectedValue(
          new Error('DB Error')
        );

      await JenisPohonController.getAll(
        req,
        res
      );

      expect(
        res.send
      ).toHaveBeenCalledWith(
        'DB Error'
      );

    });

  });

  // =========================
  // CREATE
  // =========================

  describe('create', () => {

    test('berhasil menambah jenis pohon', async () => {

      req.body = {
        nama_pohon: 'Mangrove',
        nama_latin: 'Rhizophora'
      };

      JenisPohon.count
        .mockResolvedValue(5);

      JenisPohon.create
        .mockResolvedValue({});

      await JenisPohonController.create(
        req,
        res
      );

      expect(
        JenisPohon.count
      ).toHaveBeenCalled();

      expect(
        JenisPohon.create
      ).toHaveBeenCalledWith({
        id_jenis_pohon: 'JNS0006',
        nama_pohon: 'Mangrove',
        nama_latin: 'Rhizophora'
      });

      expect(
        res.redirect
      ).toHaveBeenCalledWith(
        '/admin-wilayah/jenis-pohon'
      );

    });

    test('handle error create', async () => {

      req.body = {
        nama_pohon: 'Mangrove',
        nama_latin: 'Rhizophora'
      };

      JenisPohon.count
        .mockRejectedValue(
          new Error('DB Error')
        );

      await JenisPohonController.create(
        req,
        res
      );

      expect(
        res.send
      ).toHaveBeenCalledWith(
        'DB Error'
      );

    });

  });

  // =========================
  // UPDATE
  // =========================

  describe('update', () => {

    test('berhasil update jenis pohon', async () => {

      req.params.id = 'JNS0001';

      req.body = {
        nama_pohon: 'Mangrove Update',
        nama_latin: 'Rhizophora Update'
      };

      JenisPohon.update
        .mockResolvedValue([1]);

      await JenisPohonController.update(
        req,
        res
      );

      expect(
        JenisPohon.update
      ).toHaveBeenCalledWith(
        {
          nama_pohon: 'Mangrove Update',
          nama_latin: 'Rhizophora Update'
        },
        {
          where: {
            id_jenis_pohon: 'JNS0001'
          }
        }
      );

      expect(
        res.redirect
      ).toHaveBeenCalledWith(
        '/admin-wilayah/jenis-pohon'
      );

    });

    test('handle error update', async () => {

      req.params.id = 'JNS0001';

      JenisPohon.update
        .mockRejectedValue(
          new Error('DB Error')
        );

      await JenisPohonController.update(
        req,
        res
      );

      expect(
        res.send
      ).toHaveBeenCalledWith(
        'DB Error'
      );

    });

  });

  // =========================
  // DELETE
  // =========================

  describe('delete', () => {

    test('berhasil hapus jenis pohon', async () => {

      req.params.id = 'JNS0001';

      JenisPohon.destroy
        .mockResolvedValue(1);

      await JenisPohonController.delete(
        req,
        res
      );

      expect(
        JenisPohon.destroy
      ).toHaveBeenCalledWith({
        where: {
          id_jenis_pohon: 'JNS0001'
        }
      });

      expect(
        res.redirect
      ).toHaveBeenCalledWith(
        '/admin-wilayah/jenis-pohon'
      );

    });

    test('handle error delete', async () => {

      req.params.id = 'JNS0001';

      JenisPohon.destroy
        .mockRejectedValue(
          new Error('DB Error')
        );

      await JenisPohonController.delete(
        req,
        res
      );

      expect(
        res.send
      ).toHaveBeenCalledWith(
        'DB Error'
      );

    });

  });

});