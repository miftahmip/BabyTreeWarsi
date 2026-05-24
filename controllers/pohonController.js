const {Pohon, Penanaman, ProgramDonasi, JenisPohon, Mitra, DetailMonitoring, Monitoring} = require('../models');
const { Op } = require('sequelize');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const {deleteFile} = require('../utils/fileHelper');

class PohonController {

  // LIST DATA POHON
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
            }
          ],

          order: [['createdAt', 'DESC']]
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

      // VALIDASI FOTO
      if (
        !req.files ||
        req.files.length === 0
      ) {

        return res.send(
          'Foto bukti tanam wajib diupload'
        );

      }

      // GENERATE ID POHON

      const jenisPohonData =
        await JenisPohon.findByPk(id_jenis_pohon);

      const namaPohon =
        jenisPohonData.nama_pohon
          .replace(/\s+/g, '')
          .toUpperCase();

      // kode 3 huruf jenis pohon
      const kodePohon =
        namaPohon.substring(0, 3);

      // ambil id penanaman langsung sebagai prefix
      const prefix = `${id_penanaman}-${kodePohon}`;

      // cari data terakhir berdasarkan penanaman + jenis pohon
      const lastData =
        await Pohon.findOne({

          where: {
            id_pohon: {
              [Op.like]: `${prefix}%`
            }
          },

          order: [['id_pohon', 'DESC']]
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
        `${prefix}-${String(nomor).padStart(3, '0')}`;



      const foto =
        req.files.map(
          file => file.filename
        );

      // SIMPAN DATA
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

      // PARSE FOTO
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

      // Folder QR
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

}

module.exports = PohonController;