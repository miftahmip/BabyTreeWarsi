const {Donasi, Payment, ProgramDonasi, Penanaman, Pohon, DetailMonitoring, Monitoring} = require('../models');
const { fn, col } = require('sequelize');

class DonaturController {

  static async donasiSaya(req, res) {

    try {

        const data =
        await Donasi.findAll({

            where: {
            id_user: req.user.id_user
            },

            attributes: [

            'id_program',

            [
                fn(
                'SUM',
                col('jumlah_pohon')
                ),
                'total_pohon'
            ]

            ],

            include: [

            {
                model: ProgramDonasi,
                as: 'program'
            },

            {
                model: Payment,
                as: 'payments',

                attributes: [],

                where: {
                status: 'settlement'
                }
            }

            ],

            group: [
            'id_program',
            'program.id_program'
            ],

            order: [['createdAt', 'DESC']]

        });

      res.render(
        'donatur/donasiSaya',
        {
          title: 'Donasi Saya',
          data,
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