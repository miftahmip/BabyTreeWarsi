'use strict';

module.exports = {

  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PasswordResets', {

      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
        onDelete: 'CASCADE'
      },

      token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      expiry: {
        type: Sequelize.DATE,
        allowNull: false
      },

      used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }

    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('PasswordResets');
  }

};