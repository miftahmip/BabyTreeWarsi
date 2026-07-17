const PenanamanController = require('../../controllers/penanamanController');
const { Penanaman, DetailPenanaman, User, ProgramDonasi, sequelize } = require('../../models');
const WilayahService = require('../../services/wilayahService');

jest.mock('../../models', () => ({
  Penanaman: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  DetailPenanaman: {
    findAll: jest.fn(),
    bulkCreate: jest.fn(),
    destroy: jest.fn()
  },
  User: {
    findAll: jest.fn()
  },
  ProgramDonasi: {
    findAll: jest.fn()
  },
  sequelize: {
    transaction: jest.fn()
  }
}));

jest.mock('../../services/wilayahService', () => ({
  mapWilayah: jest.fn()
}));

const createMockResponse = () => ({
  render: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  redirect: jest.fn().mockReturnThis()
});

describe('PenanamanController', () => {
  let req;
  let res;
  let transaction;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});

    transaction = {
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue()
    };

    sequelize.transaction.mockResolvedValue(transaction);

    req = {
      user: { kode_provinsi: '11', id_user: 'USR001' }
    };

    res = createMockResponse();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('getAll merender data penanaman, program, dan petugas sesuai provinsi', async () => {
    Penanaman.findAll.mockResolvedValue([{ id_penanaman: 'PNM0001' }]);
    ProgramDonasi.findAll.mockResolvedValue([{ id_program: 'PRG001' }]);
    User.findAll.mockResolvedValue([{ id_user: 'USR002', nama_lengkap: 'Petugas' }]);

    await PenanamanController.getAll(req, res);

    expect(Penanaman.findAll).toHaveBeenCalled();
    expect(ProgramDonasi.findAll).toHaveBeenCalled();
    expect(User.findAll).toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith(
      'admin-wilayah/penanaman',
      expect.objectContaining({
        title: 'Data Penugasan Penanaman',
        activePage: 'penanaman',
        user: req.user
      })
    );
  });

  test('getAll mengirimkan error saat terjadi exception', async () => {
    Penanaman.findAll.mockRejectedValue(new Error('GetAll error'));

    await PenanamanController.getAll(req, res);

    expect(res.send).toHaveBeenCalledWith('GetAll error');
  });

  test('create mengirimkan pesan jika petugas tidak dipilih', async () => {
    req.body = { petugas: [] };

    await PenanamanController.create(req, res);

    expect(transaction.rollback).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith('Petugas lapangan wajib dipilih');
  });

  test('create membuat penanaman baru dan detail petugas', async () => {
    req.body = {
      id_program: 'PRG001',
      tanggal_mulai: '2024-01-01',
      tanggal_selesai: '2024-01-10',
      petugas: ['USR001', 'USR002']
    };

    Penanaman.findOne.mockResolvedValue(null);
    Penanaman.create.mockResolvedValue({ id_penanaman: 'PNM0001' });
    DetailPenanaman.bulkCreate.mockResolvedValue([]);

    await PenanamanController.create(req, res);

    expect(Penanaman.create).toHaveBeenCalledWith(expect.objectContaining({
      id_penanaman: 'PNM0001',
      id_program: 'PRG001',
      status_penanaman: 'aktif'
    }), { transaction });
    expect(DetailPenanaman.bulkCreate).toHaveBeenCalledWith(
      [
        { id_penanaman: 'PNM0001', id_user: 'USR001' },
        { id_penanaman: 'PNM0001', id_user: 'USR002' }
      ],
      { transaction }
    );
    expect(transaction.commit).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('/admin-wilayah/penanaman');
  });

  test('create rollback dan kirim error saat gagal', async () => {
    req.body = { petugas: ['USR001'] };
    Penanaman.findOne.mockRejectedValue(new Error('DB error'));

    await PenanamanController.create(req, res);

    expect(transaction.rollback).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith('DB error');
  });

  test('create membuat id penanaman berikutnya saat ada data terakhir', async () => {
    req.body = {
      id_program: 'PRG001',
      tanggal_mulai: '2024-01-01',
      tanggal_selesai: '2024-01-10',
      petugas: ['USR001']
    };

    Penanaman.findOne.mockResolvedValue({ id_penanaman: 'PNM0009' });
    Penanaman.create.mockResolvedValue({ id_penanaman: 'PNM0010' });
    DetailPenanaman.bulkCreate.mockResolvedValue([]);

    await PenanamanController.create(req, res);

    expect(Penanaman.create).toHaveBeenCalledWith(expect.objectContaining({
      id_penanaman: 'PNM0010'
    }), { transaction });
  });

  test('update mengubah penanaman dan detail petugas', async () => {
    req.params = { id: 'PNM0001' };
    req.body = {
      id_program: 'PRG001',
      tanggal_mulai: '2024-01-01',
      tanggal_selesai: '2024-01-10',
      status_penanaman: 'aktif',
      petugas: ['USR001']
    };

    Penanaman.update.mockResolvedValue([1]);
    DetailPenanaman.destroy.mockResolvedValue(1);
    DetailPenanaman.bulkCreate.mockResolvedValue([]);

    await PenanamanController.update(req, res);

    expect(Penanaman.update).toHaveBeenCalled();
    expect(DetailPenanaman.destroy).toHaveBeenCalled();
    expect(DetailPenanaman.bulkCreate).toHaveBeenCalledWith(
      [{ id_penanaman: 'PNM0001', id_user: 'USR001' }],
      { transaction }
    );
    expect(transaction.commit).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('/admin-wilayah/penanaman');
  });

  test('create menangani petugas tunggal yang dikirim sebagai string', async () => {
    req.body = {
      id_program: 'PRG001',
      tanggal_mulai: '2024-01-01',
      tanggal_selesai: '2024-01-10',
      petugas: 'USR001'
    };

    Penanaman.findOne.mockResolvedValue(null);
    Penanaman.create.mockResolvedValue({ id_penanaman: 'PNM0001' });
    DetailPenanaman.bulkCreate.mockResolvedValue([]);

    await PenanamanController.create(req, res);

    expect(DetailPenanaman.bulkCreate).toHaveBeenCalledWith(
      [{ id_penanaman: 'PNM0001', id_user: 'USR001' }],
      { transaction }
    );
  });

  test('update menangani petugas tunggal yang dikirim sebagai string', async () => {
    req.params = { id: 'PNM0001' };
    req.body = {
      id_program: 'PRG001',
      tanggal_mulai: '2024-01-01',
      tanggal_selesai: '2024-01-10',
      status_penanaman: 'aktif',
      petugas: 'USR001'
    };

    Penanaman.update.mockResolvedValue([1]);
    DetailPenanaman.destroy.mockResolvedValue(1);
    DetailPenanaman.bulkCreate.mockResolvedValue([]);

    await PenanamanController.update(req, res);

    expect(DetailPenanaman.bulkCreate).toHaveBeenCalledWith(
      [{ id_penanaman: 'PNM0001', id_user: 'USR001' }],
      { transaction }
    );
  });

  test('delete menghapus detail dan penanaman', async () => {
    req.params = { id: 'PNM0001' };

    DetailPenanaman.destroy.mockResolvedValue(1);
    Penanaman.destroy.mockResolvedValue(1);

    await PenanamanController.delete(req, res);

    expect(DetailPenanaman.destroy).toHaveBeenCalled();
    expect(Penanaman.destroy).toHaveBeenCalled();
    expect(transaction.commit).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('/admin-wilayah/penanaman');
  });

  test('update rollback dan kirim error saat gagal', async () => {
    req.params = { id: 'PNM0001' };
    req.body = { petugas: ['USR001'] };
    Penanaman.update.mockRejectedValue(new Error('Update error'));

    await PenanamanController.update(req, res);

    expect(transaction.rollback).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith('Update error');
  });

  test('delete rollback dan kirim error saat gagal', async () => {
    req.params = { id: 'PNM0001' };
    DetailPenanaman.destroy.mockRejectedValue(new Error('Delete error'));

    await PenanamanController.delete(req, res);

    expect(transaction.rollback).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith('Delete error');
  });

  test('getPetugasPenanaman merender data penugasan dengan wilayah yang dipetakan', async () => {
    const item = {
      toJSON: () => ({
        id_user: 'USR001',
        penanaman: { program: { id_program: 'PRG001' } }
      })
    };

    DetailPenanaman.findAll.mockResolvedValue([item]);
    WilayahService.mapWilayah.mockResolvedValue({ id_program: 'PRG001', nama_wilayah: 'Jakarta' });

    await PenanamanController.getPetugasPenanaman(req, res);

    expect(DetailPenanaman.findAll).toHaveBeenCalled();
    expect(WilayahService.mapWilayah).toHaveBeenCalledWith({ id_program: 'PRG001' });
    expect(res.render).toHaveBeenCalledWith(
      'petugas-lapangan/penanaman',
      expect.objectContaining({
        title: 'Penugasan Penanaman Pohon',
        user: req.user
      })
    );
  });

  test('getPetugasPenanaman melewati pemetaan wilayah saat program tidak ada', async () => {
    const item = {
      toJSON: () => ({
        id_user: 'USR001',
        penanaman: {}
      })
    };

    DetailPenanaman.findAll.mockResolvedValue([item]);

    await PenanamanController.getPetugasPenanaman(req, res);

    expect(WilayahService.mapWilayah).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalled();
  });

  test('getPetugasPenanaman rollback error saat terjadi exception', async () => {
    DetailPenanaman.findAll.mockRejectedValue(new Error('Petugas error'));

    await PenanamanController.getPetugasPenanaman(req, res);

    expect(res.send).toHaveBeenCalledWith('Petugas error');
  });
});
