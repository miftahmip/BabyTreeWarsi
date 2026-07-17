const MidtransWebhookController = require('../../controllers/midtransWebhookController');
const { Payment, Donasi, ProgramDonasi } = require('../../models');

jest.mock('../../models', () => ({
  Payment: {
    update: jest.fn(),
    findOne: jest.fn()
  },
  Donasi: {
    findByPk: jest.fn(),
    findAll: jest.fn()
  },
  ProgramDonasi: {
    update: jest.fn()
  }
}));

const createMockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis()
});

describe('MidtransWebhookController', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    req = {
      body: {
        order_id: 'DONASI-001',
        transaction_status: 'settlement',
        payment_type: 'bank_transfer',
        transaction_id: 'tx-123',
        settlement_time: '2024-01-01T10:00:00.000Z',
        transaction_time: '2024-01-01T09:00:00.000Z',
        expiry_time: '2024-01-01T11:00:00.000Z',
        va_numbers: [{ bank: 'bca', va_number: '123456' }],
        store: 'alfamart'
      }
    };

    res = createMockResponse();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('mengupdate payment dan menghitung pohon terkumpul saat status settlement', async () => {
    Payment.update.mockResolvedValue([1]);
    Payment.findOne.mockResolvedValue({ id_donasi: 'DNS0001' });
    Donasi.findByPk.mockResolvedValue({ id_program: 'PRG001' });
    Donasi.findAll.mockResolvedValue([
      { jumlah_pohon: 2, payments: [{ status: 'settlement' }] },
      { jumlah_pohon: 3, payments: [{ status: 'settlement' }] }
    ]);
    ProgramDonasi.update.mockResolvedValue([1]);

    await MidtransWebhookController.handleNotification(req, res);

    expect(Payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'settlement',
        payment_type: 'bank_transfer',
        payment_channel: 'bca',
        transaction_id: 'tx-123',
        va_number: '123456',
        raw_response: req.body
      }),
      expect.objectContaining({ where: { order_id: 'DONASI-001' } })
    );

    expect(Payment.findOne).toHaveBeenCalledWith({ where: { order_id: 'DONASI-001' } });
    expect(Donasi.findByPk).toHaveBeenCalledWith('DNS0001');
    expect(Donasi.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { id_program: 'PRG001' },
      include: [expect.objectContaining({ as: 'payments' })]
    }));
    expect(ProgramDonasi.update).toHaveBeenCalledWith(
      { pohon_terkumpul: 5 },
      expect.objectContaining({ where: { id_program: 'PRG001' } })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'OK' });
  });

  test('memetakan status pending, deny, expire, dan cancel ke status internal yang sesuai', async () => {
    const scenarios = [
      { transaction_status: 'pending', expected: 'pending' },
      { transaction_status: 'deny', expected: 'failed' },
      { transaction_status: 'expire', expected: 'expired' },
      { transaction_status: 'cancel', expected: 'cancelled' }
    ];

    for (const scenario of scenarios) {
      jest.clearAllMocks();
      req.body.transaction_status = scenario.transaction_status;
      Payment.update.mockResolvedValue([1]);

      await MidtransWebhookController.handleNotification(req, res);

      expect(Payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: scenario.expected }),
        expect.anything()
      );
    }
  });

  test('memetakan payment type cstore ke payment_channel store', async () => {
    req.body.payment_type = 'cstore';
    req.body.store = 'alfamart';
    req.body.va_numbers = [];
    Payment.update.mockResolvedValue([1]);

    await MidtransWebhookController.handleNotification(req, res);

    expect(Payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ payment_channel: 'alfamart' }),
      expect.anything()
    );
  });

  test('melewati update pohon terkumpul ketika donasi atau payment tidak ditemukan', async () => {
    Payment.update.mockResolvedValue([1]);
    Payment.findOne.mockResolvedValue(null);

    await MidtransWebhookController.handleNotification(req, res);

    expect(ProgramDonasi.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'OK' });
  });

  test('memetakan payment type lain ke payment_channel yang sama', async () => {
    req.body.payment_type = 'gopay';
    req.body.va_numbers = [];
    Payment.update.mockResolvedValue([1]);

    await MidtransWebhookController.handleNotification(req, res);

    expect(Payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ payment_channel: 'gopay' }),
      expect.anything()
    );
  });

  test('menangani bank transfer tanpa VA number dan timestamp kosong', async () => {
    req.body.payment_type = 'bank_transfer';
    req.body.va_numbers = [];
    req.body.transaction_time = null;
    req.body.settlement_time = null;
    req.body.expiry_time = null;
    Payment.update.mockResolvedValue([1]);

    await MidtransWebhookController.handleNotification(req, res);

    expect(Payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_channel: null,
        transaction_time: null,
        settlement_time: null,
        expiry_time: null
      }),
      expect.anything()
    );
  });

  test('melewati update pohon terkumpul ketika donasi tidak ditemukan', async () => {
    Payment.update.mockResolvedValue([1]);
    Payment.findOne.mockResolvedValue({ id_donasi: 'DNS0001' });
    Donasi.findByPk.mockResolvedValue(null);

    await MidtransWebhookController.handleNotification(req, res);

    expect(ProgramDonasi.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'OK' });
  });

  test('mengembalikan 500 ketika terjadi error pada webhook', async () => {
    Payment.update.mockRejectedValue(new Error('DB error'));

    await MidtransWebhookController.handleNotification(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error webhook' });
  });
});
