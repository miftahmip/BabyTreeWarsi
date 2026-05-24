'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('DetailMonitorings', {

      id_monitoring: {
        type: Sequelize.STRING,
        primaryKey: true,

        references: {
          model: 'Monitorings',
          key: 'id_monitoring'
        },

        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      id_pohon: {
        type: Sequelize.STRING,
        primaryKey: true,

        references: {
          model: 'Pohons',
          key: 'id_pohon'
        },

        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      tinggi_pohon: {
        type: Sequelize.FLOAT,
        allowNull: true
      },

      diameter_pohon: {
        type: Sequelize.FLOAT,
        allowNull: true
      },

      kesehatan_batang: {
        type: Sequelize.STRING,
        allowNull: true
      },

      foto_monitoring: {
        type: Sequelize.STRING,
        allowNull: true
      },

      deskripsi: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      status: {
        type: Sequelize.ENUM(
          'hidup',
          'mati'
        ),
        allowNull: false
      },

      status_verifikasi: {
        type: Sequelize.ENUM(
          'menunggu',
          'disetujui',
          'revisi'
        ),
        defaultValue: 'menunggu'
      },

      catatan_koreksi: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      verified_by_user_id: {
        type: Sequelize.STRING,
        allowNull: true,

        references: {
          model: 'Users',
          key: 'id_user'
        },

        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

  async down(queryInterface) {

    await queryInterface.dropTable('DetailMonitorings');

  }
};