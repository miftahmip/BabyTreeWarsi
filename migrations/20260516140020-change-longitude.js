'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.changeColumn('Pohons', 'latitude', {
      type: Sequelize.DECIMAL(12,8),
      allowNull: false
    });

    await queryInterface.changeColumn('Pohons', 'longitude', {
      type: Sequelize.DECIMAL(12,8),
      allowNull: false
    });

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.changeColumn('Pohons', 'latitude', {
      type: Sequelize.DECIMAL(10,8),
      allowNull: false
    });

    await queryInterface.changeColumn('Pohons', 'longitude', {
      type: Sequelize.DECIMAL(10,8),
      allowNull: false
    });

  }
};