'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('DetailMonitorings', 'foto_monitoring', {
      type: Sequelize.TEXT,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('DetailMonitorings', 'foto_monitoring', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
