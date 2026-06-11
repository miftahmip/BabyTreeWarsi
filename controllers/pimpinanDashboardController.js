const {
  ProgramDonasi,
  Donasi,
  Payment,
  Pohon,
  User,
  JenisPohon,
  Penanaman,
  sequelize
} = require('../models');

const { Op } = require('sequelize');
const WilayahService = require('../services/wilayahService');

class PimpinanDashboardController {

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

      // ======================================================
      // SUMMARY CARD
      // ======================================================

      const totalProgram =
        await ProgramDonasi.count();

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
              where: { role: 'donatur_corporate' },
              attributes: []
            }
          ]
        });

      const totalProvinsiAktif =
        await ProgramDonasi.count({
          distinct: true,
          col: 'kode_provinsi'
        });

      const totalDanaNasionalRaw =
        await Payment.findAll({
          where: { status: 'settlement' },
          attributes: ['gross_amount']
        });

      const totalDanaNasional =
        totalDanaNasionalRaw.reduce(
          (sum, item) =>
            sum + Number(item.gross_amount),
          0
        );

      // ======================================================
      // GRAFIK DONASI BULANAN
      // ======================================================

      const donasiBulananRaw =
        await Payment.findAll({
          where: {
            status: 'settlement',
            settlement_time: { [Op.ne]: null },
            [Op.and]: sequelize.where(
              sequelize.fn('YEAR', sequelize.col('settlement_time')),
              tahun
            )
          },
          attributes: [
            [sequelize.fn('MONTH', sequelize.col('settlement_time')), 'bulan'],
            [sequelize.fn('SUM',   sequelize.col('gross_amount')),    'total']
          ],
          group: [sequelize.fn('MONTH', sequelize.col('settlement_time'))],
          order: [[sequelize.fn('MONTH', sequelize.col('settlement_time')), 'ASC']]
        });

      const namaBulan = [
        'Jan','Feb','Mar','Apr','Mei','Jun',
        'Jul','Agu','Sep','Okt','Nov','Des'
      ];

      const donasiBulanan = namaBulan.map((bulan, index) => {
        const found = donasiBulananRaw.find(
          item => Number(item.dataValues.bulan) === index + 1
        );
        return {
          bulan,
          total: found ? Number(found.dataValues.total) : 0
        };
      });

      // ======================================================
      // GRAFIK JUMLAH POHON PER WILAYAH
      // ======================================================

      let groupField   = 'kode_provinsi';
      let wilayahTitle = 'Provinsi';
      let wilayahList  = [];

      // LEVEL PROVINSI
      if (!kode_provinsi && !kode_kbp_kota && !kode_kecamatan) {
        wilayahList = await WilayahService.getProvinces();
      }
      // LEVEL KABUPATEN/KOTA
      else if (kode_provinsi && !kode_kbp_kota) {
        groupField   = 'kode_kbp_kota';
        wilayahTitle = 'Kabupaten/Kota';
        wilayahList  = await WilayahService.getRegencies(kode_provinsi);
      }
      // LEVEL KECAMATAN
      else if (kode_kbp_kota && !kode_kecamatan) {
        groupField   = 'kode_kecamatan';
        wilayahTitle = 'Kecamatan';
        wilayahList  = await WilayahService.getDistricts(kode_kbp_kota);
      }
      // LEVEL KELURAHAN
      else if (kode_kecamatan) {
        groupField   = 'kode_kelurahan';
        wilayahTitle = 'Kelurahan';
        wilayahList  = await WilayahService.getVillages(kode_kecamatan);
      }

      // WHERE FILTER
      const whereWilayah = {};
      if (kode_provinsi)  whereWilayah.kode_provinsi  = kode_provinsi;
      if (kode_kbp_kota)  whereWilayah.kode_kbp_kota  = kode_kbp_kota;
      if (kode_kecamatan) whereWilayah.kode_kecamatan = kode_kecamatan;
      if (kode_kelurahan) whereWilayah.kode_kelurahan = kode_kelurahan;

      // QUERY CHART
      const pohonPerWilayahRaw =
        await ProgramDonasi.findAll({
          attributes: [
            groupField,
            [
              sequelize.fn('COUNT', sequelize.col('penanaman->pohon.id_pohon')),
              'total_pohon'
            ]
          ],
          include: [
            {
              model: Penanaman,
              as: 'penanaman',
              attributes: [],
              include: [
                { model: Pohon, as: 'pohon', attributes: [] }
              ]
            }
          ],
          where:  whereWilayah,
          group:  [groupField],
          raw:    true
        });

      // MAPPING NAMA WILAYAH
      const pohonPerWilayah = pohonPerWilayahRaw.map(item => {
        const kode    = item[groupField];
        const wilayah = wilayahList.find(
          w => String(w.code) === String(kode)
        );
        return {
          wilayah: wilayah ? wilayah.name : kode,
          total:   Number(item.total_pohon)
        };
      });

      // ======================================================
      // TOP PROGRAM
      // ======================================================

      const topProgram = await Donasi.findAll({
        attributes: [
          'id_program',
          [sequelize.fn('SUM', sequelize.col('jumlah_pohon')),   'total_pohon'],
          [sequelize.fn('SUM', sequelize.col('nominal_donasi')), 'total_donasi']
        ],
        include: [
          {
            model: ProgramDonasi,
            as: 'program',
            attributes: ['judul_program']
          },
          {
            model: Payment,
            as: 'payments',
            where: { status: 'settlement' },
            attributes: []
          }
        ],
        group:    ['Donasi.id_program'],
        order:    [[sequelize.literal('total_pohon'), 'DESC']],
        limit:    5,
        subQuery: false
      });

      // ======================================================
      // TOP CORPORATE
      // ======================================================

      const topCorporate = await Donasi.findAll({
        attributes: [
          'id_user',
          [sequelize.fn('SUM', sequelize.col('jumlah_pohon')),   'total_pohon'],
          [sequelize.fn('SUM', sequelize.col('nominal_donasi')), 'total_donasi']
        ],
        include: [
          {
            model: User,
            as: 'user',
            where: { role: 'donatur_corporate' },
            attributes: ['nama_lengkap']
          },
          {
            model: Payment,
            as: 'payments',
            where: { status: 'settlement' },
            attributes: []
          }
        ],
        group: [
          sequelize.col('Donasi.id_user'),
          sequelize.col('user.id_user'),
          sequelize.col('user.nama_lengkap')
        ],
        order: [[sequelize.literal('total_pohon'), 'DESC']],
        limit: 5
      });

      // ======================================================
      // DISTRIBUSI JENIS POHON
      // ======================================================

      const jenisPohonChart = await JenisPohon.findAll({
        attributes: [
          'nama_pohon',
          [sequelize.fn('COUNT', sequelize.col('pohon.id_pohon')), 'total']
        ],
        include: [
          { model: Pohon, as: 'pohon', attributes: [] }
        ],
        group: ['JenisPohon.id_jenis_pohon'],
        order: [[sequelize.literal('total'), 'DESC']]
      });

      // ======================================================
      // STATUS PROGRAM
      // ======================================================

      const statusProgramChart = await ProgramDonasi.findAll({
        attributes: [
          'status_program',
          [sequelize.fn('COUNT', sequelize.col('id_program')), 'total']
        ],
        group: ['status_program']
      });

      // ======================================================
      // DATA WILAYAH UNTUK DROPDOWN FILTER
      // ======================================================

      const provinces = await WilayahService.getProvinces();

      let regencies = [];
      let districts = [];
      let villages  = [];

      if (kode_provinsi) {
        regencies = await WilayahService.getRegencies(kode_provinsi);
      }

      if (kode_kbp_kota) {
        districts = await WilayahService.getDistricts(kode_kbp_kota);
      }

      if (kode_kecamatan) {
        villages = await WilayahService.getVillages(kode_kecamatan);
      }

      // ======================================================
      // INSIGHT SECTION
      // ======================================================

      const provinsiTeraktif =
        pohonPerWilayah.length > 0
          ? pohonPerWilayah.slice().sort((a, b) => b.total - a.total)[0]
          : null;

      const corporateTerbesar =
        topCorporate.length > 0 ? topCorporate[0] : null;

      const programTerbaik =
        topProgram.length > 0 ? topProgram[0] : null;

      // ======================================================
      // RENDER
      // ======================================================

      res.render('pimpinan/dashboard', {

        title:      'Dashboard Pimpinan',
        activePage: 'dashboard',
        user:       req.user,

        // filter aktif
        tahun,
        kode_provinsi,
        kode_kbp_kota,
        kode_kecamatan,
        kode_kelurahan,
        wilayahTitle,

        // summary
        totalProgram,
        totalPohon,
        totalDonatur,
        totalCorporate,
        totalProvinsiAktif,
        totalDanaNasional,

        // chart
        donasiBulanan,
        pohonPerWilayah,
        topProgram,
        topCorporate,
        jenisPohonChart,
        statusProgramChart,

        // dropdown filter wilayah
        provinces,
        regencies,
        districts,
        villages,

        // insight
        provinsiTeraktif,
        corporateTerbesar,
        programTerbaik

      });

    } catch (error) {

      console.error(error);
      res.send(error.message);

    }

  }

}

module.exports = PimpinanDashboardController;