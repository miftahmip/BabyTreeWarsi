const MonitoringController = require('../../controllers/monitoringController');
const {
  Monitoring,
  DetailMonitoring,
  Pohon
} = require('../../models');

const { deleteFile } = require('../../utils/fileHelper');

jest.mock('../../models', () => ({
  Monitoring: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  },
  DetailMonitoring: {
    findOne: jest.fn(),
    create: jest.fn()
  },
  Pohon: {
    findByPk: jest.fn()
  }
}));

jest.mock('../../utils/fileHelper', () => ({
  deleteFile: jest.fn()
}));

describe('MonitoringController', () => {

  let req;
  let res;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    req = {
      body: {},
      params: {},
      files: []
    };

    res = {
      send: jest.fn(),
      redirect: jest.fn()
    };

    jest.clearAllMocks();

  });

  // =========================================
  // CREATE
  // =========================================

  describe('create', () => {

    test('harus menampilkan pesan jika foto tidak diupload', async () => {

      await MonitoringController.create(req, res);

      expect(res.send).toHaveBeenCalledWith(
        'Foto monitoring wajib diupload'
      );

    });

    test('harus menampilkan pesan jika pohon tidak ditemukan', async () => {

      req.files = [
        { filename: 'foto1.jpg' }
      ];

      req.body = {
        id_pohon: 'PH001'
      };

      Pohon.findByPk.mockResolvedValue(null);

      await MonitoringController.create(req, res);

      expect(res.send).toHaveBeenCalledWith(
        'Data pohon tidak ditemukan'
      );

    });

    test('harus menolak jika pohon sudah mati', async () => {

      req.files = [{ filename: 'foto1.jpg' }];
      req.body = { id_pohon: 'PH001' };

      Pohon.findByPk.mockResolvedValue({ id_pohon: 'PH001' });
      DetailMonitoring.findOne.mockResolvedValue({
        monitoring: { tahap_monitoring: 2 }
      });

      await MonitoringController.create(req, res);
      expect(res.send).toHaveBeenCalledWith(
        'Pohon sudah mati pada monitoring ke-2'
      );

    });

    test('harus menolak jika monitoring tahap yang sama sudah ada', async () => {
      req.files = [{ filename: 'foto1.jpg' }];
      req.body = { id_pohon: 'PH001', tahap_monitoring: 1 };
      Pohon.findByPk.mockResolvedValue({ id_pohon: 'PH001' });

      DetailMonitoring.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id_monitoring: 'MON001' });     
      Monitoring.findOne.mockResolvedValue({ id_monitoring: 'MON001' });

      await MonitoringController.create(req, res);
      expect(res.send).toHaveBeenCalledWith( 'Monitoring tahap 1 sudah ada' );
    });

    test('harus berhasil menambah monitoring', async () => {
      req.files = [{ filename: 'foto1.jpg' }];
      req.body = {
        id_pohon: 'PH001',
        tahap_monitoring: 1,
        tgl_monitoring: '2026-01-01',
        tinggi_pohon: 100,
        diameter_pohon: 5,
        kesehatan_batang: 'baik',
        deskripsi: 'Monitoring pertama',
        status: 'hidup'
      };

      Pohon.findByPk.mockResolvedValue({ id_pohon: 'PH001' });
      DetailMonitoring.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      Monitoring.findOne.mockResolvedValue({ id_monitoring: 'MON001' });
      DetailMonitoring.create.mockResolvedValue({});

      await MonitoringController.create(req, res);
      expect(DetailMonitoring.create).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/petugas-lapangan/pohon/detail/PH001');
    });

    test('harus membuat master monitoring baru jika belum ada', async () => {
      req.files = [{ filename: 'foto1.jpg' }];
      req.body = {
        id_pohon: 'PH001',
        tahap_monitoring: 1,
        tgl_monitoring: '2026-01-01',
        status: 'hidup'
      };
      Pohon.findByPk.mockResolvedValue({ id_pohon: 'PH001' });
      DetailMonitoring.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      Monitoring.findOne.mockResolvedValue(null);
      Monitoring.create.mockResolvedValue({ id_monitoring: 'MON001' });

      await MonitoringController.create(req, res);
      expect(Monitoring.create).toHaveBeenCalledWith({
        id_monitoring: 'MON001',
        tahap_monitoring: 1,
        tgl_monitoring: '2026-01-01'
      });
    });

    test('harus membuat monitoring lanjutan jika status mati', async () => {
      req.files = [{ filename: 'foto1.jpg' }];
      req.body = {
        id_pohon: 'PH001',
        tahap_monitoring: 1,
        tgl_monitoring: '2026-01-01',
        status: 'mati'
      };
      Pohon.findByPk.mockResolvedValue({id_pohon: 'PH001'});
      DetailMonitoring.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValue(null);
      Monitoring.findOne.mockResolvedValue({ id_monitoring: 'MON001' });
      DetailMonitoring.create.mockResolvedValue({});

      await MonitoringController.create(req, res);
      expect(DetailMonitoring.create).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalled();
    });

    test('harus membuat monitoring berikutnya jika status mati dan monitoring berikutnya belum ada', async () => {

      req.files = [
        { filename: 'foto1.jpg' }
      ];

      req.body = {
        id_pohon: 'PH001',
        tahap_monitoring: 1,
        tgl_monitoring: '2026-01-01',
        status: 'mati'
      };

      Pohon.findByPk.mockResolvedValue({
        id_pohon: 'PH001'
      });

      DetailMonitoring.findOne.mockResolvedValue(null);

      Monitoring.findOne
        .mockResolvedValueOnce({
          id_monitoring: 'MON001'
        })
        .mockResolvedValue(null);

      Monitoring.create.mockResolvedValue({
        id_monitoring: 'MON002'
      });

      await MonitoringController.create(req, res);

      expect(Monitoring.create).toHaveBeenCalled();

    });

    test('tidak membuat detail monitoring lanjutan jika sudah ada', async () => {

      req.files = [
        { filename: 'foto1.jpg' }
      ];

      req.body = {
        id_pohon: 'PH001',
        tahap_monitoring: 1,
        tgl_monitoring: '2026-01-01',
        status: 'mati'
      };

      Pohon.findByPk.mockResolvedValue({
        id_pohon: 'PH001'
      });

      Monitoring.findOne.mockResolvedValue({
        id_monitoring: 'MON001'
      });

      DetailMonitoring.findOne
        .mockResolvedValueOnce(null) // monitoringMati
        .mockResolvedValueOnce(null) // detailExist
        .mockResolvedValue({
          id_detail_monitoring: 1 // detailNext sudah ada
        });

      await MonitoringController.create(req, res);

      expect(DetailMonitoring.create).toHaveBeenCalledTimes(1);
    });

    test('harus masuk ke catch error pada create', async () => {
      req.files = [{ filename: 'foto1.jpg' }];
      req.body = { id_pohon: 'PH001' };
      Pohon.findByPk.mockRejectedValue(new Error('Database Error'));

      await MonitoringController.create(req, res);
      expect(res.send).toHaveBeenCalledWith('Database Error');
    });

  });

  // =========================================
  // UPDATE
  // =========================================

  describe('update', () => {

    beforeEach(() => {

      req.params = {
        id_monitoring: 'MON001',
        id_pohon: 'PH001'
      };

    });

    test('harus menampilkan pesan jika data monitoring tidak ditemukan', async () => {
      DetailMonitoring.findOne.mockResolvedValue(null);

      await MonitoringController.update(req, res);
      expect(res.send).toHaveBeenCalledWith(
        'Data monitoring tidak ditemukan'
      );
    });

    test('harus update tanpa mengganti foto', async () => {
      const updateMock = jest.fn();
      DetailMonitoring.findOne.mockResolvedValue({
        foto_monitoring: JSON.stringify([ 'lama.jpg' ]),
        update: updateMock
      });
      req.body = {
        tinggi_pohon: 120,
        diameter_pohon: 6,
        kesehatan_batang: 'baik',
        deskripsi: 'Update data',
        status: 'hidup'
      };

      await MonitoringController.update(req, res);
      expect(updateMock).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/petugas-lapangan/pohon/detail/PH001');
    });

    test('harus menghapus foto lama dan mengganti foto baru', async () => {
      const updateMock = jest.fn();
      req.files = [{ filename: 'baru.jpg' }];
      DetailMonitoring.findOne.mockResolvedValue({
        foto_monitoring: JSON.stringify([
          'lama1.jpg',
          'lama2.jpg'
        ]),
        update: updateMock
      });
      req.body = { status: 'hidup' };

      await MonitoringController.update(req, res);
      expect(deleteFile).toHaveBeenCalledTimes(2);
      expect(updateMock).toHaveBeenCalled();
    });

    test('harus tetap update jika foto_monitoring bukan JSON valid', async () => {

      const updateMock = jest.fn();

      DetailMonitoring.findOne.mockResolvedValue({
        foto_monitoring: 'invalid-json',
        update: updateMock
      });

      req.body = {
        status: 'hidup'
      };

      await MonitoringController.update(req, res);

      expect(updateMock).toHaveBeenCalled();

    });

    test('harus menggunakan array kosong jika foto_monitoring null', async () => {

      const updateMock = jest.fn();

      DetailMonitoring.findOne.mockResolvedValue({
        foto_monitoring: null,
        update: updateMock
      });

      req.body = {
        status: 'hidup'
      };

      await MonitoringController.update(req, res);

      expect(updateMock).toHaveBeenCalled();
    });

    test('harus membuat monitoring lanjutan saat status mati', async () => {
      const updateMock = jest.fn();
      req.body = { status: 'mati' };
      DetailMonitoring.findOne.mockResolvedValueOnce({
          foto_monitoring: '[]',
          update: updateMock
        })
        .mockResolvedValue(null);
      Monitoring.findByPk.mockResolvedValue({
        tahap_monitoring: 1,
        tgl_monitoring: '2026-01-01'
      });
      Monitoring.findOne.mockResolvedValue({ id_monitoring: 'MON002' });
      DetailMonitoring.create.mockResolvedValue({});

      await MonitoringController.update(req, res);
      expect(updateMock).toHaveBeenCalled();
      expect(DetailMonitoring.create).toHaveBeenCalled();
    });

    test('tidak membuat detail monitoring lanjutan pada update jika sudah ada', async () => {

      const updateMock = jest.fn();

      req.body = {
        status: 'mati'
      };

      DetailMonitoring.findOne
        .mockResolvedValueOnce({
          foto_monitoring: '[]',
          update: updateMock
        })
        .mockResolvedValue({
          id_detail_monitoring: 99
        });

      Monitoring.findByPk.mockResolvedValue({
        tahap_monitoring: 1,
        tgl_monitoring: '2026-01-01'
      });

      Monitoring.findOne.mockResolvedValue({
        id_monitoring: 'MON002'
      });

      await MonitoringController.update(req, res);

      expect(updateMock).toHaveBeenCalled();
    });

    test('harus membuat monitoring baru pada update jika monitoring berikutnya belum ada', async () => {

      const updateMock = jest.fn();

      req.body = {
        status: 'mati'
      };

      DetailMonitoring.findOne
        .mockResolvedValueOnce({
          foto_monitoring: '[]',
          update: updateMock
        })
        .mockResolvedValue(null);

      Monitoring.findByPk.mockResolvedValue({
        tahap_monitoring: 1,
        tgl_monitoring: '2026-01-01'
      });

      Monitoring.findOne.mockResolvedValue(null);

      Monitoring.create.mockResolvedValue({
        id_monitoring: 'MON002'
      });

      await MonitoringController.update(req, res);

      expect(Monitoring.create).toHaveBeenCalled();

    });

    test('harus masuk ke catch error pada update', async () => {

      DetailMonitoring.findOne.mockRejectedValue(
        new Error('Database Error')
      );

      await MonitoringController.update(req, res);

      expect(res.send).toHaveBeenCalledWith(
        'Database Error'
      );

    });

  });

});