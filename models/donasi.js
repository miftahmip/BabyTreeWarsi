'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Donasi extends Model {
    static associate(models) {
      // relasi ke Program
      Donasi.belongsTo(models.ProgramDonasi, {
        foreignKey: 'id_program',
        as: 'program'
      });

      // relasi ke User
      Donasi.belongsTo(models.User, {
        foreignKey: 'id_user',
        as: 'user'
      });

      Donasi.hasMany(models.Payment, {
        foreignKey: 'id_donasi',
        as: 'payments'
      });
    }
  }

  Donasi.init({
    id_donasi: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    id_program: {
      type: DataTypes.STRING,
      allowNull: false
    },
    id_user: {
      type: DataTypes.STRING,
      allowNull: false
    },
    jumlah_pohon: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nominal_donasi: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    tanggal_donasi: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Donasi',
    tableName: 'Donasis'
  });

  return Donasi;
};