const { Monitoring, DetailMonitoring, Pohon } = require('../models');
const { Op } = require('sequelize');
const { deleteFile } = require('../utils/fileHelper');

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

      // VALIDASI FOTO
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


      const monitoringExist =
        await Monitoring.findOne({

          where: {
            tahap_monitoring
          }

        });

      let monitoring;

      if (!monitoringExist) {

        const id_monitoring =
          `MON${String(tahap_monitoring)
            .padStart(3, '0')}`;

        monitoring =
          await Monitoring.create({

            id_monitoring,
            tahap_monitoring,
            tgl_monitoring

          });

      } else {

        monitoring =
          monitoringExist;

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

        tinggi_pohon,
        diameter_pohon,
        kesehatan_batang,

        foto_monitoring:
          JSON.stringify(
            fotoMonitoring
          ),

        deskripsi,

        status,

        status_verifikasi:
          'menunggu'

      });

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

      let fotoBaru =
        fotoLama;



      if (
        req.files &&
        req.files.length > 0
      ) {

        // HAPUS FOTO LAMA
        fotoLama.forEach(file => {

          deleteFile(
            file,
            'monitoring'
          );

        });

        // SIMPAN FOTO BARU
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