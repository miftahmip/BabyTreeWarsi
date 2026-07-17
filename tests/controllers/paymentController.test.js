const PaymentController = require('../../controllers/paymentController');
const midtransClient = require('midtrans-client');
const { Payment, Donasi, User, ProgramDonasi } = require('../../models');

jest.mock('midtrans-client', () => ({
  Snap: jest.fn()
}));

jest.mock('../../models', () => ({
  Payment: {
    findOne: jest.fn()
  },
  Donasi: {},
  User: {},
  ProgramDonasi: {}
}));

const createMockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  render: jest.fn().mockReturnThis()
});

describe('PaymentController', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    req = {
      params: { order_id: 'DONASI-001' }
    };

    res = createMockResponse();

    process.env.MIDTRANS_SERVER_KEY = 'server-key';
    process.env.MIDTRANS_CLIENT_KEY = 'client-key';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('mengirimkan 404 ketika payment tidak ditemukan', async () => {
    Payment.findOne.mockResolvedValue(null);

    await PaymentController.getPaymentPage(req, res);

    expect(Payment.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { order_id: 'DONASI-001' }
    }));
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Payment tidak ditemukan');
  });

  test('merender halaman payment dan membuat snap token ketika payment ditemukan', async () => {
    const mockCreateTransaction = jest.fn().mockResolvedValue({ token: 'snap-token' });
    const mockSnapInstance = { createTransaction: mockCreateTransaction };

    midtransClient.Snap.mockImplementation(() => mockSnapInstance);

    Payment.findOne.mockResolvedValue({
      order_id: 'DONASI-001',
      gross_amount: 50000,
      donasi: {
        user: {
          nama_lengkap: 'Andi',
          email: 'andi@mail.com'
        },
        program: { nama_program: 'Program A' }
      }
    });

    await PaymentController.getPaymentPage(req, res);

    expect(midtransClient.Snap).toHaveBeenCalledWith({
      isProduction: false,
      serverKey: 'server-key'
    });
    expect(mockCreateTransaction).toHaveBeenCalledWith(expect.objectContaining({
      transaction_details: {
        order_id: 'DONASI-001',
        gross_amount: 50000
      },
      customer_details: {
        first_name: 'Andi',
        email: 'andi@mail.com'
      }
    }));
    expect(res.render).toHaveBeenCalledWith(
      'payment',
      expect.objectContaining({
        snapToken: 'snap-token',
        clientKey: 'client-key'
      })
    );
  });

  test('mengirimkan 500 ketika terjadi error saat mengambil payment', async () => {
    Payment.findOne.mockRejectedValue(new Error('DB error'));

    await PaymentController.getPaymentPage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Error halaman payment');
  });

  test('mengirimkan 500 ketika snap.createTransaction gagal', async () => {
    const mockCreateTransaction = jest.fn().mockRejectedValue(new Error('Midtrans error'));
    const mockSnapInstance = { createTransaction: mockCreateTransaction };

    midtransClient.Snap.mockImplementation(() => mockSnapInstance);

    Payment.findOne.mockResolvedValue({
      order_id: 'DONASI-001',
      gross_amount: 50000,
      donasi: {
        user: {
          nama_lengkap: 'Andi',
          email: 'andi@mail.com'
        },
        program: { nama_program: 'Program A' }
      }
    });

    await PaymentController.getPaymentPage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Error halaman payment');
  });
});
