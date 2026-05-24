'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Pohons', 'foto_bukti_tanam', {
      type: Sequelize.TEXT,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Pohons', 'foto_bukti_tanam', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};