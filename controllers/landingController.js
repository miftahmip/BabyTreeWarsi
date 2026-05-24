const { ProgramDonasi } = require('../models');
const WilayahService = require('../services/wilayahService');

class LandingController {

    // ================= LANDING PAGE =================
    static async landingPage(req, res) {
        try {

            const programs = await ProgramDonasi.findAll({
                where: { 
                    status_program: 'aktif'
                 },
                order: [['createdAt', 'DESC']]
            });

            const programsWithWilayah = await Promise.all(
                programs.map(async (item) => {
                    return await WilayahService.mapWilayah(item.toJSON());
                })
            );

            return res.render('landing', {
                pageTitle: 'Baby Tree - Donasi Pohon',
                programs: programsWithWilayah
            });

        } catch (error) {
            console.error(error);
            return res.status(500).send('Terjadi kesalahan');
        }
    }

    // ================= DETAIL PROGRAM =================
    static async detailProgram(req, res) {
        try {

            const { id } = req.params;

            const program = await ProgramDonasi.findByPk(id);

            if (!program) {
                return res.status(404).send('Program tidak ditemukan');
            }

            const programWithWilayah =
                await WilayahService.mapWilayah(program.toJSON());

            return res.render('landing-detail', {
                pageTitle: program.judul_program,
                program: programWithWilayah
            });

        } catch (error) {
            console.error(error);
            return res.status(500).send('Terjadi kesalahan');
        }
    }
}

module.exports = LandingController;