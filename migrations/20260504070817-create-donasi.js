'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Donasis', {
      id_donasi: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      id_program: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Programdonasis', 
          key: 'id_program'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_user: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Users', 
          key: 'id_user'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      jumlah_pohon: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      nominal_donasi: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      tanggal_donasi: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('Donasis');
  }
};