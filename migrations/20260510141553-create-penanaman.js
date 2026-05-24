'use strict';

module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('Penanamans', {

      id_penanaman: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },

      id_program: {
        type: Sequelize.STRING,
        allowNull: false,

        references: {
          model: 'ProgramDonasis',
          key: 'id_program'
        },

        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

        tanggal_mulai: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },

        tanggal_selesai: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },

      status_penanaman: {

        type: Sequelize.ENUM(
          'aktif',
          'selesai'
        ),

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

    await queryInterface.dropTable('Penanamans');

  }

};