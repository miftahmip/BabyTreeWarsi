const midtransClient = require('midtrans-client');
const {Payment, Donasi, User, ProgramDonasi} = require('../models');

class PaymentController {

  static async getPaymentPage(req, res) {

    try {

      const {
        order_id
      } = req.params;

      const payment =
        await Payment.findOne({

          where: {
            order_id
          },

          include: {

            model: Donasi,
            as: 'donasi',

            include: [
              { model: User, as: 'user' },
              { model: ProgramDonasi, as: 'program' }
            ]

          }

        });

      if (!payment) {
        return res.status(404).send('Payment tidak ditemukan');
      }

      if (payment.status === 'settlement') {
        return res.redirect(`/donasi/${payment.id_donasi}/success`);
      }

      if (['expired', 'failed', 'cancelled'].includes(payment.status)) {
        return res.redirect(`/donasi/${payment.id_donasi}/retry-payment`);
      }

      const snap =
        new midtransClient.Snap({
          isProduction: false,
          serverKey: process.env.MIDTRANS_SERVER_KEY
        });

      const parameter = {

        transaction_details: {
          order_id: payment.order_id,
          gross_amount: payment.gross_amount
        },

        customer_details: {
          first_name: payment.donasi.user.nama_lengkap,
          email: payment.donasi.user.email
        }

      };

      const transaction =
        await snap.createTransaction(parameter);

      const snapToken =
        transaction.token;

      return res.render(

        'payment',

        {
          payment,
          donasi: payment.donasi,
          user: payment.donasi.user,
          program: payment.donasi.program,
          snapToken,
          clientKey: process.env.MIDTRANS_CLIENT_KEY
        }

      );

    } catch (error) {

      console.error(error);
      return res.status(500).send('Error halaman payment');

    }

  }


  static async retryPayment(req, res) {

    try {

      const {
        id_donasi
      } = req.params;

      const donasi =
        await Donasi.findByPk(
          id_donasi,
          {
            include: [
              {
                model: ProgramDonasi,
                as: 'program'
              }
            ]
          }
        );

      if (!donasi) {

        return res
          .status(404)
          .send(
            'Donasi tidak ditemukan'
          );

      }

      if (
        donasi.id_user !==
        req.user.id_user
      ) {

        return res
          .status(403)
          .send(
            'Tidak diizinkan'
          );

      }

      // ==========================
      // GUARD BARU: program sudah berakhir,
      // tidak boleh retry
      // ==========================

      if (
        donasi.program &&
        donasi.program.status_program === 'selesai'
      ) {

        return res
          .status(400)
          .send(
            'Program donasi ini sudah berakhir. Pembayaran tidak dapat dilanjutkan.'
          );

      }

      const settledPayment =
        await Payment.findOne({

          where: {
            id_donasi,
            status: 'settlement'
          }

        });

      if (settledPayment) {

        return res.redirect(
          `/payment/${settledPayment.order_id}`
        );

      }

      const pendingPayment =
        await Payment.findOne({

          where: {
            id_donasi,
            status: 'pending'
          }

        });

      if (pendingPayment) {

        return res.redirect(
          `/payment/${pendingPayment.order_id}`
        );

      }

      const lastPayment =
        await Payment.findOne({

          order: [
            ['created_at', 'DESC']
          ]

        });

      let nextPaymentNumber =
        1;

      if (lastPayment) {

        const lastPayId =
          lastPayment.id || '';

        const number =
          parseInt(
            lastPayId.replace(
              'PAY',
              ''
            )
          ) || 0;

        nextPaymentNumber =
          number + 1;

      }

      const paymentId =
        `PAY${String(
          nextPaymentNumber
        ).padStart(4, '0')}`;

      const order_id =
        `DONASI-${id_donasi}-${Date.now()}`;

      await Payment.create({

        id: paymentId,

        id_donasi,

        order_id,

        gross_amount:
          donasi.nominal_donasi,

        status: 'pending'

      });

      return res.redirect(
        `/payment/${order_id}`
      );

    } catch (error) {

      console.error(error);

      return res
        .status(500)
        .send(
          'Terjadi kesalahan saat membuat ulang pembayaran'
        );

    }

  }

}

module.exports = PaymentController;