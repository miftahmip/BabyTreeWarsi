'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id_user: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },

      kode_provinsi: {
        type: Sequelize.STRING,
        allowNull: true
      },

      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      password: {
        type: Sequelize.STRING,
        allowNull: false
      },

      nama_lengkap: {
        type: Sequelize.STRING,
        allowNull: false
      },

      no_telepon: {
        type: Sequelize.STRING,
        allowNull: true
      },

      role: {
        type: Sequelize.ENUM(
          'admin_pusat',
          'admin_wilayah',
          'petugas_lapangan',
          'donatur_umum',
          'donatur_corporate',
          'pimpinan'
        ),
        allowNull: false
      },

      status: {
        type: Sequelize.ENUM('aktif', 'nonaktif'),
        defaultValue: 'aktif'
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};