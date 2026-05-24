'use strict';

module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('DetailPenanamans', {

      id_penanaman: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,

        references: {
          model: 'Penanamans',
          key: 'id_penanaman'
        },

        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      id_user: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,

        references: {
          model: 'Users',
          key: 'id_user'
        },

        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    await queryInterface.dropTable('DetailPenanamans');

  }

};