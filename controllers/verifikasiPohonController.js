const {
  Pohon,
  Penanaman,
  ProgramDonasi,
  JenisPohon,
  Mitra,
  DetailMonitoring,
  Monitoring
} = require('../models');
const WilayahService =
  require('../services/wilayahService');

const { Op } = require('sequelize');

class VerifikasiPohonController {

  // =================================================
  // HALAMAN LIST PENANAMAN
  // =================================================
// HALAMAN LIST VERIFIKASI
    static async index(req, res) {

    try {

        const penanaman =
        await Penanaman.findAll({

            include: [

            {
                model: ProgramDonasi,
                as: 'program'
            },

            {
                model: Pohon,
                as: 'pohon'
            }

            ],

            order: [
            ['createdAt', 'DESC']
            ]

        });

        const data =
        await Promise.all(

            penanaman.map(async item => {

            // mapping wilayah
            const wilayah =
                await WilayahService.mapWilayah(
                item.program.dataValues
                );

            const totalVerifikasi =
                item.pohon.filter(
                p => p.status_verifikasi === 'disetujui'
                ).length;

            const totalMenunggu =
                item.pohon.filter(
                p =>
                    p.status_verifikasi === 'menunggu' ||
                    p.status_verifikasi === 'revisi'
                ).length;

            return {

                id_penanaman:
                item.id_penanaman,

                program:
                item.program,

                wilayah,

                total_pohon:
                item.program?.pohon_terkumpul || 0,

                total_verifikasi:
                totalVerifikasi,

                total_menunggu:
                totalMenunggu

            };

            })

        );

        res.render(
        'admin-wilayah/verifikasi-pohon/index',
        {
            title: 'Verifikasi Pohon',
            data,
            user: req.user
        }
        );

    } catch (error) {

        console.log(error);
        res.send(error.message);

    }

    }


  // =================================================
  // DETAIL VERIFIKASI
  // =================================================
// DETAIL VERIFIKASI
static async detail(req, res) {

  try {

    const { id_penanaman } =
      req.params;

    // DATA PENANAMAN
    const penanaman =
      await Penanaman.findByPk(
        id_penanaman,
        {

          include: [

            {
              model: ProgramDonasi,
              as: 'program'
            }

          ]

        }
      );

    if (!penanaman) {

      return res.send(
        'Data penanaman tidak ditemukan'
      );

    }

    // DATA POHON
    const data =
      await Pohon.findAll({

        where: {
          id_penanaman
        },

        include: [

          {
            model: JenisPohon,
            as: 'jenisPohon'
          },

          {
            model: Mitra,
            as: 'mitra'
          },

          {
            model: DetailMonitoring,
            as: 'detailMonitoring',

            include: [
              {
                model: Monitoring,
                as: 'monitoring'
              }
            ]
          }

        ],

        order: [
          ['createdAt', 'DESC']
        ]

      });

      const monitoring1 = [];
      const monitoring2 = [];
      const monitoring3 = [];

      data.forEach(pohon => {

        pohon.detailMonitoring.forEach(detail => {

          const tahap =
            detail.monitoring?.tahap_monitoring;

          const item = {
            ...detail.toJSON(),
            pohon
          };

          if (tahap === 1) {
            monitoring1.push(item);
          }

          if (tahap === 2) {
            monitoring2.push(item);
          }

          if (tahap === 3) {
            monitoring3.push(item);
          }

        });

      });

    res.render(
      'admin-wilayah/verifikasi-pohon/detail',
      {
        title: 'Detail Verifikasi Pohon',
        penanaman,
        data,
        monitoring1,
        monitoring2,
        monitoring3,
        user: req.user
      }
    );

  } catch (error) {

    console.log(error);
    res.send(error.message);

  }

}


  // =================================================
  // APPROVE MASSAL
  // =================================================
  static async approve(req, res) {

    try {

      const {
        selected_pohon,
        id_penanaman
      } = req.body;

      if (
        !selected_pohon ||
        selected_pohon.length === 0
      ) {

        return res.send(
          'Pilih minimal 1 pohon'
        );

      }

      await Pohon.update(

        {

          status_verifikasi:
            'disetujui',

          catatan_koreksi:
            null,

          verified_by_user_id:
            req.user.id_user

        },

        {

          where: {

            id_pohon: {
              [Op.in]:
                Array.isArray(selected_pohon)
                  ? selected_pohon
                  : [selected_pohon]
            }

          }

        }

      );

      res.redirect(`/admin-wilayah/verifikasi-pohon/${id_penanaman}`);

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }


  // =================================================
  // REVISI MASSAL
  // =================================================
  static async revisi(req, res) {

    try {

      const {
        selected_pohon,
        catatan_koreksi,
        id_penanaman
      } = req.body;

      if (
        !selected_pohon ||
        selected_pohon.length === 0
      ) {

        return res.send(
          'Pilih minimal 1 pohon'
        );

      }

      await Pohon.update(

        {

          status_verifikasi:
            'revisi',

          catatan_koreksi,

          verified_by_user_id:
            req.user.id_user

        },

        {

          where: {

            id_pohon: {
              [Op.in]:
                Array.isArray(selected_pohon)
                  ? selected_pohon
                  : [selected_pohon]
            }

          }

        }

      );

      res.redirect(`/admin-wilayah/verifikasi-pohon/${id_penanaman}`);

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }


static async approveMonitoring(req, res) {

  try {

    const {
      selected_monitoring,
      id_penanaman
    } = req.body;

    if (
      !selected_monitoring ||
      selected_monitoring.length === 0
    ) {

      return res.send(
        'Pilih minimal 1 monitoring'
      );

    }

    const selected =
      Array.isArray(selected_monitoring)
        ? selected_monitoring
        : [selected_monitoring];

    for (const item of selected) {

      const [
        id_monitoring,
        id_pohon
      ] = item.split('|');

      await DetailMonitoring.update(

        {
          status_verifikasi: 'disetujui',
          catatan_koreksi: null,
          verified_by_user_id:
            req.user.id_user
        },

        {
          where: {
            id_monitoring,
            id_pohon
          }
        }

      );

    }

    res.redirect(
      `/admin-wilayah/verifikasi-pohon/${id_penanaman}`
    );

  } catch (error) {

    console.log(error);
    res.send(error.message);

  }

}



  static async revisiMonitoring(req, res) {

    try {

      const {
        selected_monitoring,
        catatan_koreksi,
        id_penanaman
      } = req.body;

      if (
        !selected_monitoring ||
        selected_monitoring.length === 0
      ) {

        return res.send(
          'Pilih minimal 1 monitoring'
        );

      }

      const selectedData =
        Array.isArray(selected_monitoring)
          ? selected_monitoring
          : [selected_monitoring];

      for (const item of selectedData) {

        const [
          id_monitoring,
          id_pohon
        ] = item.split('|');

        await DetailMonitoring.update(

          {

            status_verifikasi:
              'revisi',

            catatan_koreksi,

            verified_by_user_id:
              req.user.id_user

          },

          {

            where: {

              id_monitoring,
              id_pohon

            }

          }

        );

      }

      res.redirect(
        `/admin-wilayah/verifikasi-pohon/${id_penanaman}`
      );

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }

}

module.exports = VerifikasiPohonController;