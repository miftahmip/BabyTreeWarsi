'use strict';

module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('Mitras', {

      id_mitra: {
        type: Sequelize.STRING,
        primaryKey: true
      },

      nama_mitra: {
        type: Sequelize.STRING,
        allowNull: false
      },

      lembaga: {
        type: Sequelize.STRING,
        allowNull: true
      },

      kontak: {
        type: Sequelize.STRING,
        allowNull: false
      },

      no_rekening: {
        type: Sequelize.STRING,
        allowNull: false
      },

      bank: {
        type: Sequelize.STRING,
        allowNull: false
      },

      atas_nama_bank: {
        type: Sequelize.STRING,
        allowNull: false
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

    await queryInterface.dropTable('Mitras');

  }

};