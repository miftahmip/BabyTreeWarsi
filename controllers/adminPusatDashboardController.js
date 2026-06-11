const {ProgramDonasi, Donasi, Payment, Pohon, User, JenisPohon, Penanaman,sequelize} = require('../models');
const { Op } = require('sequelize');
const WilayahService = require('../services/wilayahService');

class AdminPusatDashboardController {

  static async dashboard(req, res) {

    try {


      const tahun =
        req.query.tahun ||
        new Date().getFullYear();


      const {
        kode_provinsi,
        kode_kbp_kota,
        kode_kecamatan,
        kode_kelurahan
      } = req.query;


      const totalProgram =
        await ProgramDonasi.count();

      const programAktif =
        await ProgramDonasi.count({

          where: {
            status_program: 'aktif'
          }

        });

      const totalPohon =
        await Pohon.count();

      const totalDonatur =
        await Donasi.count({

          distinct: true,
          col: 'id_user'

        });

      const totalCorporate =
        await Donasi.count({

          distinct: true,

          col: 'id_user',

          include: [
            {
              model: User,
              as: 'user',

              where: {
                role:
                  'donatur_corporate'
              },

              attributes: []
            }
          ]

        });

      const totalProvinsiAktif =
        await ProgramDonasi.count({

          distinct: true,
          col: 'kode_provinsi'

        });

      const paymentSettlement =
        await Payment.findAll({

          where: {
            status: 'settlement'
          }

        });

      const totalDonasiBerhasil =
        paymentSettlement.length;

      const totalDanaNasional =
        paymentSettlement.reduce(
          (sum, item) => {

            return (
              sum +
              Number(item.gross_amount)
            );

          },
          0
        );


      const donasiBulananRaw =
        await Payment.findAll({

          where: {

            status: 'settlement',

            settlement_time: {
              [Op.ne]: null
            },

            [Op.and]:
              sequelize.where(

                sequelize.fn(
                  'YEAR',
                  sequelize.col(
                    'settlement_time'
                  )
                ),

                tahun

              )

          },

          attributes: [

            [
              sequelize.fn(
                'MONTH',
                sequelize.col(
                  'settlement_time'
                )
              ),
              'bulan'
            ],

            [
              sequelize.fn(
                'SUM',
                sequelize.col(
                  'gross_amount'
                )
              ),
              'total'
            ]

          ],

          group: [

            sequelize.fn(
              'MONTH',
              sequelize.col(
                'settlement_time'
              )
            )

          ],

          order: [

            [
              sequelize.fn(
                'MONTH',
                sequelize.col(
                  'settlement_time'
                )
              ),
              'ASC'
            ]

          ]

        });

      const namaBulan = [

        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des'

      ];

      const donasiBulanan =
        namaBulan.map(
          (bulan, index) => {

            const found =
              donasiBulananRaw.find(
                item =>

                  Number(
                    item.dataValues.bulan
                  ) === index + 1
              );

            return {

              bulan,

              total:
                found
                ? Number(
                    found.dataValues.total
                  )
                : 0

            };

          }
        );


      const topCorporate =
        await Donasi.findAll({

          attributes: [

            'id_user',

            [
              sequelize.fn(
                'SUM',
                sequelize.col(
                  'jumlah_pohon'
                )
              ),
              'total_pohon'
            ],

            [
              sequelize.fn(
                'SUM',
                sequelize.col(
                  'nominal_donasi'
                )
              ),
              'total_donasi'
            ]

          ],

          include: [

            {
              model: User,
              as: 'user',

              where: {
                role:
                  'donatur_corporate'
              },

              attributes: [
                'nama_lengkap'
              ]
            },

            {
              model: Payment,
              as: 'payments',

              where: {
                status: 'settlement'
              },

              attributes: []
            }

          ],

          group: [
            'id_user',
            'user.id_user'
          ],

          order: [
            [
              sequelize.literal(
                'total_pohon'
              ),
              'DESC'
            ]
          ],

          limit: 5

        });


      const jenisPohonChart =
        await JenisPohon.findAll({

          attributes: [

            'nama_pohon',

            [
              sequelize.fn(
                'COUNT',
                sequelize.col(
                  'pohon.id_pohon'
                )
              ),
              'total'
            ]

          ],

          include: [
            {
              model: Pohon,
              as: 'pohon',
              attributes: []
            }
          ],

          group: [
            'JenisPohon.id_jenis_pohon'
          ],

          order: [
            [
              sequelize.literal(
                'total'
              ),
              'DESC'
            ]
          ]

        });


      const whereWilayah = {};

      if (kode_provinsi) {
        whereWilayah.kode_provinsi =
          kode_provinsi;
      }

      if (kode_kbp_kota) {
        whereWilayah.kode_kbp_kota =
          kode_kbp_kota;
      }

      if (kode_kecamatan) {
        whereWilayah.kode_kecamatan =
          kode_kecamatan;
      }

      if (kode_kelurahan) {
        whereWilayah.kode_kelurahan =
          kode_kelurahan;
      }

      let groupField =
        'kode_provinsi';

      let wilayahType =
        'provinsi';

      if (
        kode_provinsi &&
        !kode_kbp_kota
      ) {

        groupField =
          'kode_kbp_kota';

        wilayahType =
          'kabupaten';

      }

      else if (
        kode_kbp_kota &&
        !kode_kecamatan
      ) {

        groupField =
          'kode_kecamatan';

        wilayahType =
          'kecamatan';

      }

      else if (
        kode_kecamatan &&
        !kode_kelurahan
      ) {

        groupField =
          'kode_kelurahan';

        wilayahType =
          'kelurahan';

      }

      const wilayahChartRaw =
        await ProgramDonasi.findAll({

          attributes: [

            groupField,

            [
              sequelize.fn(
                'COUNT',
                sequelize.col(
                  'penanaman->pohon.id_pohon'
                )
              ),
              'total_pohon'
            ]

          ],

          include: [
            {
              model: Penanaman,
              as: 'penanaman',

              attributes: [],

              include: [
                {
                  model: Pohon,
                  as: 'pohon',

                  attributes: []
                }
              ]
            }
          ],

          where: whereWilayah,

          group: [groupField],

          raw: true

        });

      const wilayahChart =
        await Promise.all(

          wilayahChartRaw.map(
            async (item) => {

              let namaWilayah = '-';

              if (
                wilayahType === 'provinsi'
              ) {

                const wilayah =
                  await WilayahService
                    .mapWilayah({
                      kode_provinsi:
                        item.kode_provinsi
                    });

                namaWilayah =
                  wilayah.nama_provinsi;
              }

              else if (
                wilayahType === 'kabupaten'
              ) {

                const wilayah =
                  await WilayahService
                    .mapWilayah({
                      kode_provinsi,
                      kode_kbp_kota:
                        item.kode_kbp_kota
                    });

                namaWilayah =
                  wilayah.nama_kbp_kota;
              }

              else if (
                wilayahType === 'kecamatan'
              ) {

                const wilayah =
                  await WilayahService
                    .mapWilayah({
                      kode_provinsi,
                      kode_kbp_kota,
                      kode_kecamatan:
                        item.kode_kecamatan
                    });

                namaWilayah =
                  wilayah.nama_kecamatan;
              }

              else {

                const wilayah =
                  await WilayahService
                    .mapWilayah({
                      kode_provinsi,
                      kode_kbp_kota,
                      kode_kecamatan,
                      kode_kelurahan:
                        item.kode_kelurahan
                    });

                namaWilayah =
                  wilayah.nama_kelurahan;
              }

              return {

                wilayah:
                  namaWilayah,

                total:
                  Number(
                    item.total_pohon
                  )

              };

            }
          )

        );


      const programTerbaru =
        await ProgramDonasi.findAll({

          limit: 5,

          order: [
            ['createdAt', 'DESC']
          ]

        });

      const programTerbaruMapped =
        await Promise.all(

          programTerbaru.map(
            async (item) => {

              return await
                WilayahService
                  .mapWilayah(
                    item.toJSON()
                  );

            }
          )

        );


      const donasiTerbaru =
        await Donasi.findAll({

          include: [

            {
              model: User,
              as: 'user',

              attributes: [
                'nama_lengkap',
                'role'
              ]
            },

            {
              model: ProgramDonasi,
              as: 'program',

              attributes: [
                'judul_program'
              ]
            },

            {
              model: Payment,
              as: 'payments',

              where: {
                status: 'settlement'
              },

              attributes: []
            }

          ],

          limit: 5,

          order: [
            ['tanggal_donasi', 'DESC']
          ]

        });


      const provinces =
        await WilayahService
          .getProvinces();

      let regencies = [];
      let districts = [];
      let villages = [];

      if (kode_provinsi) {

        regencies =
          await WilayahService
            .getRegencies(
              kode_provinsi
            );

      }

      if (kode_kbp_kota) {

        districts =
          await WilayahService
            .getDistricts(
              kode_kbp_kota
            );

      }

      if (kode_kecamatan) {

        villages =
          await WilayahService
            .getVillages(
              kode_kecamatan
            );

      }


      res.render(
        'admin-pusat/dashboard',
        {

          title:
            'Dashboard Admin Pusat',
          activePage: 'dashboard',
          user: req.user,

          // summary
          totalProgram,
          programAktif,
          totalPohon,
          totalDonatur,
          totalCorporate,
          totalProvinsiAktif,
          totalDonasiBerhasil,
          totalDanaNasional,

          // chart
          donasiBulanan,
          topCorporate,
          jenisPohonChart,
          wilayahChart,
          wilayahType,

          // table
          programTerbaru:
            programTerbaruMapped,

          donasiTerbaru,

          // filter chart wilayah
          provinces,
          regencies,
          districts,
          villages,

          selectedProvinsi:
            kode_provinsi,

          selectedKota:
            kode_kbp_kota,

          selectedKecamatan:
            kode_kecamatan,

          selectedKelurahan:
            kode_kelurahan,

          tahun

        }
      );

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }

}

module.exports = AdminPusatDashboardController;