'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pengaturan_penandatangan', {
      id_pengaturan: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      id_user: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id_user'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      jabatan: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ttd_file: {
        type: Sequelize.STRING,
        allowNull: false
      },
      is_aktif: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

  },

  async down(queryInterface) {
    await queryInterface.dropTable('pengaturan_penandatangan');
  }
};