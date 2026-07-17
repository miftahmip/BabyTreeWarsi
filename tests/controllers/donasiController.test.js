const DonasiController = require('../../controllers/donasiController');
const { User, Donasi, Payment, ProgramDonasi } = require('../../models');

jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn()
  },
  Donasi: {
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn()
  },
  Payment: {
    findOne: jest.fn(),
    create: jest.fn()
  },
  ProgramDonasi: {
    findByPk: jest.fn()
  }
}));

const createMockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  redirect: jest.fn().mockReturnThis(),
  render: jest.fn().mockReturnThis()
});

describe('DonasiController', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    req = {
      body: {},
      session: {},
      params: {},
      user: { id_user: 'USR0001' }
    };

    res = createMockResponse();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('submitDonasi', () => {
    test('mengirimkan respons 400 ketika data tidak lengkap', async () => {
      req.body = { email: '', jumlah_pohon: '', id_program: '' };

      await DonasiController.submitDonasi(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Data tidak lengkap');
    });

    test('mengirimkan respons 404 ketika program tidak ditemukan', async () => {
      req.body = {
        email: 'donatur@mail.com',
        jumlah_pohon: '2',
        id_program: 'PRG001'
      };

      ProgramDonasi.findByPk.mockResolvedValue(null);

      await DonasiController.submitDonasi(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Program tidak ditemukan');
    });

    test('mengirimkan respons 500 ketika submit donasi mengalami error', async () => {
      req.body = {
        email: 'donatur@mail.com',
        jumlah_pohon: '2',
        id_program: 'PRG001'
      };

      ProgramDonasi.findByPk.mockRejectedValue(new Error('DB error'));

      await DonasiController.submitDonasi(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Terjadi kesalahan saat proses donasi');
    });

    test('mengirimkan respons 400 ketika jumlah pohon tidak valid', async () => {
      req.body = {
        email: 'donatur@mail.com',
        jumlah_pohon: '0',
        id_program: 'PRG001'
      };

      ProgramDonasi.findByPk.mockResolvedValue({ id_program: 'PRG001' });

      await DonasiController.submitDonasi(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Jumlah pohon tidak valid');
    });

    test('menyimpan pending donation dan redirect ke login', async () => {
      req.body = {
        email: ' Donatur@Mail.com ',
        jumlah_pohon: '3',
        id_program: 'PRG001'
      };

      ProgramDonasi.findByPk.mockResolvedValue({ id_program: 'PRG001' });

      await DonasiController.submitDonasi(req, res);

      expect(req.session.pendingDonation).toEqual({
        email: 'donatur@mail.com',
        jumlah_pohon: 3,
        id_program: 'PRG001'
      });
      expect(res.redirect).toHaveBeenCalledWith(
        '/login?email=donatur%40mail.com&returnUrl=%2Fdonasi%2Fprocess'
      );
    });
  });

  describe('processPendingDonasi', () => {
    test('mengirimkan respons 400 ketika tidak ada donasi yang diproses', async () => {
      await DonasiController.processPendingDonasi(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Tidak ada donasi yang sedang diproses. Silakan lakukan donasi kembali.');
    });

    test('mengirimkan respons 401 ketika pengguna tidak ditemukan', async () => {
      req.session.pendingDonation = { id_program: 'PRG001', jumlah_pohon: 2 };
      User.findOne.mockResolvedValue(null);

      await DonasiController.processPendingDonasi(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith('Pengguna tidak ditemukan.');
    });

    test('mengirimkan respons 404 ketika program tidak ditemukan', async () => {
      req.session.pendingDonation = { id_program: 'PRG001', jumlah_pohon: 2 };
      User.findOne.mockResolvedValue({ id_user: 'USR0001' });
      ProgramDonasi.findByPk.mockResolvedValue(null);

      await DonasiController.processPendingDonasi(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Program tidak ditemukan');
    });

    test('memproses donasi dan redirect ke halaman pembayaran', async () => {
      req.session.pendingDonation = { id_program: 'PRG001', jumlah_pohon: 2 };
      User.findOne.mockResolvedValue({ id_user: 'USR0001' });
      ProgramDonasi.findByPk.mockResolvedValue({ harga_pohon: 5000 });
      Donasi.findOne.mockResolvedValue(null);
      Donasi.create.mockResolvedValue({ id_donasi: 'DNS0001' });
      Payment.findOne.mockResolvedValue(null);
      Payment.create.mockResolvedValue({});

      await DonasiController.processPendingDonasi(req, res);

      expect(Donasi.create).toHaveBeenCalledWith(expect.objectContaining({
        id_program: 'PRG001',
        id_user: 'USR0001',
        jumlah_pohon: 2,
        nominal_donasi: 10000
      }));
      expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({
        id_donasi: 'DNS0001',
        gross_amount: 10000,
        status: 'pending'
      }));
      expect(req.session.pendingDonation).toBeUndefined();
      expect(res.redirect).toHaveBeenCalledWith(expect.stringMatching(/^\/payment\/DONASI-DNS0001-/));
    });

    test('menggunakan nomor urut donasi dan payment dari data sebelumnya', async () => {
      req.session.pendingDonation = { id_program: 'PRG001', jumlah_pohon: 1 };
      User.findOne.mockResolvedValue({ id_user: 'USR0001' });
      ProgramDonasi.findByPk.mockResolvedValue({ harga_pohon: 2500 });
      Donasi.findOne.mockResolvedValue({ id_donasi: '' });
      Donasi.create.mockResolvedValue({ id_donasi: 'DNS0001' });
      Payment.findOne.mockResolvedValue({ id: '' });
      Payment.create.mockResolvedValue({});

      await DonasiController.processPendingDonasi(req, res);

      expect(Donasi.create).toHaveBeenCalledWith(expect.objectContaining({
        id_donasi: 'DNS0001'
      }));
      expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({
        id: 'PAY0001'
      }));
    });

    test('mengirimkan respons 500 ketika proses pending donasi error', async () => {
      req.session.pendingDonation = { id_program: 'PRG001', jumlah_pohon: 2 };
      User.findOne.mockRejectedValue(new Error('DB error'));

      await DonasiController.processPendingDonasi(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Terjadi kesalahan saat memproses donasi.');
    });
  });

  describe('detailProgramDonasi', () => {
    test('mengirimkan respons 404 ketika program tidak ditemukan', async () => {
      req.params = { id_program: 'PRG001' };
      ProgramDonasi.findByPk.mockResolvedValue(null);

      await DonasiController.detailProgramDonasi(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Program tidak ditemukan');
    });

    test('merender halaman detail program dengan data donasi', async () => {
      req.params = { id_program: 'PRG001' };
      req.user = { id_user: 'USR0001', nama_lengkap: 'Admin' };
      ProgramDonasi.findByPk.mockResolvedValue({ id_program: 'PRG001' });
      Donasi.findAll.mockResolvedValue([{ id_donasi: 'DNS0001' }]);

      await DonasiController.detailProgramDonasi(req, res);

      expect(Donasi.findAll).toHaveBeenCalled();
      expect(res.render).toHaveBeenCalledWith(
        'admin-pusat/detail-donasi',
        expect.objectContaining({
          pageTitle: 'Detail Donasi Program',
          activePage: 'kelola-program',
          user: req.user,
          program: { id_program: 'PRG001' },
          donasis: [{ id_donasi: 'DNS0001' }]
        })
      );
    });

    test('mengirimkan respons 500 ketika detail program mengalami error', async () => {
      req.params = { id_program: 'PRG001' };
      ProgramDonasi.findByPk.mockRejectedValue(new Error('DB error'));

      await DonasiController.detailProgramDonasi(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Terjadi kesalahan server');
    });
  });
});
