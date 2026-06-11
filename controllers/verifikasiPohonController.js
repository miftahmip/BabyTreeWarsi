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
  // HALAMAN LIST VERIFIKASI
  // =================================================
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
              as: 'pohon',
              include: [
                {
                  model: DetailMonitoring,
                  as: 'detailMonitoring',
                  attributes: [
                    'status_verifikasi'
                  ],
                  include: [
                    {
                      model: Monitoring,
                      as: 'monitoring',
                      attributes: [
                        'tahap_monitoring'
                      ]
                    }
                  ]
                }
              ]
            }

          ],

          order: [
            ['createdAt', 'DESC']
          ]

        });

      const data =
        await Promise.all(

          penanaman.map(async item => {

            const wilayah =
              await WilayahService.mapWilayah(
                item.program.dataValues
              );

            // Hitung overallStatus per pohon
            // lalu agregat untuk kartu penanaman
            const pohonDenganStatus =
              item.pohon.map(pohon => {

                const monList =
                  pohon.detailMonitoring || [];

                const monSorted =
                  [...monList].sort((a, b) => {
                    const tA = Number(
                      a.monitoring?.tahap_monitoring || 0
                    );
                    const tB = Number(
                      b.monitoring?.tahap_monitoring || 0
                    );
                    return tB - tA;
                  });

                let overallStatus =
                  pohon.status_verifikasi;
                let overallTahap = null;

                const monRevisi =
                  monSorted.find(
                    m => m.status_verifikasi === 'revisi'
                  );

                const monMenunggu =
                  monSorted.find(
                    m => m.status_verifikasi === 'menunggu'
                  );

                if (monRevisi) {

                  overallStatus = 'revisi';
                  overallTahap  =
                    `Monitoring ${monRevisi.monitoring?.tahap_monitoring}`;

                } else if (monMenunggu) {

                  overallStatus = 'menunggu';
                  overallTahap  =
                    `Monitoring ${monMenunggu.monitoring?.tahap_monitoring}`;

                } else if (
                  pohon.status_verifikasi === 'revisi'
                ) {

                  overallStatus = 'revisi';
                  overallTahap  = 'Data Penanaman';

                } else if (
                  pohon.status_verifikasi === 'menunggu'
                ) {

                  overallStatus = 'menunggu';
                  overallTahap  = 'Data Penanaman';

                } else if (
                  pohon.status_verifikasi === 'disetujui' &&
                  monList.length === 0
                ) {

                  overallStatus = 'disetujui';
                  overallTahap  = 'Data Penanaman';

                } else if (
                  pohon.status_verifikasi === 'disetujui' &&
                  monList.length > 0
                ) {

                  const monDisetujui =
                    monSorted.find(
                      m => m.status_verifikasi === 'disetujui'
                    );

                  overallStatus = 'disetujui';
                  overallTahap  = monDisetujui
                    ? `Monitoring ${monDisetujui.monitoring?.tahap_monitoring}`
                    : 'Data Penanaman';

                }

                return {
                  ...pohon.toJSON(),
                  overallStatus,
                  overallTahap
                };

              });

            const totalVerifikasi =
              pohonDenganStatus.filter(
                p => p.overallStatus === 'disetujui'
              ).length;

            const totalMenunggu =
              pohonDenganStatus.filter(
                p =>
                  p.overallStatus === 'menunggu' ||
                  p.overallStatus === 'revisi'
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
          activePage: 'verifikasi',
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
  static async detail(req, res) {

    try {

      const { id_penanaman } =
        req.params;

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

          if (tahap === 1) monitoring1.push(item);
          if (tahap === 2) monitoring2.push(item);
          if (tahap === 3) monitoring3.push(item);

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
          activePage: 'verifikasi',
          user: req.user
        }
      );

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }


  // =================================================
  // APPROVE MASSAL POHON
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
          status_verifikasi: 'disetujui',
          catatan_koreksi: null,
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

      res.redirect(
        `/admin-wilayah/verifikasi-pohon/${id_penanaman}`
      );

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }


  // =================================================
  // REVISI MASSAL POHON
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
          status_verifikasi: 'revisi',
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

      res.redirect(
        `/admin-wilayah/verifikasi-pohon/${id_penanaman}`
      );

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }


  // =================================================
  // APPROVE MONITORING
  // =================================================
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

        // Approve monitoring yang dipilih
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

        // =============================================
        // PROPAGASI KE AUTO-GENERATED JIKA POHON MATI
        // =============================================

        // Cek apakah monitoring yang di-approve ini
        // statusnya mati
        const detailDiapprove =
          await DetailMonitoring.findOne({
            where: {
              id_monitoring,
              id_pohon
            }
          });

        if (
          detailDiapprove &&
          detailDiapprove.status === 'mati'
        ) {

          // Ambil tahap monitoring ini
          const monitoringIni =
            await Monitoring.findByPk(
              id_monitoring
            );

          const tahapIni =
            monitoringIni.tahap_monitoring;

          // Update semua auto-generated di tahap
          // berikutnya (yang foto kosong = auto)
          for (
            let tahap = tahapIni + 1;
            tahap <= 3;
            tahap++
          ) {

            const monitoringNext =
              await Monitoring.findOne({
                where: {
                  tahap_monitoring: tahap
                }
              });

            if (!monitoringNext) continue;

            // Cek apakah record ini auto-generated
            // (status mati + foto kosong)
            const detailNext =
              await DetailMonitoring.findOne({
                where: {
                  id_monitoring:
                    monitoringNext.id_monitoring,
                  id_pohon
                }
              });

            if (!detailNext) continue;

            let fotoArr = [];
            try {
              fotoArr = JSON.parse(
                detailNext.foto_monitoring || '[]'
              );
            } catch (e) {}

            const isAutoGenerated =
              detailNext.status === 'mati' &&
              fotoArr.length === 0;

            if (isAutoGenerated) {

              await detailNext.update({
                status_verifikasi: 'disetujui',
                catatan_koreksi: null,
                verified_by_user_id:
                  req.user.id_user
              });

            }

          }

        }

      }

      res.redirect(
        `/admin-wilayah/verifikasi-pohon/${id_penanaman}`
      );

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }


  // =================================================
  // REVISI MONITORING
  // =================================================
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

        // Revisi monitoring yang dipilih
        await DetailMonitoring.update(

          {
            status_verifikasi: 'revisi',
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

        // =============================================
        // PROPAGASI KE AUTO-GENERATED JIKA POHON MATI
        // =============================================

        const detailDirevisi =
          await DetailMonitoring.findOne({
            where: {
              id_monitoring,
              id_pohon
            }
          });

        if (
          detailDirevisi &&
          detailDirevisi.status === 'mati'
        ) {

          const monitoringIni =
            await Monitoring.findByPk(
              id_monitoring
            );

          const tahapIni =
            monitoringIni.tahap_monitoring;

          for (
            let tahap = tahapIni + 1;
            tahap <= 3;
            tahap++
          ) {

            const monitoringNext =
              await Monitoring.findOne({
                where: {
                  tahap_monitoring: tahap
                }
              });

            if (!monitoringNext) continue;

            const detailNext =
              await DetailMonitoring.findOne({
                where: {
                  id_monitoring:
                    monitoringNext.id_monitoring,
                  id_pohon
                }
              });

            if (!detailNext) continue;

            let fotoArr = [];
            try {
              fotoArr = JSON.parse(
                detailNext.foto_monitoring || '[]'
              );
            } catch (e) {}

            const isAutoGenerated =
              detailNext.status === 'mati' &&
              fotoArr.length === 0;

            if (isAutoGenerated) {

              await detailNext.update({
                status_verifikasi: 'revisi',
                catatan_koreksi:
                  `Mengikuti revisi monitoring ke-${tahapIni}`,
                verified_by_user_id:
                  req.user.id_user
              });

            }

          }

        }

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