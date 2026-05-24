const {ProgramDonasi, Penanaman, Pohon, Monitoring, DetailMonitoring, Mitra, HargaPenanaman} = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const WilayahService = require('../services/wilayahService');

class RekapPembayaranController {

  static async listProgram(req, res) {

    try {

    const penanaman = await Penanaman.findAll({
      include: [
        {
          model: ProgramDonasi,
          as: 'program',
          where: {
            kode_provinsi: req.user.kode_provinsi
          }
        }
      ]
    });

    // Ambil program unik dari hasil penanaman
    const programMap = {};
    penanaman.forEach(p => {
      if (p.program && !programMap[p.program.id_program]) {
        programMap[p.program.id_program] = p.program;
      }
    });

    const programs = Object.values(programMap);

      res.render(
        'admin-wilayah/rekap/listProgram', { 
          programs,
          user: req.user
         }
      );

    } catch (error) {

      console.log(error);
      res.send(error);

    }

  }


  static async listPenanaman(req, res) {

    try {

    const { id_program } = req.params;

    const penanamanRaw = await Penanaman.findAll({
      where: { id_program },
      include: [
        {
          model: ProgramDonasi,
          as: 'program'
        }
      ]
    });

    // Map wilayah seperti di getPetugasPenanaman
    const penanaman = await Promise.all(
      penanamanRaw.map(async (item) => {
        const detail = item.toJSON();
        if (detail.program) {
          detail.program = await WilayahService.mapWilayah(detail.program);
        }
        return detail;
      })
    );

      res.render(
        'admin-wilayah/rekap/listPenanaman',{ 
          penanaman, 
          user: req.user 
        }
      );

    } catch (error) {

      console.log(error);
      res.send(error);

    }

  }


  static async detailRekap(req, res) {

    try {

      const { id_penanaman } = req.params;

      const penanaman =
        await Penanaman.findByPk(
          id_penanaman,
          {
            include: [
              {
                model: HargaPenanaman,
                as: 'hargaPenanaman'
              }
            ]
          }
        );

      const pohon =
        await Pohon.findAll({

          where: {
            id_penanaman
          },

          include: [
            {
              model: Mitra,
              as: 'mitra'
            }
          ]

        });

      // GROUP MITRA
      const mitraMap = {};

      for (const item of pohon) {

        const idMitra =
          item.id_mitra;

        if (!mitraMap[idMitra]) {

          mitraMap[idMitra] = {
            mitra:
              item.mitra.nama_mitra,
              bank:           item.mitra.bank           || '—',
              no_rekening:    item.mitra.no_rekening    || '—',
              atas_nama_bank: item.mitra.atas_nama_bank || '—',
            total_tanam: 0,
            monitoring_1: 0,
            monitoring_2: 0,
            monitoring_3: 0,
            total_uang: 0
          };

        }

        mitraMap[idMitra]
          .total_tanam++;

      }

      // MONITORING
      // Ambil semua id_pohon dari penanaman ini dulu
      const idPohonList = pohon.map(p => p.id_pohon);

      const detailMonitorings = await DetailMonitoring.findAll({
        where: {
          id_pohon: { [Op.in]: idPohonList }
        },
        include: [
          {
            model: Monitoring,
            as: 'monitoring'
          }
        ]
      });

      // Lalu loop detailMonitorings, bukan monitoring
      for (const detail of detailMonitorings) {
        const tahap = detail.monitoring?.tahap_monitoring;
        
        if (detail.status !== 'hidup') continue;  // sesuaikan field statusnya
        
        const pohonData = pohon.find(p => p.id_pohon === detail.id_pohon);
        if (!pohonData) continue;
        
        const idMitra = pohonData.id_mitra;
        
        if (tahap === 1 || tahap === 'monitoring_1') mitraMap[idMitra].monitoring_1++;
        if (tahap === 2 || tahap === 'monitoring_2') mitraMap[idMitra].monitoring_2++;
        if (tahap === 3 || tahap === 'monitoring_3') mitraMap[idMitra].monitoring_3++;
      }

      // HARGA
      const hargaMap = {};

      for (
        const harga of
        penanaman.hargaPenanaman
      ) {

        hargaMap[
          harga.tahap
        ] = harga.harga_per_pohon;

      }

      // TOTAL UANG
      for (
        const key in mitraMap
      ) {

        const item =
          mitraMap[key];

        item.total_uang =

          (
            item.total_tanam *
            (hargaMap.penanaman || 0)
          )

          +

          (
            item.monitoring_1 *
            (hargaMap.monitoring_1 || 0)
          )

          +

          (
            item.monitoring_2 *
            (hargaMap.monitoring_2 || 0)
          )

          +

          (
            item.monitoring_3 *
            (hargaMap.monitoring_3 || 0)
          );

      }

      res.render(
        'admin-wilayah/rekap/detailRekap',
        {
          penanaman,
          rekap:
            Object.values(
              mitraMap
            ),
          hargaMap,
          user: req.user
        }
      );

    } catch (error) {

      console.log(error);
      res.send(error);

    }

  }


    static async exportExcel(req, res) {

      try {

        const { id_penanaman } = req.params;

        const penanaman =
          await Penanaman.findByPk(
            id_penanaman,
            {
              include: [
                {
                  model: HargaPenanaman,
                  as: 'hargaPenanaman'
                }
              ]
            }
          );

        const pohon =
          await Pohon.findAll({

            where: {
              id_penanaman
            },

            include: [
              {
                model: Mitra,
                as: 'mitra'
              }
            ]

          });

        const mitraMap = {};

        for (const item of pohon) {

          const idMitra =
            item.id_mitra;

          if (!mitraMap[idMitra]) {

            mitraMap[idMitra] = {

              mitra:  item.mitra.nama_mitra,
              bank:   item.mitra.bank           || '—',
              no_rekening:  item.mitra.no_rekening    || '—',
              atas_nama_bank: item.mitra.atas_nama_bank || '—',
              total_tanam: 0,
              monitoring_1: 0,
              monitoring_2: 0,
              monitoring_3: 0,
              total_penanaman: 0,
              total_m1: 0,
              total_m2: 0,
              total_m3: 0,

              total_keseluruhan: 0

            };

          }

          mitraMap[idMitra]
            .total_tanam++;

        }

        // Ambil semua id_pohon dari penanaman ini dulu
        const idPohonList = pohon.map(p => p.id_pohon);

        const detailMonitorings = await DetailMonitoring.findAll({
          where: {
            id_pohon: { [Op.in]: idPohonList }
          },
          include: [
            {
              model: Monitoring,
              as: 'monitoring'
            }
          ]
        });

        // Lalu loop detailMonitorings, bukan monitoring
        for (const detail of detailMonitorings) {
          const tahap = detail.monitoring?.tahap_monitoring;
          
          if (detail.status !== 'hidup') continue;  // sesuaikan field statusnya
          
          const pohonData = pohon.find(p => p.id_pohon === detail.id_pohon);
          if (!pohonData) continue;
          
          const idMitra = pohonData.id_mitra;
          
          if (tahap === 1 || tahap === 'monitoring_1') mitraMap[idMitra].monitoring_1++;
          if (tahap === 2 || tahap === 'monitoring_2') mitraMap[idMitra].monitoring_2++;
          if (tahap === 3 || tahap === 'monitoring_3') mitraMap[idMitra].monitoring_3++;
        }

        const hargaMap = {};

        for (
          const harga of
          penanaman.hargaPenanaman
        ) {

          hargaMap[
            harga.tahap
          ] = harga.harga_per_pohon;

        }


        for (const key in mitraMap) {

          const item =
            mitraMap[key];

          item.total_penanaman =
            item.total_tanam *
            (hargaMap.penanaman || 0);

          item.total_m1 =
            item.monitoring_1 *
            (hargaMap.monitoring_1 || 0);

          item.total_m2 =
            item.monitoring_2 *
            (hargaMap.monitoring_2 || 0);

          item.total_m3 =
            item.monitoring_3 *
            (hargaMap.monitoring_3 || 0);

          item.total_keseluruhan =

            item.total_penanaman +

            item.total_m1 +

            item.total_m2 +

            item.total_m3;

        }


        const workbook =
          new ExcelJS.Workbook();

        const worksheet =
          workbook.addWorksheet(
            'Rekap Pembayaran'
          );

        // HEADER
        worksheet.columns = [

          {
            header: 'Mitra',
            key: 'mitra',
            width: 25
          },

          {
            header: 'Bank',
            key: 'bank',
            width: 20
          },
          
          {
            header: 'No Rekening',
            key: 'no_rekening',
            width: 22
          },

          {
            header: 'Atas Nama',
            key: 'atas_nama_bank',
            width: 25
          },

          {
            header: 'Total Tanam',
            key: 'total_tanam',
            width: 15
          },

          {
            header: 'Monitoring 1',
            key: 'monitoring_1',
            width: 15
          },

          {
            header: 'Monitoring 2',
            key: 'monitoring_2',
            width: 15
          },

          {
            header: 'Monitoring 3',
            key: 'monitoring_3',
            width: 15
          },

          {
            header: 'Total Penanaman',
            key: 'total_penanaman',
            width: 20
          },

          {
            header: 'Total M1',
            key: 'total_m1',
            width: 20
          },

          {
            header: 'Total M2',
            key: 'total_m2',
            width: 20
          },

          {
            header: 'Total M3',
            key: 'total_m3',
            width: 20
          },

          {
            header: 'Total Keseluruhan',
            key: 'total_keseluruhan',
            width: 25
          }

        ];

        // DATA
        Object.values(mitraMap)
          .forEach(item => {

            worksheet.addRow(item);

          });

        // STYLE HEADER
        worksheet.getRow(1)
          .font = {
            bold: true
          };

        // DOWNLOAD
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        res.setHeader(
          'Content-Disposition',
          `attachment; filename=rekap-pembayaran-${id_penanaman}.xlsx`
        );

        await workbook.xlsx.write(res);

        res.end();

      } catch (error) {

        console.log(error);
        res.send(error);

      }

    }

}

module.exports = RekapPembayaranController;