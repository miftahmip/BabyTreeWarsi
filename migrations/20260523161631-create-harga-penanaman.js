// migrations/xxxx-create-harga-penanaman.js

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('HargaPenanamans', {

      id_harga_penanaman: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
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

      tahap: {
        type: Sequelize.ENUM(
          'penanaman',
          'monitoring_1',
          'monitoring_2',
          'monitoring_3'
        ),
        allowNull: false
      },

      harga_per_pohon: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      created_by: {
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

  async down(queryInterface, Sequelize) {

    await queryInterface.dropTable('HargaPenanamans');

  }
};