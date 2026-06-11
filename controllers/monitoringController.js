const {Monitoring, DetailMonitoring, Pohon} = require('../models');
const { Op } = require('sequelize');
const {deleteFile} = require('../utils/fileHelper');

class MonitoringController {

  static async create(req, res) {

    try {

      const {
        id_pohon,
        tahap_monitoring,
        tgl_monitoring,
        tinggi_pohon,
        diameter_pohon,
        kesehatan_batang,
        deskripsi,
        status
      } = req.body;

      if (
        !req.files ||
        req.files.length === 0
      ) {

        return res.send(
          'Foto monitoring wajib diupload'
        );

      }

      const pohon =
        await Pohon.findByPk(id_pohon);

      if (!pohon) {

        return res.send(
          'Data pohon tidak ditemukan'
        );

      }

      // =========================
      // CEK APAKAH SUDAH MATI
      // =========================

      const monitoringMati =
        await DetailMonitoring.findOne({

          where: {
            id_pohon,
            status: 'mati'
          },

          include: [{
            model: Monitoring,
            as: 'monitoring',         // ← fix alias
            attributes: [
              'tahap_monitoring'
            ]
          }]

        });

      if (monitoringMati) {

        return res.send(
          `Pohon sudah mati pada monitoring ke-${monitoringMati.monitoring.tahap_monitoring}` // ← fix alias
        );

      }

      // =========================
      // CEK MASTER MONITORING
      // =========================

      let monitoring =
        await Monitoring.findOne({

          where: {
            tahap_monitoring
          }

        });

      if (!monitoring) {

        const id_monitoring =
          `MON${String(tahap_monitoring)
            .padStart(3, '0')}`;

        monitoring =
          await Monitoring.create({

            id_monitoring,
            tahap_monitoring,
            tgl_monitoring

          });

      }

      const detailExist =
        await DetailMonitoring.findOne({

          where: {

            id_monitoring:
              monitoring.id_monitoring,

            id_pohon

          }

        });

      if (detailExist) {

        return res.send(
          `Monitoring tahap ${tahap_monitoring} sudah ada`
        );

      }

      const fotoMonitoring =
        req.files.map(
          file => file.filename
        );

      await DetailMonitoring.create({

        id_monitoring:
          monitoring.id_monitoring,

        id_pohon,

        tinggi_pohon:
          tinggi_pohon || 0,

        diameter_pohon:
          diameter_pohon || 0,

        kesehatan_batang:
          kesehatan_batang || 'buruk',

        foto_monitoring:
          JSON.stringify(
            fotoMonitoring
          ),

        deskripsi,

        status,

        status_verifikasi:
          'menunggu'

      });

      // =========================
      // AUTO GENERATE JIKA MATI
      // =========================

      if (status === 'mati') {

        const tahapSekarang =
          Number(tahap_monitoring);

        for (
          let tahap = tahapSekarang + 1;
          tahap <= 3;
          tahap++
        ) {

          let monitoringNext =
            await Monitoring.findOne({

              where: {
                tahap_monitoring:
                  tahap
              }

            });

          if (!monitoringNext) {

            const idMonitoringBaru =
              `MON${String(tahap)
                .padStart(3, '0')}`;

            monitoringNext =
              await Monitoring.create({

                id_monitoring:
                  idMonitoringBaru,

                tahap_monitoring:
                  tahap,

                tgl_monitoring

              });

          }

          const detailNext =
            await DetailMonitoring.findOne({

              where: {

                id_monitoring:
                  monitoringNext.id_monitoring,

                id_pohon

              }

            });

          if (!detailNext) {

            await DetailMonitoring.create({

              id_monitoring:
                monitoringNext.id_monitoring,

              id_pohon,

              tinggi_pohon: 0,

              diameter_pohon: 0,

              kesehatan_batang:
                'sakit',

              foto_monitoring:
                JSON.stringify([]),

              deskripsi:
                `Pohon mati pada monitoring ke-${tahapSekarang}`,

              status:
                'mati',

              status_verifikasi:
                'menunggu'              // ← diubah dari 'disetujui'

            });

          }

        }

      }

      res.redirect(
        `/petugas-lapangan/pohon/detail/${id_pohon}`
      );

    } catch (error) {

      console.log(error);

      res.send(error.message);

    }

  }


  static async update(req, res) {

    try {

      const {
        id_monitoring,
        id_pohon
      } = req.params;

      const {
        tinggi_pohon,
        diameter_pohon,
        kesehatan_batang,
        deskripsi,
        status
      } = req.body;

      const detail =
        await DetailMonitoring.findOne({

          where: {
            id_monitoring,
            id_pohon
          }

        });

      if (!detail) {

        return res.send(
          'Data monitoring tidak ditemukan'
        );

      }

      let fotoLama = [];

      try {

        fotoLama =
          JSON.parse(
            detail.foto_monitoring || '[]'
          );

      } catch (error) {

        fotoLama = [];

      }

      let fotoBaru = fotoLama;

      if (
        req.files &&
        req.files.length > 0
      ) {

        fotoLama.forEach(file => {

          deleteFile(
            file,
            'monitoring'
          );

        });

        fotoBaru =
          req.files.map(
            file => file.filename
          );

      }

      await detail.update({

        tinggi_pohon,
        diameter_pohon,
        kesehatan_batang,

        foto_monitoring:
          JSON.stringify(
            fotoBaru
          ),

        deskripsi,

        status,

        status_verifikasi:
          'menunggu',

        catatan_koreksi:
          null,

        verified_by_user_id:
          null

      });

      // =========================
      // AUTO GENERATE JIKA MATI
      // =========================

      if (status === 'mati') {

        const monitoringSekarang =
          await Monitoring.findByPk(
            id_monitoring
          );

        const tahapSekarang =
          monitoringSekarang
            .tahap_monitoring;

        for (
          let tahap = tahapSekarang + 1;
          tahap <= 3;
          tahap++
        ) {

          let monitoringNext =
            await Monitoring.findOne({

              where: {
                tahap_monitoring:
                  tahap
              }

            });

          if (!monitoringNext) {

            const idMonitoringBaru =
              `MON${String(tahap)
                .padStart(3, '0')}`;

            monitoringNext =
              await Monitoring.create({

                id_monitoring:
                  idMonitoringBaru,

                tahap_monitoring:
                  tahap,

                tgl_monitoring:
                  monitoringSekarang
                    .tgl_monitoring

              });

          }

          const detailNext =
            await DetailMonitoring.findOne({

              where: {

                id_monitoring:
                  monitoringNext.id_monitoring,

                id_pohon

              }

            });

          if (!detailNext) {

            await DetailMonitoring.create({

              id_monitoring:
                monitoringNext.id_monitoring,

              id_pohon,

              tinggi_pohon: 0,

              diameter_pohon: 0,

              kesehatan_batang:
                'sakit',

              foto_monitoring:
                JSON.stringify([]),

              deskripsi:
                `Pohon mati pada monitoring ke-${tahapSekarang}`,

              status:
                'mati',

              status_verifikasi:
                'menunggu'              // ← diubah dari 'disetujui'

            });

          }

        }

      }

      res.redirect(
        `/petugas-lapangan/pohon/detail/${id_pohon}`
      );

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }

}

module.exports = MonitoringController;