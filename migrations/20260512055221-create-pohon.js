'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('Pohons', {

      id_pohon: {
        type: Sequelize.STRING,
        primaryKey: true
      },

      id_penanaman: {
        type: Sequelize.STRING,
        allowNull: false,

        references: {
          model: 'Penanamans',
          key: 'id_penanaman'
        },

        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      id_mitra: {
        type: Sequelize.STRING,
        allowNull: false,

        references: {
          model: 'Mitras',
          key: 'id_mitra'
        },

        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      id_jenis_pohon: {
        type: Sequelize.STRING,
        allowNull: false,

        references: {
          model: 'JenisPohons',
          key: 'id_jenis_pohon'
        },

        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      tgl_tanam: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },

      latitude: {
        type: Sequelize.DECIMAL(10,8),
        allowNull: false
      },

      longitude: {
        type: Sequelize.DECIMAL(10,8),
        allowNull: false
      },

      foto_bukti_tanam: {
        type: Sequelize.STRING,
        allowNull: true
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

  async down(queryInterface, Sequelize) {

    await queryInterface.dropTable('Pohons');


  }
};