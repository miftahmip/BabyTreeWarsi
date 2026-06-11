const {ProgramDonasi, Penanaman, Pohon, DetailMonitoring, Monitoring, Mitra, JenisPohon, sequelize} = require('../models');
const { Op } = require('sequelize');

class DashboardWilayahController {

  static async index(req, res) {

    try {

      const kodeProvinsi =
        req.user.kode_provinsi;

      // =========================
      // PROGRAM WILAYAH
      // =========================

      const totalProgram =
        await ProgramDonasi.count({

          where: {
            kode_provinsi: kodeProvinsi,
            status_program: 'selesai'
          }

        });



      // =========================
      // TOTAL PENANAMAN
      // =========================

      const totalPenanaman =
        await Penanaman.count({

          include: [
            {
              model: ProgramDonasi,
              as: 'program',

              where: {
                kode_provinsi: kodeProvinsi,
                status_program: 'selesai'
              }
            }
          ]

        });



      // =========================
      // TOTAL POHON
      // =========================

      const totalPohon =
        await Pohon.count({

          include: [
            {
              model: Penanaman,
              as: 'penanaman',

              include: [
                {
                  model: ProgramDonasi,
                  as: 'program',

                  where: {
                    kode_provinsi: kodeProvinsi,
                    status_program: 'selesai'
                  }
                }
              ]
            }
          ]

        });



      // =========================
      // POHON MENUNGGU VERIFIKASI
      // =========================

      const pohonPending =
        await Pohon.count({

          where: {
            status_verifikasi: 'menunggu'
          },

          include: [
            {
              model: Penanaman,
              as: 'penanaman',

              include: [
                {
                  model: ProgramDonasi,
                  as: 'program',

                  where: {
                    kode_provinsi: kodeProvinsi,
                    status_program: 'selesai'
                  }
                }
              ]
            }
          ]

        });



      // =========================
      // MONITORING MENUNGGU
      // =========================

      const monitoringPending =
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
                      model: ProgramDonasi,
                      as: 'program',

                      where: {
                        kode_provinsi: kodeProvinsi,
                        status_program: 'selesai'
                      }
                    }
                  ]
                }
              ]
            }
          ]

        });



      // =========================
      // TOTAL MITRA AKTIF
      // =========================

      const mitraAktif =
        await Pohon.findAll({

          attributes: [
            [
              sequelize.fn(
                'DISTINCT',
                sequelize.col('Pohon.id_mitra')
              ),
              'id_mitra'
            ]
          ],

          include: [
            {
              model: Penanaman,
              as: 'penanaman',

              attributes: [],

              include: [
                {
                  model: ProgramDonasi,
                  as: 'program',

                  attributes: [],

                  where: {
                    kode_provinsi: kodeProvinsi,
                    status_program: 'selesai'
                  }
                }
              ]
            }
          ],

          raw: true

        });



      // =========================
      // SURVIVAL RATE
      // =========================

      const monitoringData =
        await DetailMonitoring.findAll({

          include: [
            {
              model: Monitoring,
              as: 'monitoring'
            },
            {
              model: Pohon,
              as: 'pohon',

              include: [
                {
                  model: Penanaman,
                  as: 'penanaman',

                  include: [
                    {
                      model: ProgramDonasi,
                      as: 'program',

                      where: {
                        kode_provinsi: kodeProvinsi,
                        status_program: 'selesai'
                      }
                    }
                  ]
                }
              ]
            }
          ]

        });

      const latestMonitoring = {};

      monitoringData.forEach((item) => {

        const idPohon =
          item.id_pohon;

        const tahap =
          item.monitoring
            ?.tahap_monitoring || 0;

        if (
          !latestMonitoring[idPohon] ||
          tahap >
          latestMonitoring[idPohon]
            .monitoring
            .tahap_monitoring
        ) {

          latestMonitoring[idPohon] =
            item;

        }

      });

      let hidup = 0;
      let mati = 0;

      Object.values(latestMonitoring)
        .forEach((item) => {

          if (item.status === 'hidup') {
            hidup++;
          } else {
            mati++;
          }

        });

      const totalMonitoring =
        hidup + mati;

      const survivalRate =
        totalMonitoring > 0
        ? (
            (hidup / totalMonitoring) * 100
          ).toFixed(1)
        : 0;



      // =========================
      // CHART VERIFIKASI POHON
      // =========================

      const verifikasiPohon =
        await Pohon.findAll({

          attributes: [
            'status_verifikasi',
            [
              sequelize.fn(
                'COUNT',
                sequelize.col('id_pohon')
              ),
              'total'
            ]
          ],

          include: [
            {
              model: Penanaman,
              as: 'penanaman',

              attributes: [],

              include: [
                {
                  model: ProgramDonasi,
                  as: 'program',

                  attributes: [],

                  where: {
                    kode_provinsi: kodeProvinsi,
                    status_program: 'selesai'
                  }
                }
              ]
            }
          ],

          group: ['status_verifikasi'],
          raw: true

        });



      // =========================
      // CHART MONITORING TAHAP
      // =========================

      const monitoringTahap =
        await Monitoring.findAll({

          attributes: [
            'tahap_monitoring',
            [
              sequelize.fn(
                'COUNT',
                sequelize.col(
                  'detailMonitoring.id_pohon'
                )
              ),
              'total'
            ]
          ],

          include: [
            {
              model: DetailMonitoring,
              as: 'detailMonitoring',

              attributes: [],

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
                          model: ProgramDonasi,
                          as: 'program',

                          attributes: [],

                          where: {
                            kode_provinsi:
                              kodeProvinsi,

                            status_program:
                              'selesai'
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ],

          group: ['Monitoring.id_monitoring'],
          raw: true

        });



      // =========================
      // CHART JENIS POHON
      // =========================

      const jenisPohonChart =
        await JenisPohon.findAll({

          attributes: [
            'nama_pohon',
            [
              sequelize.fn(
                'COUNT',
                sequelize.col('pohon.id_pohon')
              ),
              'total'
            ]
          ],

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
                      model: ProgramDonasi,
                      as: 'program',

                      attributes: [],

                      where: {
                        kode_provinsi:
                          kodeProvinsi,

                        status_program:
                          'selesai'
                      }
                    }
                  ]
                }
              ]
            }
          ],

          group: ['JenisPohon.id_jenis_pohon'],
          raw: true

        });



      // =========================
      // MONITORING TERBARU
      // =========================

      const monitoringTerbaru =
        await DetailMonitoring.findAll({

          limit: 5,

          order: [['createdAt', 'DESC']],

          include: [
            {
              model: Monitoring,
              as: 'monitoring'
            },
            {
              model: Pohon,
              as: 'pohon',

              include: [
                {
                  model: Penanaman,
                  as: 'penanaman',

                  include: [
                    {
                      model: ProgramDonasi,
                      as: 'program',

                      where: {
                        kode_provinsi:
                          kodeProvinsi,

                        status_program:
                          'selesai'
                      }
                    }
                  ]
                }
              ]
            }
          ]

        });



      // =========================
      // POHON PENDING TERBARU
      // =========================

      const pohonPendingList =
        await Pohon.findAll({

          where: {
            status_verifikasi: 'menunggu'
          },

          limit: 5,

          order: [['createdAt', 'DESC']],

          include: [
            {
              model: Penanaman,
              as: 'penanaman',

              include: [
                {
                  model: ProgramDonasi,
                  as: 'program',

                  where: {
                    kode_provinsi:
                      kodeProvinsi,

                    status_program:
                      'selesai'
                  }
                }
              ]
            }
          ]

        });



      // =========================
      // RENDER
      // =========================

      res.render(
        'admin-wilayah/dashboard',
        {
          title: 'Dashboard Admin Wilayah',
          user: req.user,
          activePage: 'dashboard',

          totalProgram,
          totalPenanaman,
          totalPohon,

          pohonPending,
          monitoringPending,

          survivalRate,

          totalMitraAktif:
            mitraAktif.length,

          hidup,
          mati,

          verifikasiPohon,
          monitoringTahap,
          jenisPohonChart,

          monitoringTerbaru,
          pohonPendingList
        }
      );

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }

}

module.exports = DashboardWilayahController;