'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      // relasi ke Donasi
      Payment.belongsTo(models.Donasi, {
        foreignKey: 'id_donasi',
        as: 'donasi'
      });
    }
  }

  Payment.init({
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },

    id_donasi: {
      type: DataTypes.STRING,
      allowNull: false
    },

    order_id: 
    DataTypes.STRING(100),

    transaction_id: 
    DataTypes.STRING(100),

    payment_type: 
    DataTypes.STRING,

    payment_channel: 
    DataTypes.STRING,

    gross_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },

    status: {
      type: DataTypes.ENUM(
        'pending',
        'settlement',
        'failed',
        'expired',
        'cancelled'
      ),
      defaultValue: 'pending'
    },

    transaction_time: 
    DataTypes.DATE,

    settlement_time: 
    DataTypes.DATE,

    expiry_time: 
    DataTypes.DATE,

    va_number: 
    DataTypes.STRING,

    raw_response: 
    DataTypes.JSON

  }, {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',

  timestamps: true,

  createdAt: 'created_at',
  updatedAt: 'updated_at'
  });

  return Payment;
};