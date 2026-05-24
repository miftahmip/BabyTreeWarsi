'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('JenisPohons', {

      id_jenis_pohon: {
        type: Sequelize.STRING,
        primaryKey: true
      },

      nama_pohon: {
        type: Sequelize.STRING,
        allowNull: false
      },

      nama_latin: {
        type: Sequelize.STRING,
        allowNull: true
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
    await queryInterface.dropTable('JenisPohons');
  }
};