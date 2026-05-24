// migration terbaru ProgramDonasi

'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.createTable(
      'ProgramDonasis',
      {

        id_program: {
          type: Sequelize.STRING,
          primaryKey: true,
          allowNull: false
        },

        created_by_user_id: {
          type: Sequelize.STRING,
          allowNull: true,
          references: {
            model: 'Users',
            key: 'id_user'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },

        judul_program: {
          type: Sequelize.STRING,
          allowNull: false
        },

        flyer_program: {
          type: Sequelize.STRING
        },

        deskripsi: {
          type: Sequelize.TEXT,
          allowNull: false
        },

        pohon_terkumpul: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },

        harga_pohon: {
          type: Sequelize.INTEGER,
          allowNull: false
        },

        tanggal_mulai: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },

        tanggal_selesai: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },

        status_program: {
          type: Sequelize.ENUM(
            'aktif',
            'selesai'
          ),
          defaultValue: 'aktif'
        },

        kode_kelurahan:
          Sequelize.STRING,

        kode_kecamatan:
          Sequelize.STRING,

        kode_kbp_kota:
          Sequelize.STRING,

        kode_provinsi:
          Sequelize.STRING,

        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },

        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }

      }
    );

  },

  async down(queryInterface) {

    await queryInterface.dropTable(
      'ProgramDonasis'
    );

  }

};