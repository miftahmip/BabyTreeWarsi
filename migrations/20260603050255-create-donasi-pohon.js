'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('donasi_pohon', {

      id_donasi: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'donasis',
          key: 'id_donasi'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      id_pohon: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'pohons',
          key: 'id_pohon'
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
    await queryInterface.dropTable('donasi_pohon');
  }
};