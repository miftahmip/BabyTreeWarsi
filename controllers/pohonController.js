const {Pohon, Penanaman, ProgramDonasi, JenisPohon, Mitra, DetailMonitoring, Monitoring, Donasi, DonasiPohon,User} = require('../models');
const { Op } = require('sequelize');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const {deleteFile} = require('../utils/fileHelper');

class PohonController {
    static async index(req, res) {

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

        const pohonList =
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
            ],

            order: [['createdAt', 'DESC']]
          });

        const data = pohonList.map(pohon => {

          const monList =
            pohon.detailMonitoring || [];

          const monAsli = monList.filter(m => {
            if (m.status_verifikasi !== 'disetujui')
              return true;
            return true;
          });

          const monSorted = [...monAsli].sort((a, b) => {
            const tA =
              Number(a.monitoring?.tahap_monitoring || 0);
            const tB =
              Number(b.monitoring?.tahap_monitoring || 0);
            return tB - tA;
          });

          let overallStatus  = pohon.status_verifikasi;
          let overallTahap   = null;

          const monRevisi = monSorted.find(
            m => m.status_verifikasi === 'revisi'
          );
          const monMenunggu = monSorted.find(
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

            const monDisetujui = monSorted.find(
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

        const jenisPohon =
          await JenisPohon.findAll({
            order: [['nama_pohon', 'ASC']]
          });

        const mitra =
          await Mitra.findAll({
            order: [['nama_mitra', 'ASC']]
          });

        res.render(
          'petugas-lapangan/pohon/index',
          {
            title: 'Data Pohon',
            activePage: 'penanaman',
            data,
            penanaman,
            jenisPohon,
            mitra,
            user: req.user
          }
        );

      } catch (error) {

        console.log(error);
        res.send(error.message);

      }

    }

    // CREATE DATA POHON
    static async create(req, res) {

      try {

        const {
          id_penanaman,
          id_mitra,
          id_jenis_pohon,
          tgl_tanam,
          latitude,
          longitude
        } = req.body;

        if (
          !req.files ||
          req.files.length === 0
        ) {

          return res.send(
            'Foto bukti tanam wajib diupload'
          );

        }

        const penanaman =
          await Penanaman.findByPk(
            id_penanaman
          );

        if (!penanaman) {

          return res.send(
            'Data penanaman tidak ditemukan'
          );

        }

        // GENERATE ID POHON

        const jenisPohonData =
          await JenisPohon.findByPk(
            id_jenis_pohon
          );

        const namaPohon =
          jenisPohonData.nama_pohon
            .replace(/\s+/g, '')
            .toUpperCase();

        const kodePohon =
          namaPohon.substring(0, 3);

        const prefix =
          `${id_penanaman}-${kodePohon}`;

        const lastData =
          await Pohon.findOne({

            where: {
              id_pohon: {
                [Op.like]:
                  `${prefix}%`
              }
            },

            order: [
              ['id_pohon', 'DESC']
            ]
          });

        let nomor = 1;

        if (lastData) {

          nomor =
            parseInt(
              lastData.id_pohon.slice(-3)
            ) + 1;
        }

        // FINAL ID
        const id_pohon =
          `${prefix}-${String(nomor)
            .padStart(3, '0')}`;

        const foto =
          req.files.map(
            file => file.filename
          );


        const pohonBaru =
          await Pohon.create({

            id_pohon,
            id_penanaman,
            id_mitra,
            id_jenis_pohon,
            tgl_tanam,
            latitude,
            longitude,

            foto_bukti_tanam:
              JSON.stringify(foto),

            status_verifikasi:
              'menunggu'

          });


        const corporateDonasi =
          await Donasi.findAll({

            where: {
              id_program:
                penanaman.id_program
            },

            include: [
              {
                model: User,
                as: 'user',

                where: {
                  role:
                    'donatur_corporate'
                }
              }
            ],

            order: [
              ['createdAt', 'ASC']
            ]

          });

        for (const donasi of corporateDonasi) {

          const assigned =
            await DonasiPohon.count({

              where: {
                id_donasi:
                  donasi.id_donasi
              }

            });

          if (
            assigned <
            donasi.jumlah_pohon
          ) {

            await DonasiPohon.create({

              id_donasi:
                donasi.id_donasi,

              id_pohon:
                pohonBaru.id_pohon

            });
            break;

          }

        }

        res.redirect(
          `/petugas-lapangan/pohon/${id_penanaman}`
        );

      } catch (error) {

        console.log(error);
        res.send(error.message);

      }

    }


  // DETAIL DATA POHON
  static async detail(req, res) {

    try {

      const { id } =
        req.params;

      const data =
        await Pohon.findByPk(id, {

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
              model: Penanaman,
              as: 'penanaman',

              include: [
                {
                  model: ProgramDonasi,
                  as: 'program'
                }
              ]
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
          ]
        });

      if (!data) {

        return res.send(
          'Data pohon tidak ditemukan'
        );

      }

      let fotoList = [];

      try {

        fotoList =
          JSON.parse(
            data.foto_bukti_tanam || '[]'
          );

      } catch (error) {

        fotoList = [];

      }


      const jenisPohon =
        await JenisPohon.findAll({
          order: [['nama_pohon', 'ASC']]
        });

      const mitra =
        await Mitra.findAll({
          order: [['nama_mitra', 'ASC']]
        });


      res.render(
        'petugas-lapangan/pohon/detail',
        {
          title: 'Detail Pohon',
          activePage: 'penanaman',
          data,
          fotoList,
          jenisPohon,
          mitra,
          user: req.user
        }
      );

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }

  // UPDATE DATA POHON
  static async update(req, res) {

    try {

      const { id } =
        req.params;

      const {
        id_mitra,
        id_jenis_pohon,
        tgl_tanam,
        latitude,
        longitude
      } = req.body;


      const pohon =
        await Pohon.findByPk(id);

      if (!pohon) {

        return res.send(
          'Data pohon tidak ditemukan'
        );

      }

      // FOTO LAMA
      let fotoLama = [];

      try {

        fotoLama =
          JSON.parse(
            pohon.foto_bukti_tanam || '[]'
          );

      } catch (error) {

        fotoLama = [];

      }

      // FOTO BARU
      let fotoBaru = fotoLama;

      if (
        req.files &&
        req.files.length > 0
      ) {

        // hapus foto lama
        fotoLama.forEach(file => {

          deleteFile(
            file,
            'pohon'
          );

        });

        fotoBaru =
          req.files.map(
            file => file.filename
          );

      }

      // UPDATE DATA
      await pohon.update({

        id_mitra:       id_mitra       || pohon.id_mitra,
        id_jenis_pohon: id_jenis_pohon || pohon.id_jenis_pohon,
        tgl_tanam:      tgl_tanam      || pohon.tgl_tanam,
        latitude:       latitude       || pohon.latitude,
        longitude:      longitude      || pohon.longitude,
        foto_bukti_tanam: JSON.stringify(fotoBaru),

        status_verifikasi:   'menunggu',
        catatan_koreksi:     null,
        verified_by_user_id: null

      });

      res.redirect(
        `/petugas-lapangan/pohon/detail/${id}`
      );

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }

  // QR CODE
  static async qrCode(req, res) {

    try {

      const { id } =
        req.params;

        console.log(process.env.BASE_URL);

      const data =
        await Pohon.findByPk(id);

      if (!data) {

        return res.status(404).send(
          'Data pohon tidak ditemukan'
        );

      }

      // URL QR
      const qrValue =
        `${process.env.BASE_URL}/petugas-lapangan/pohon/detail/${data.id_pohon}`;

      const qrFolder =
        path.join(
          __dirname,
          '../src/uploads/qrcode'
        );

      // Buat folder jika belum ada
      if (!fs.existsSync(qrFolder)) {

        fs.mkdirSync(
          qrFolder,
          { recursive: true }
        );

      }

      // Nama file
      const qrFileName =
        `${data.id_pohon}.png`;

      // Path file
      const qrPath =
        path.join(
          qrFolder,
          qrFileName
        );

      // Generate QR jika belum ada
      if (!fs.existsSync(qrPath)) {

        await QRCode.toFile(
          qrPath,
          qrValue,
          {
            width: 400
          }
        );

      }

      return res.status(200).send(
        'QR berhasil dibuat'
      );

    } catch (error) {

      console.log(error);

      return res.status(500).send(
        error.message
      );

    }

  }

  // DOWNLOAD QR CODE
  static async downloadQR(req, res) {

    try {

      const { id } =
        req.params;

      const filePath =
        path.join(
          __dirname,
          '../src/uploads/qrcode',
          `${id}.png`
        );

      if (!fs.existsSync(filePath)) {

        return res.send(
          'QR Code tidak ditemukan'
        );

      }

      res.download(filePath);

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }

  // HALAMAN SCAN QR
  static async scanQRPage(req, res) {
    try {
      return res.render('petugas-lapangan/pohon/scan', {
        title: 'Scan QR Pohon',
        activePage: 'scan-qr',
        user: req.user,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send(error.message);
    }
  }
  
  // PROSES HASIL SCAN QR
  static async processScanQR(req, res) {
    try {
      const { qr_result } = req.body;
  
      if (!qr_result) {
        return res.status(400).json({
          success: false,
          message: 'Hasil scan QR tidak ditemukan.',
        });
      }
  
      // Validasi format URL — harus mengandung path detail pohon
      const detailPattern = /\/petugas-lapangan\/pohon\/detail\/([^/?#]+)/;
      const match = qr_result.match(detailPattern);
  
      if (!match) {
        return res.status(400).json({
          success: false,
          message: 'QR Code ini bukan milik sistem BabyTreeWarsi.',
        });
      }
  
      const idPohon = match[1];
  
      // Validasi pohon benar-benar ada di database
      const pohon = await Pohon.findByPk(idPohon);
  
      if (!pohon) {
        return res.status(404).json({
          success: false,
          message: `Pohon dengan ID "${idPohon}" tidak ditemukan di database.`,
        });
      }
  
      // Kirim redirect URL ke client (AJAX-friendly)
      return res.status(200).json({
        success: true,
        redirect_url: `/petugas-lapangan/pohon/detail/${idPohon}`,
      });
  
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

}

module.exports = PohonController;