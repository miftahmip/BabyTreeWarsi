'use strict';
const path = require('path');
const {
  sequelize,
  Sertifikat,
  Donasi,
  ProgramDonasi,
  Penanaman,
  PengaturanPenandatangan,
  User
} = require('../models');
const SertifikatPdfGenerator = require('../utils/sertifikatPdfGenerator');

class SertifikatController {

  // ================= HELPER: GENERATE ID PREFIX + NOMOR URUT =================
  // Contoh: SERT001, SERT002, ...
  // Dijalankan di dalam transaction yang sama dengan create-nya untuk mengurangi
  // risiko duplikat saat ada 2 klaim bersamaan (lihat catatan di klaimSertifikat).
  static async generateNextId(prefix, transaction) {
    const last = await Sertifikat.findOne({
      order: [['id_sertifikat', 'DESC']],
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined
    });

    let nextNumber = 1;
    if (last) {
      const lastNumber = parseInt(last.id_sertifikat.replace(prefix, ''), 10);
      if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(3, '0')}`;
  }

  // Cek apakah sebuah program sudah memenuhi syarat untuk klaim sertifikat.
  // Syarat: status_program === 'selesai' DAN ada Penanaman dengan status_penanaman === 'aktif'
  static async isProgramEligible(idProgram) {
    const program = await ProgramDonasi.findByPk(idProgram);
    if (!program) return false;
    if (program.status_program !== 'selesai') return false;

    const penanamanAktif = await Penanaman.findOne({
      where: {
        id_program: idProgram,
        status_penanaman: 'aktif'
      }
    });

    return Boolean(penanamanAktif);
  }

  // ================= LIST PROGRAM BISA DIKLAIM =================
  // GET /sertifikat
  static async daftarProgramBisaDiklaim(req, res) {
    try {
      const idUser = req.user.id_user;
      const donaturUser = await User.findByPk(idUser);

      const donasiUser = await Donasi.findAll({
        where: { id_user: idUser },
        include: [{ model: ProgramDonasi, as: 'program' }]
      });

      // Kelompokkan per program (1 user bisa donasi berkali-kali di program yang sama)
      const programMap = new Map();
      for (const d of donasiUser) {
        if (!programMap.has(d.id_program)) {
          programMap.set(d.id_program, d.program);
        }
      }

      const hasil = [];
      for (const [idProgram, program] of programMap) {
        const eligible = await SertifikatController.isProgramEligible(idProgram);
        if (!eligible) continue;

        const sudahPunyaSertifikat = await Sertifikat.findOne({
          include: [{
            model: Donasi,
            as: 'donasi',
            where: { id_user: idUser, id_program: idProgram },
            required: true
          }]
        });

        hasil.push({
          id_program: idProgram,
          judul_program: program.judul_program,
          sudah_diklaim: Boolean(sudahPunyaSertifikat),
          id_sertifikat: sudahPunyaSertifikat ? sudahPunyaSertifikat.id_sertifikat : null
        });
      }

      res.render('donatur/sertifikat/index', {
        programList: hasil,
        activePage: 'sertifikat',
        user: donaturUser
      });
      // Kalau API/JSON: return res.json({ success: true, data: hasil });
    } catch (error) {
      console.error('Error daftarProgramBisaDiklaim:', error.message);
      res.status(500).send('Terjadi kesalahan saat memuat data sertifikat.');
    }
  }

  // ================= KLAIM SERTIFIKAT =================
  // POST /sertifikat/klaim/:id_program
  static async klaimSertifikat(req, res) {
    const { id_program } = req.params;
    const idUser = req.user.id_user;

    try {
      const eligible = await SertifikatController.isProgramEligible(id_program);
      if (!eligible) {
        // TODO: ganti dengan cara notifikasi yang dipakai project ini setelah dicek
        // (query string, session manual, dsb) — req.flash() dihapus karena
        // connect-flash belum/tidak terpasang.
        return res.status(400).redirect('/donatur/sertifikat?error=Program+belum+memenuhi+syarat+untuk+klaim+sertifikat');
      }

      const sertifikat = await sequelize.transaction(async (t) => {
        const donasiList = await Donasi.findAll({
          where: { id_user: idUser, id_program },
          transaction: t
        });

        if (donasiList.length === 0) {
          throw new Error('Tidak ditemukan donasi Anda pada program ini.');
        }

        const totalPohon = donasiList.reduce((sum, d) => sum + d.jumlah_pohon, 0);

        let sert = await Sertifikat.findOne({
          include: [{
            model: Donasi,
            as: 'donasi',
            where: { id_user: idUser, id_program },
            required: true
          }],
          transaction: t
        });

        if (sert) {
          // Sudah pernah klaim -> update total (jaga-jaga ada donasi baru)
          sert.total_pohon_akumulasi = totalPohon;
          sert.tgl_update_terakhir = new Date();
          await sert.save({ transaction: t });
        } else {
          // Belum pernah klaim -> buat baru
          const penandatanganAktif = await PengaturanPenandatangan.findOne({
            where: { is_aktif: true },
            transaction: t
          });
          if (!penandatanganAktif) {
            throw new Error('Penandatangan belum diatur, hubungi admin.');
          }

          sert = await Sertifikat.create({
            id_sertifikat: await SertifikatController.generateNextId('SERT', t),
            id_pengaturan: penandatanganAktif.id_pengaturan,
            no_sertifikat: `CERT/${new Date().getFullYear()}/${Date.now()}`,
            total_pohon_akumulasi: totalPohon,
            tgl_terbit: new Date(),
            status_sertifikat: 'aktif'
          }, { transaction: t });

          await Donasi.update(
            { id_sertifikat: sert.id_sertifikat },
            { where: { id_user: idUser, id_program }, transaction: t }
          );
        }

        return sert;
      });

      // Generate PDF di luar transaction (file IO tidak perlu ikut lock database)
      const donaturUser = await User.findByPk(idUser);
      const program = await ProgramDonasi.findByPk(id_program);
      const pengaturan = await PengaturanPenandatangan.findByPk(sertifikat.id_pengaturan, {
        include: [{ model: User, as: 'user', attributes: ['nama_lengkap'] }]
      });

      const urlPdf = await SertifikatPdfGenerator.generate({
        id_sertifikat: sertifikat.id_sertifikat,
        no_sertifikat: sertifikat.no_sertifikat,
        nama_donatur: donaturUser.nama_lengkap,
        judul_program: program.judul_program,
        total_pohon: sertifikat.total_pohon_akumulasi,
        tgl_terbit: sertifikat.tgl_terbit,
        nama_penandatangan: pengaturan.user.nama_lengkap,
        jabatan_penandatangan: pengaturan.jabatan,
        ttd_file: pengaturan.ttd_file
          ? path.join(__dirname, '..', 'src', 'uploads', pengaturan.ttd_file)
          : null
      });

      sertifikat.url_sertifikat = urlPdf;
      await sertifikat.save();

      res.redirect(`/donatur/sertifikat/${sertifikat.id_sertifikat}`);
    } catch (error) {
      console.error('Error klaimSertifikat:', error.message);
      res.status(500).redirect(`/donatur/sertifikat?error=${encodeURIComponent(error.message || 'Gagal mengklaim sertifikat.')}`);
    }
  }

  // ================= DETAIL SERTIFIKAT =================
  // GET /sertifikat/:id_sertifikat
  static async detailSertifikat(req, res) {
    try {
      const { id_sertifikat } = req.params;
      const idUser = req.user.id_user;
      const donaturUser = await User.findByPk(idUser);

      const sertifikat = await Sertifikat.findByPk(id_sertifikat, {
        include: [{
          model: PengaturanPenandatangan,
          as: 'penandatangan',
          include: [{ model: User, as: 'user', attributes: ['nama_lengkap'] }]
        }]
      });

      if (!sertifikat) {
        return res.status(404).send('Sertifikat tidak ditemukan.');
      }

      // Pastikan sertifikat ini memang milik user yang login
      const donasiTerkait = await sertifikat.getDonasi({
        where: { id_user: idUser },
        limit: 1,
        include: [{ model: ProgramDonasi, as: 'program', attributes: ['judul_program'] }]
      });
      if (donasiTerkait.length === 0) {
        return res.status(403).send('Anda tidak memiliki akses ke sertifikat ini.');
      }

      res.render('donatur/sertifikat/detail', {
        sertifikat,
        programJudul: donasiTerkait[0].program.judul_program,
        activePage: 'sertifikat',
        user: donaturUser
      });
    } catch (error) {
      console.error('Error detailSertifikat:', error.message);
      res.status(500).send('Terjadi kesalahan saat memuat sertifikat.');
    }
  }

  // ================= DOWNLOAD SERTIFIKAT (PDF) =================
  // GET /sertifikat/:id_sertifikat/download
  static async downloadSertifikat(req, res) {
    try {
      const { id_sertifikat } = req.params;
      const idUser = req.user.id_user;

      const sertifikat = await Sertifikat.findByPk(id_sertifikat);
      if (!sertifikat || !sertifikat.url_sertifikat) {
        return res.status(404).send('File sertifikat tidak ditemukan.');
      }

      const donasiTerkait = await sertifikat.getDonasi({
        where: { id_user: idUser },
        limit: 1
      });
      if (donasiTerkait.length === 0) {
        return res.status(403).send('Anda tidak memiliki akses ke sertifikat ini.');
      }

      const filePath = path.join(__dirname, '..', 'src', 'uploads', 'sertifikat', `${sertifikat.id_sertifikat}.pdf`);
      res.download(filePath, `${sertifikat.no_sertifikat}.pdf`);
    } catch (error) {
      console.error('Error downloadSertifikat:', error.message);
      res.status(500).send('Terjadi kesalahan saat mengunduh sertifikat.');
    }
  }
}

module.exports = SertifikatController;