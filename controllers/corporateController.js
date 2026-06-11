const PDFDocument = require('pdfkit');
const {Donasi, DonasiPohon, Pohon, ProgramDonasi, DetailMonitoring, Monitoring, Penanaman} = require('../models');
const WilayahService = require('../services/wilayahService');

class CorporateController {

  static async donasiSaya(req, res) {

    try {

      const data =
        await Donasi.findAll({

          where: {
            id_user: req.user.id_user
          },

          include: [
            {
              model: ProgramDonasi,
              as: 'program'
            }
          ],

          order: [['createdAt', 'DESC']]
        });

      const result =
        await Promise.all(

          data.map(async (item) => {

            const json =
              item.toJSON();

            json.program =
              await WilayahService.mapWilayah(
                json.program
              );

            return json;

          })

        );

      res.render(
        'corporate/donasi-saya',
        {
          title: 'Donasi Saya',
          data: result,
          user: req.user
        }
      );

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }


    static async dashboardProgram(req, res) {
        try {
            const { id } = req.params;

            const donasi = await Donasi.findOne({
            where: { id_donasi: id, id_user: req.user.id_user },
            include: [{ model: ProgramDonasi, as: 'program' }]
            });

            if (!donasi) return res.send('Donasi tidak ditemukan');

            const program = await WilayahService.mapWilayah(donasi.program.toJSON());

            const dataPohon = await DonasiPohon.findAll({
            where: { id_donasi: id },
            include: [{
                model: Pohon,
                as: 'pohon',
                include: [
                {
                    model: Penanaman,
                    as: 'penanaman',
                    include: [{ model: ProgramDonasi, as: 'program' }]
                },
                {
                    model: DetailMonitoring,
                    as: 'detailMonitoring',
                    include: [{ model: Monitoring, as: 'monitoring' }]
                }
                ]
            }]
            });

            const totalPohon = dataPohon.length;
            let pohonHidup = 0;
            let pohonMati = 0;
            const monitoringChart = {};
            let galleryMonitoring = [];

            dataPohon.forEach(item => {
            const pohon = item.pohon;
            if (!pohon || pohon.detailMonitoring.length === 0) return;

            const monitoringSorted = pohon.detailMonitoring.sort(
                (a, b) => b.monitoring.tahap_monitoring - a.monitoring.tahap_monitoring
            );

            const latest = monitoringSorted[0];

            if (latest.status === 'hidup') pohonHidup++;
            else pohonMati++;

            const tahap = latest.monitoring.tahap_monitoring;
            if (!monitoringChart[tahap]) monitoringChart[tahap] = { hidup: 0, mati: 0 };
            if (latest.status === 'hidup') monitoringChart[tahap].hidup++;
            else monitoringChart[tahap].mati++;

            monitoringSorted.forEach(m => {
                let foto = [];
                try { foto = JSON.parse(m.foto_monitoring || '[]'); } catch { foto = []; }
                foto.forEach(img => {
                galleryMonitoring.push({
                    gambar: img,
                    tahap: m.monitoring.tahap_monitoring,
                    tanggal: m.monitoring.tgl_monitoring,
                    status: m.status,
                    pohon: pohon.id_pohon
                });
                });
            });
            });

            // Progress per tahap
            const progressTahap = [1, 2, 3].map(tahap => {
            let count = 0;
            dataPohon.forEach(item => {
                const hasTahap = item.pohon?.detailMonitoring?.some(
                m => m.monitoring?.tahap_monitoring === tahap
                );
                if (hasTahap) count++;
            });
            return { tahap, count };
            });

            const pohonBelumMonitoring = totalPohon - (pohonHidup + pohonMati);
            const totalSudahMonitoring = pohonHidup + pohonMati;
            const survivalRate = totalSudahMonitoring > 0
            ? ((pohonHidup / totalSudahMonitoring) * 100).toFixed(1)
            : 0;

            galleryMonitoring = galleryMonitoring.slice(0, 20);

            res.render('corporate/dashboard-program', {
            title: 'Dashboard Program Corporate',
            user: req.user,
            donasi,
            program,
            totalPohon,
            pohonHidup,
            pohonMati,
            pohonBelumMonitoring,
            survivalRate,
            monitoringChart,
            progressTahap,
            galleryMonitoring
            });

        } catch (error) {
            console.log(error);
            res.send(error.message);
        }
    }


  static async exportCSR(req, res) {

    try {

      const { id } =
        req.params;

      const donasi =
        await Donasi.findOne({

          where: {
            id_donasi: id,
            id_user: req.user.id_user
          },

          include: [
            {
              model: ProgramDonasi,
              as: 'program'
            }
          ]
        });

      if (!donasi) {

        return res.send(
          'Donasi tidak ditemukan'
        );

      }

      const dataPohon =
        await DonasiPohon.findAll({

          where: {
            id_donasi: id
          },

          include: [
            {
              model: Pohon,
              as: 'pohon',

              include: [
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
              ]
            }
          ]
        });

      let hidup = 0;
      let mati = 0;

      dataPohon.forEach((item) => {

        const monitoring =
          item.pohon.detailMonitoring;

        if (monitoring.length > 0) {

          const latest =
            monitoring.sort(
              (a, b) => {

                return (
                  b.monitoring
                    .tahap_monitoring -
                  a.monitoring
                    .tahap_monitoring
                );

              }
            )[0];

          if (latest.status === 'hidup') {
            hidup++;
          } else {
            mati++;
          }

        }

      });

      const total =
        dataPohon.length;

      const survival =
        total > 0
        ? (
            (hidup / total) * 100
          ).toFixed(1)
        : 0;

      // PDF
      const doc =
        new PDFDocument();

      res.setHeader(
        'Content-Type',
        'application/pdf'
      );

      res.setHeader(
        'Content-Disposition',
        `inline; filename=csr-report.pdf`
      );

      doc.pipe(res);

      doc.fontSize(20)
        .text(
          'Laporan CSR Penanaman Pohon',
          {
            align: 'center'
          }
        );

      doc.moveDown();

      doc.fontSize(14)
        .text(
          `Program: ${donasi.program.judul_program}`
        );

      doc.text(
        `Total Pohon: ${total}`
      );

      doc.text(
        `Pohon Hidup: ${hidup}`
      );

      doc.text(
        `Pohon Mati: ${mati}`
      );

      doc.text(
        `Survival Rate: ${survival}%`
      );

      doc.moveDown();

      doc.text(
        'Terima kasih telah berkontribusi dalam penghijauan lingkungan.'
      );

      doc.end();

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }


}

module.exports = CorporateController;