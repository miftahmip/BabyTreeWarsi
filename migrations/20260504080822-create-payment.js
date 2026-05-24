'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },

      id_donasi: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'donasis',
          key: 'id_donasi'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      order_id: {
        type: Sequelize.STRING(100)
      },

      transaction_id: {
        type: Sequelize.STRING(100)
      },

      payment_type: {
        type: Sequelize.STRING
      },

      payment_channel: {
        type: Sequelize.STRING
      },

      gross_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },

      status: {
        type: Sequelize.ENUM(
        'pending',
        'settlement',
        'failed',
        'expired',
        'cancelled'
      ),
      defaultValue: 'pending'
      },

      transaction_time: {
        type: Sequelize.DATE
      },

      settlement_time: {
        type: Sequelize.DATE
      },

      expiry_time: {
        type: Sequelize.DATE
      },

      va_number: {
        type: Sequelize.STRING
      },

      raw_response: {
        type: Sequelize.JSON
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },

      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  }
};