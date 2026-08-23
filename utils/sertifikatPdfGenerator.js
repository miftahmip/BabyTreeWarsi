'use strict';
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

class SertifikatPdfGenerator {

    static OUTPUT_DIR = path.join(__dirname, '..', 'src', 'uploads', 'sertifikat');

    // Sesuaikan dengan lokasi asli file logo project kamu
    static LOGO_PATH = path.join(__dirname, '..', 'src', 'images', 'warsi_logo.png');

    /**
     * Generate PDF sertifikat dan simpan ke disk.
     * @param {Object} data
     * @param {string} data.id_sertifikat
     * @param {string} data.no_sertifikat
     * @param {string} data.nama_donatur
     * @param {string} data.judul_program
     * @param {number} data.total_pohon
     * @param {Date|string} data.tgl_terbit
     * @param {string} data.nama_penandatangan
     * @param {string} data.jabatan_penandatangan
     * @param {string} [data.ttd_file] - path absolut ATAU relatif (mis. nama file dari DB) ke gambar tanda tangan
     * @returns {Promise<string>} url relatif untuk disimpan ke kolom url_sertifikat
     */
    static async generate(data) {
        try {
            if (!fs.existsSync(this.OUTPUT_DIR)) {
                fs.mkdirSync(this.OUTPUT_DIR, { recursive: true });
            }

            const fileName = `${data.id_sertifikat}.pdf`;
            const filePath = path.join(this.OUTPUT_DIR, fileName);

            const doc = new PDFDocument({
                size: 'A4',
                layout: 'landscape',
                margin: 50
            });

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            this._drawSertifikat(doc, data);

            doc.end();

            await new Promise((resolve, reject) => {
                stream.on('finish', resolve);
                stream.on('error', reject);
            });

            return `/uploads/sertifikat/${fileName}`;
            // catatan: sesuaikan lagi kalau folder src/uploads Anda tidak
            // di-serve langsung sebagai '/uploads' (cek app.use(express.static(...)) di app.js)

        } catch (error) {
            console.error('Error generate PDF sertifikat:', error.message);
            throw new Error('Gagal membuat file PDF sertifikat');
        }
    }

    /**
     * Cari file gambar (logo/ttd) di disk, coba beberapa kemungkinan lokasi,
     * dan pastikan formatnya didukung pdfkit (PNG/JPEG saja).
     */
    static _resolveImagePath(inputPath, label) {
        if (!inputPath) {
            console.warn(`[SertifikatPdfGenerator] ${label}: path kosong, dilewati.`);
            return null;
        }

        // Kandidat lokasi: path apa adanya, lalu relatif terhadap folder uploads umum
        const candidates = [
            inputPath,
            path.isAbsolute(inputPath) ? inputPath : path.join(__dirname, '..', 'src', 'uploads', inputPath),
            path.isAbsolute(inputPath) ? inputPath : path.join(__dirname, '..', 'src', 'uploads', 'ttd', inputPath)
        ];

        const found = candidates.find(p => fs.existsSync(p));

        if (!found) {
            console.warn(`[SertifikatPdfGenerator] ${label}: file tidak ditemukan di kandidat berikut ->`, candidates);
            return null;
        }

        const ext = path.extname(found).toLowerCase();
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
            console.warn(`[SertifikatPdfGenerator] ${label}: format "${ext}" tidak didukung pdfkit (hanya PNG/JPEG). File: ${found}`);
            return null;
        }

        return found;
    }

    static _drawSertifikat(doc, data) {
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;

        // Border dekoratif
        doc.rect(20, 20, pageWidth - 40, pageHeight - 40)
            .lineWidth(2)
            .stroke('#1a4731');

        doc.rect(28, 28, pageWidth - 56, pageHeight - 56)
            .lineWidth(0.5)
            .stroke('#1a4731');

        // Logo
        const logoPath = this._resolveImagePath(this.LOGO_PATH, 'Logo');
        if (logoPath) {
            const logoWidth = 70;
            doc.image(logoPath, pageWidth / 2 - logoWidth / 2, 40, { width: logoWidth });
            doc.y = 40 + 70; // turunkan cursor supaya judul tidak menabrak logo
        } else {
            doc.moveDown(2);
        }

        // Judul
        doc.moveDown(1);
        doc.fontSize(30)
            .font('Helvetica-Bold')
            .fillColor('#1a4731')
            .text('SERTIFIKAT DONASI POHON', { align: 'center' });

        doc.moveDown(0.5);
        doc.fontSize(12)
            .font('Helvetica')
            .fillColor('#333333')
            .text(`No. ${data.no_sertifikat}`, { align: 'center' });

        doc.moveDown(2);
        doc.fontSize(14)
            .font('Helvetica')
            .fillColor('#333333')
            .text('Dengan bangga diberikan kepada:', { align: 'center' });

        doc.moveDown(0.5);
        doc.fontSize(26)
            .font('Helvetica-Bold')
            .fillColor('#1a4731')
            .text(data.nama_donatur, { align: 'center' });

        doc.moveDown(1.5);
        doc.fontSize(13)
            .font('Helvetica')
            .fillColor('#333333')
            .text(
                `Atas kontribusinya menyumbangkan ${data.total_pohon} pohon pada program`,
                { align: 'center' }
            );
        doc.fontSize(15)
            .font('Helvetica-Bold')
            .text(`"${data.judul_program}"`, { align: 'center' });

        doc.moveDown(1);
        doc.fontSize(11)
            .font('Helvetica')
            .fillColor('#666666')
            .text(
                `Diterbitkan pada ${new Date(data.tgl_terbit).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                })}`,
                { align: 'center' }
            );

        // Blok tanda tangan
        const signatureBlockY = pageHeight - 160;

        const ttdPath = this._resolveImagePath(data.ttd_file, 'Tanda tangan');
        if (ttdPath) {
            doc.image(ttdPath, pageWidth / 2 - 60, signatureBlockY, { width: 120, height: 60 });
        }

        doc.moveTo(pageWidth / 2 - 80, signatureBlockY + 65)
            .lineTo(pageWidth / 2 + 80, signatureBlockY + 65)
            .stroke('#333333');

        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#333333')
            .text(data.nama_penandatangan, pageWidth / 2 - 100, signatureBlockY + 72, {
                width: 200,
                align: 'center'
            });

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#666666')
            .text(data.jabatan_penandatangan, pageWidth / 2 - 100, doc.y, {
                width: 200,
                align: 'center'
            });
    }
}

module.exports = SertifikatPdfGenerator;