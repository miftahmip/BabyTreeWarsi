'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Cari user dengan role 'pimpinan' yang sudah ada di DB
    const [pimpinanList] = await queryInterface.sequelize.query(
      `SELECT id_user FROM Users WHERE role = 'pimpinan' LIMIT 1;`
    );

    if (pimpinanList.length === 0) {
      throw new Error(
        'Tidak ditemukan user dengan role "pimpinan". ' +
        'Pastikan sudah ada minimal 1 user pimpinan di tabel Users sebelum menjalankan seeder ini.'
      );
    }

    const idUserPimpinan = pimpinanList[0].id_user;

    await queryInterface.bulkInsert('pengaturan_penandatangan', [
      {
        id_pengaturan: 'PTR001',
        id_user: idUserPimpinan,
        jabatan: 'Direktur Eksekutif',
        ttd_file: 'ttd/pimpinan-ttd.png', // path RELATIF terhadap src/uploads/ — ganti sesuai nama file asli Anda
        is_aktif: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('pengaturan_penandatangan', {
      id_pengaturan: 'PTR001'
    });
  }
};