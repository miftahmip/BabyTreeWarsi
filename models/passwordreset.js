'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PasswordReset extends Model {}

  PasswordReset.init({

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    id_user: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id_user'
      }
    },

    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    expiry: {
      type: DataTypes.DATE,
      allowNull: false
    },

    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }

  }, {
    sequelize,
    modelName: 'PasswordReset',
    tableName: 'PasswordResets',
    timestamps: true
  });

  PasswordReset.associate = function (models) {
    PasswordReset.belongsTo(models.User, {
      foreignKey: 'id_user',
      as: 'user'
    });
  };

  return PasswordReset;
};