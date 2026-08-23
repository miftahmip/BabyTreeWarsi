const {Donasi, Payment, ProgramDonasi, Penanaman, Pohon, DetailMonitoring, Monitoring} = require('../models');
const { fn, col } = require('sequelize');

class DonaturController {

  static async donasiSaya(req, res) {

    try {

      const donasiList =
        await Donasi.findAll({

          where: {
            id_user: req.user.id_user
          },

          include: [

            {
              model: ProgramDonasi,
              as: 'program'
            },

            {
              model: Payment,
              as: 'payments'
            }

          ],

          order: [
            ['createdAt', 'DESC']
          ]

        });

      // ==========================
      // Tentukan status efektif tiap Donasi
      // ==========================

      const donasiWithStatus =
        donasiList.map((donasi) => {

          const payments =
            donasi.payments || [];

          const settledPayment =
            payments.find(
              (p) => p.status === 'settlement'
            );

          if (settledPayment) {

            return {
              ...donasi.toJSON(),
              statusDonasi: 'settlement',
              activeOrderId: settledPayment.order_id,
              sudahPilihMetode: false
            };

          }

          // ==========================
          // Program sudah berakhir -- tidak bisa retry
          // ==========================

          if (
            donasi.program &&
            donasi.program.status_program === 'selesai'
          ) {

            return {
              ...donasi.toJSON(),
              statusDonasi: 'program_berakhir',
              activeOrderId: null,
              sudahPilihMetode: false
            };

          }

          const latestPayment =
            payments.sort(
              (a, b) =>
                new Date(b.created_at) -
                new Date(a.created_at)
            )[0];

          return {

            ...donasi.toJSON(),

            statusDonasi:
              latestPayment
                ? latestPayment.status
                : 'pending',

            activeOrderId:
              latestPayment
                ? latestPayment.order_id
                : null,

            // ==========================
            // Sudah pilih metode pembayaran
            // ==========================

            sudahPilihMetode:
              !!(
                latestPayment &&
                latestPayment.payment_channel
              )

          };

        });

      // ==========================
      // Group 1: Program yang sudah didukung
      // ==========================

      const programMap =
        new Map();

      donasiWithStatus

        .filter(
          (d) => d.statusDonasi === 'settlement'
        )

        .forEach((d) => {

          const key =
            d.program.id_program;

          if (!programMap.has(key)) {

            programMap.set(key, {

              program: d.program,

              total_pohon: 0

            });

          }

          programMap.get(key).total_pohon +=
            d.jumlah_pohon;

        });

      const programDidukung =
        Array.from(
          programMap.values()
        );

      // ==========================
      // Group 2: Transaksi yang perlu tindakan
      // ==========================

      const transaksiPerluTindakan =
        donasiWithStatus.filter(
          (d) => d.statusDonasi !== 'settlement'
        );

      res.render(
        'donatur/donasiSaya',
        {
          title: 'Donasi Saya',
          activePage: 'donasi-saya',
          programDidukung,
          transaksiPerluTindakan,
          user: req.user
        }
      );

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }


  // ====================================
  // DASHBOARD PROGRAM
  // ====================================

    static async dashboardProgram(req, res) {
      try {
        const { id } = req.params;

        const program = await ProgramDonasi.findByPk(id);
        if (!program) return res.send('Program tidak ditemukan');

        // Penanaman dalam program ini
        const penanaman = await Penanaman.findAll({ where: { id_program: id } });
        const idPenanaman = penanaman.map(item => item.id_penanaman);

        // Total pohon
        const totalPohon = await Pohon.count({ where: { id_penanaman: idPenanaman } });

        // Status pohon dari monitoring terakhir
        const semuaPohon = await Pohon.findAll({
          where: { id_penanaman: idPenanaman },
          include: [{
            model: DetailMonitoring,
            as: 'detailMonitoring',
            required: false,
            include: [{ model: Monitoring, as: 'monitoring' }]
          }]
        });

        let totalHidup = 0, totalMati = 0, totalBelumMonitoring = 0;
        semuaPohon.forEach(pohon => {
          const list = pohon.detailMonitoring || [];
          if (list.length === 0) { totalBelumMonitoring++; return; }
          const latest = list.sort((a, b) =>
            (b.monitoring?.tahap_monitoring || 0) - (a.monitoring?.tahap_monitoring || 0)
          )[0];
          if (latest.status === 'hidup') totalHidup++;
          else totalMati++;
        });

        // Progress per tahap monitoring
        const progressMonitoring = await Promise.all([1, 2, 3].map(async (tahap) => {
          const count = await DetailMonitoring.count({
            include: [
              { model: Pohon, as: 'pohon', where: { id_penanaman: idPenanaman } },
              { model: Monitoring, as: 'monitoring', where: { tahap_monitoring: tahap } }
            ]
          });
          return { tahap, count };
        }));

        // Dokumentasi terbaru
        const monitoring = await DetailMonitoring.findAll({
          include: [
            { model: Pohon, as: 'pohon', where: { id_penanaman: idPenanaman } },
            { model: Monitoring, as: 'monitoring' }
          ],
          order: [['createdAt', 'DESC']],
          limit: 6
        });

        const dokumentasi = monitoring.map(item => {
          let foto = [];
          try { foto = JSON.parse(item.foto_monitoring || '[]'); } catch { foto = []; }
          return {
            tahap: item.monitoring?.tahap_monitoring,
            tanggal: item.monitoring?.tgl_monitoring,
            foto
          };
        });

        const totalSudahMonitoring = totalHidup + totalMati;
        const survivalRate = totalSudahMonitoring > 0
          ? ((totalHidup / totalSudahMonitoring) * 100).toFixed(1)
          : 0;

        res.render('donatur/dashboardProgram', {
          title: 'Dashboard Program',
          activePage: 'donasi-saya',
          program,
          totalPohon,
          totalHidup,
          totalMati,
          totalBelumMonitoring,
          survivalRate,
          progressMonitoring,
          dokumentasi,
          user: req.user
        });

      } catch (error) {
        console.log(error);
        res.send(error.message);
      }
    }

}

module.exports = DonaturController;