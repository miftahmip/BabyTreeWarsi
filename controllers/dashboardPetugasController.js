const {DetailPenanaman, Penanaman, ProgramDonasi, Pohon, DetailMonitoring, Monitoring, Mitra} = require('../models');
const { Op } = require('sequelize');
const { fn, col } = require('sequelize');

class DashboardPetugasController {

  static async index(req, res) {

    try {

      // ====================================
      // PENUGASAN AKTIF
      // ====================================

      const penugasanAktif =
        await DetailPenanaman.count({

          where: {
            id_user: req.user.id_user
          },

          include: [
            {
              model: Penanaman,
              as: 'penanaman',

              where: {
                status_penanaman: 'aktif'
              }
            }
          ]
        });


      // ====================================
      // TOTAL POHON
      // ====================================

      const totalPohon =
        await Pohon.count({

          include: [
            {
              model: Penanaman,
              as: 'penanaman',

              include: [
                {
                  model: DetailPenanaman,
                  as: 'detailPenanaman',

                  where: {
                    id_user: req.user.id_user
                  }
                }
              ]
            }
          ]
        });


      // ====================================
      // TOTAL MITRA
      // ====================================

      const totalMitra =
        await Mitra.count();


      // ====================================
      // DATA POHON DITOLAK
      // ====================================

      const pohonDitolak =
        await Pohon.count({

          where: {
            status_verifikasi: 'revisi'
          },

          include: [
            {
              model: Penanaman,
              as: 'penanaman',

              include: [
                {
                  model: DetailPenanaman,
                  as: 'detailPenanaman',

                  where: {
                    id_user: req.user.id_user
                  }
                }
              ]
            }
          ]
        });


      // ====================================
      // MONITORING DITOLAK
      // ====================================
      const monitoringDitolak =
        await DetailMonitoring.count({

          where: {
            status_verifikasi: 'ditolak'
          },

          include: [
            {
              model: Pohon,
              as: 'pohon',

              include: [
                {
                  model: Penanaman,
                  as: 'penanaman',

                  include: [
                    {
                      model: DetailPenanaman,
                      as: 'detailPenanaman',

                      where: {
                        id_user: req.user.id_user
                      }
                    }
                  ]
                }
              ]
            }
          ]
        });


      // ====================================
      // PENUGASAN TERBARU
      // ====================================

      const penugasanTerbaru =
        await DetailPenanaman.findAll({

          where: {
            id_user: req.user.id_user
          },

          include: [
            {
              model: Penanaman,
              as: 'penanaman',

              include: [
                {
                  model: ProgramDonasi,
                  as: 'program'
                }
              ]
            }
          ],

          order: [['createdAt', 'DESC']],

          limit: 5
        });


      // ====================================
      // MONITORING MENUNGGU
      // ====================================

      const monitoringMenunggu =
        await DetailMonitoring.count({

          where: {
            status_verifikasi: 'menunggu'
          },

          include: [
            {
              model: Pohon,
              as: 'pohon',

              include: [
                {
                  model: Penanaman,
                  as: 'penanaman',

                  include: [
                    {
                      model: DetailPenanaman,
                      as: 'detailPenanaman',

                      where: {
                        id_user: req.user.id_user
                      }
                    }
                  ]
                }
              ]
            }
          ]
        });

        const daftarPohonRevisi =
        await Pohon.findAll({

            attributes: [

            'id_penanaman',

            [
                fn('COUNT', col('id_pohon')),
                'total_revisi'
            ]
            ],

            where: {
            status_verifikasi: 'revisi'
            },

            include: [
            {
                model: Penanaman,
                as: 'penanaman',

                attributes: ['id_penanaman'],

                include: [
                {
                    model: DetailPenanaman,
                    as: 'detailPenanaman',

                    where: {
                    id_user: req.user.id_user
                    },

                    attributes: []
                }
                ]
            }
            ],

            group: ['id_penanaman']
        });

    const daftarMonitoringRevisi =
        await DetailMonitoring.findAll({

            attributes: [

            [col('pohon.id_penanaman'), 'id_penanaman'],

            [
                fn('COUNT', col('DetailMonitoring.id_pohon')),
                'total_revisi'
            ]
            ],

            where: {
            status_verifikasi: 'revisi'
            },

            include: [
            {
                model: Pohon,
                as: 'pohon',

                attributes: [],

                include: [
                {
                    model: Penanaman,
                    as: 'penanaman',

                    attributes: [],

                    include: [
                    {
                        model: DetailPenanaman,
                        as: 'detailPenanaman',

                        where: {
                        id_user: req.user.id_user
                        },

                        attributes: []
                    }
                    ]
                }
                ]
            }
            ],

            group: ['pohon.id_penanaman']
        });


      res.render(
        'petugas-lapangan/dashboard',
        {
          title: 'Dashboard Petugas Lapangan',

          user: req.user,

          penugasanAktif,
          daftarPohonRevisi,
          totalPohon,
          totalMitra,
          monitoringDitolak,
          pohonDitolak,
          daftarMonitoringRevisi,
          monitoringMenunggu,
          penugasanTerbaru
        }
      );

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }

}

module.exports = DashboardPetugasController;