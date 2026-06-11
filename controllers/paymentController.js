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

              {
                model: User,
                as: 'user'
              },

              {
                model: ProgramDonasi,
                as: 'program'
              }

            ]

          }

        });

      if (!payment) {

        return res
          .status(404)
          .send(
            'Payment tidak ditemukan'
          );

      }

      // Setup Midtrans
      const snap =
        new midtransClient.Snap({

          isProduction: false,

          serverKey:
            process.env
              .MIDTRANS_SERVER_KEY

        });

      // Parameter Midtrans
      const parameter = {

        transaction_details: {

          order_id:
            payment.order_id,

          gross_amount:
            payment.gross_amount

        },

        customer_details: {

          first_name:
            payment.donasi
              .user
              .nama_lengkap,

          email:
            payment.donasi
              .user
              .email

        }

      };

      // Generate Snap Token
      const transaction =
        await snap.createTransaction(
          parameter
        );

      const snapToken =
        transaction.token;

      return res.render(

        'payment',

        {

          payment,

          donasi:
            payment.donasi,

          user:
            payment.donasi.user,

          program:
            payment.donasi.program,

          snapToken,

          clientKey:
            process.env
              .MIDTRANS_CLIENT_KEY

        }

      );

    } catch (error) {

      console.error(error);

      return res
        .status(500)
        .send(
          'Error halaman payment'
        );

    }

  }

}

module.exports = PaymentController;