const fs = require('fs');
const path = require('path');
const { ProgramDonasi, User } = require('../models');
const { deleteFile } = require('../utils/fileHelper');
const WilayahService = require('../services/wilayahService');

class ProgramDonasiController {

    static async index(req, res) {
        try {

            const programs = await ProgramDonasi.findAll({
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id_user', 'nama_lengkap']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            const today = new Date().toISOString().split('T')[0];

            const programsWithWilayah = await Promise.all(
                programs.map(async (item) => {
                    let data = item.toJSON();

                let statusBaru = 'aktif';
                if (data.tanggal_selesai && data.tanggal_selesai <= today) {
                    statusBaru = 'selesai';
                }

                if (item.status_program !== statusBaru) {
                    await item.update({ status_program: statusBaru });
                }

                data.status_program = statusBaru;

                    return await WilayahService.mapWilayah(data);
                })
            );

            return res.render('admin-pusat/kelola-program', {
                pageTitle: 'Kelola Program Donasi',
                activePage: 'program',
                user: req.user,
                programs: programsWithWilayah,
                today
            });

        } catch (error) {
            console.error(error);
            return res.status(500).send('Terjadi kesalahan pada server');
        }
    }

    // ================= API WILAYAH =================

    static async getProvinces(req, res) {
        try {
            const data = await WilayahService.getProvinces();
            return res.json(data);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async getRegencies(req, res) {
        try {
            const data = await WilayahService.getRegencies(req.params.provinceCode);
            return res.json(data);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async getDistricts(req, res) {
        try {
            const data = await WilayahService.getDistricts(req.params.regencyCode);
            return res.json(data);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async getVillages(req, res) {
        try {
            const data = await WilayahService.getVillages(req.params.districtCode);
            return res.json(data);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async store(req, res) {
        try {

            const {
                judul_program,
                deskripsi,
                harga_pohon,
                tanggal_selesai,
                kode_provinsi,
                kode_kbp_kota,
                kode_kecamatan,
                kode_kelurahan
            } = req.body;

            const total = await ProgramDonasi.count();

            const id_program =
                'PRG' + String(total + 1).padStart(4, '0');

            const flyer_program =
                req.file ? req.file.filename : null;

            const today = new Date().toISOString().split('T')[0];

            await ProgramDonasi.create({
                id_program,
                created_by_user_id: req.user.id_user,

                judul_program,
                flyer_program,
                deskripsi,

                pohon_terkumpul: 0,
                harga_pohon,

                tanggal_mulai: today,
                tanggal_selesai: tanggal_selesai || null,

                // 🔥 tetap simpan (opsional, tapi tidak dipakai utama)
                status_program: 'aktif',

                kode_provinsi,
                kode_kbp_kota,
                kode_kecamatan,
                kode_kelurahan
            });

            return res.redirect('/admin-pusat/kelola-program');

        } catch (error) {
            console.error(error);
            return res.status(500).send('Gagal menyimpan data');
        }
    }

    static async update(req, res) {
        try {

            const { id } = req.params;

            const data = await ProgramDonasi.findByPk(id);

            if (!data) {
                return res.status(404).send('Program tidak ditemukan');
            }

            const {
                judul_program,
                deskripsi,
                harga_pohon,
                tanggal_selesai,
                kode_provinsi,
                kode_kbp_kota,
                kode_kecamatan,
                kode_kelurahan
            } = req.body;

            let flyer_program = data.flyer_program;

            if (req.file) {
                deleteFile(data.flyer_program, 'program');
                flyer_program = req.file.filename;
            }

            await data.update({
                judul_program,
                flyer_program,
                deskripsi,
                harga_pohon,

                tanggal_selesai: tanggal_selesai || null,

                // 🔥 tidak perlu logika status lagi
                status_program: data.status_program,

                kode_provinsi,
                kode_kbp_kota,
                kode_kecamatan,
                kode_kelurahan
            });

            return res.redirect('/admin-pusat/kelola-program');

        } catch (error) {
            console.error(error);
            return res.status(500).send('Gagal update data');
        }
    }

    static async destroy(req, res) {
        try {

            const { id } = req.params;

            const data = await ProgramDonasi.findByPk(id);

            if (!data) {
                return res.status(404).send('Program tidak ditemukan');
            }

            deleteFile(data.flyer_program, 'program');

            await data.destroy();

            return res.redirect('/admin-pusat/kelola-program');

        } catch (error) {
            console.error(error);
            return res.status(500).send('Gagal menghapus data');
        }
    }
}

module.exports = ProgramDonasiController;