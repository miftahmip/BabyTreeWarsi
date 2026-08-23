'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Sertifikats', {
      id_sertifikat: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      id_pengaturan: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'pengaturan_penandatangan',
          key: 'id_pengaturan'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      no_sertifikat: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      total_pohon_akumulasi: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      tgl_terbit: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      tgl_update_terakhir: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      url_sertifikat: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status_sertifikat: {
        type: Sequelize.ENUM('aktif', 'dicabut'),
        allowNull: false,
        defaultValue: 'aktif'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Sertifikats');
  }
};