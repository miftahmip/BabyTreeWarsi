const {User, Donasi, Payment, ProgramDonasi} = require('../models');

class DonasiController {

  static async submitDonasi(req, res) {

    try {

      const {
        email,
        jumlah_pohon,
        id_program
      } = req.body;

      if (
        !email ||
        !jumlah_pohon ||
        !id_program
      ) {

        return res
          .status(400)
          .send('Data tidak lengkap');

      }

      const program =
        await ProgramDonasi.findByPk(
          id_program
        );

      if (!program) {

        return res
          .status(404)
          .send('Program tidak ditemukan');

      }

      const jumlahPohonInt =
        parseInt(jumlah_pohon);

      if (
        isNaN(jumlahPohonInt) ||
        jumlahPohonInt <= 0
      ) {

        return res
          .status(400)
          .send('Jumlah pohon tidak valid');

      }

      req.session.pendingDonation = {

        email:
          email
            .toLowerCase()
            .trim(),

        jumlah_pohon:
          jumlahPohonInt,

        id_program

      };

      return res.redirect(

        `/login?email=${encodeURIComponent(
          email.toLowerCase().trim()
        )}&returnUrl=${encodeURIComponent(
          '/donasi/process'
        )}`

      );

    } catch (error) {

      console.error(error);

      return res
        .status(500)
        .send(
          'Terjadi kesalahan saat proses donasi'
        );

    }

  }


  static async processPendingDonasi(req,res) {

    try {

      const pendingDonation =
        req.session.pendingDonation;

      if (!pendingDonation) {

        return res
          .status(400)
          .send(
            'Tidak ada donasi yang sedang diproses. Silakan lakukan donasi kembali.'
          );

      }

      const {
        id_program,
        jumlah_pohon
      } = pendingDonation;

      const user =
        await User.findOne({

          where: {
            id_user:
              req.user.id_user
          }

        });

      if (!user) {

        return res
          .status(401)
          .send(
            'Pengguna tidak ditemukan.'
          );

      }

      const program =
        await ProgramDonasi.findByPk(
          id_program
        );

      if (!program) {

        return res
          .status(404)
          .send(
            'Program tidak ditemukan'
          );

      }

      const nominal =
        jumlah_pohon *
        program.harga_pohon;

      const lastDonasi =
        await Donasi.findOne({

          order: [
            ['createdAt', 'DESC']
          ]

        });

      let nextDonasiNumber =
        1;

      if (lastDonasi) {

        const lastId =
          lastDonasi.id_donasi || '';

        const number =
          parseInt(
            lastId.replace(
              'DNS',
              ''
            )
          ) || 0;

        nextDonasiNumber =
          number + 1;

      }

      const id_donasi =
        `DNS${String(
          nextDonasiNumber
        ).padStart(4, '0')}`;

      const donasi =
        await Donasi.create({

          id_donasi,

          id_program,

          id_user:
            user.id_user,

          jumlah_pohon,

          nominal_donasi:
            nominal,

          tanggal_donasi:
            new Date()

        });

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

        id_donasi:
          donasi.id_donasi,

        order_id,

        gross_amount:
          nominal,

        status:
          'pending'

      });

      delete req.session
        .pendingDonation;

      return res.redirect(
        `/payment/${order_id}`
      );

    } catch (error) {

      console.error(error);

      return res
        .status(500)
        .send(
          'Terjadi kesalahan saat memproses donasi.'
        );

    }

  }


  static async detailProgramDonasi(req, res) {

    try {

      const {
        id_program
      } = req.params;

      const program =
        await ProgramDonasi.findByPk(
          id_program
        );

      if (!program) {

        return res
          .status(404)
          .send(
            'Program tidak ditemukan'
          );

      }

      const donasis =
        await Donasi.findAll({

          where: {
            id_program
          },

          include: [

            {
              model: User,
              as: 'user',

              attributes: [
                'nama_lengkap',
                'email'
              ]
            },

            {
              model: Payment,
              as: 'payments',

              where: {
                status:
                  'settlement'
              },

              attributes: [
                'status'
              ]
            }

          ],

          order: [
            [
              'tanggal_donasi',
              'DESC'
            ]
          ]

        });

      return res.render(

        'admin-pusat/detail-donasi',

        {
          pageTitle:
            'Detail Donasi Program',

          activePage:
            'kelola-program',

          user:
            req.user,

          program,

          donasis
        }

      );

    } catch (error) {

      console.error(error);

      return res
        .status(500)
        .send(
          'Terjadi kesalahan server'
        );

    }

  }

}

module.exports = DonasiController;