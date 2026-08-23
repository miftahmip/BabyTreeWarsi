'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Sertifikat extends Model {
    static associate(models) {
      Sertifikat.belongsTo(models.PengaturanPenandatangan, {
        foreignKey: 'id_pengaturan',
        as: 'penandatangan'
      });

      Sertifikat.hasMany(models.Donasi, {
        foreignKey: 'id_sertifikat',
        as: 'donasi'
      });
    }
  }

  Sertifikat.init(
    {
      id_sertifikat: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      },
      id_pengaturan: {
        type: DataTypes.STRING,
        allowNull: false
      },
      no_sertifikat: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      total_pohon_akumulasi: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      tgl_terbit: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      tgl_update_terakhir: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      url_sertifikat: {
        type: DataTypes.STRING,
        allowNull: true
      },
      status_sertifikat: {
        type: DataTypes.ENUM('aktif', 'dicabut'),
        allowNull: false,
        defaultValue: 'aktif'
      }
    },
    {
      sequelize,
      modelName: 'Sertifikat',
      tableName: 'Sertifikats'
    }
  );

  return Sertifikat;
};