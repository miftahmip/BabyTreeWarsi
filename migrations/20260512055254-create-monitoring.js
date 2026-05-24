'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('Monitorings', {

      id_monitoring: {
        type: Sequelize.STRING,
        primaryKey: true
      },

      tahap_monitoring: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      tgl_monitoring: {
        type: Sequelize.DATEONLY,
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

  async down(queryInterface) {
    await queryInterface.dropTable('Monitorings');
  }
};