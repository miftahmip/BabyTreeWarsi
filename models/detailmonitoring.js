'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class DetailMonitoring extends Model {

    static associate(models) {

      DetailMonitoring.belongsTo(models.Monitoring, {
        foreignKey: 'id_monitoring',
        as: 'monitoring'
      });

      DetailMonitoring.belongsTo(models.Pohon, {
        foreignKey: 'id_pohon',
        as: 'pohon'
      });

      DetailMonitoring.belongsTo(models.User, {
        foreignKey: 'verified_by_user_id',
        as: 'verifikator'
      });

    }
  }

  DetailMonitoring.init({

    id_monitoring: {
      type: DataTypes.STRING,
      primaryKey: true
    },

    id_pohon: {
      type: DataTypes.STRING,
      primaryKey: true
    },

    tinggi_pohon: DataTypes.FLOAT,

    diameter_pohon: DataTypes.FLOAT,

    kesehatan_batang: DataTypes.STRING,

    foto_monitoring: DataTypes.TEXT,

    deskripsi: DataTypes.TEXT,

    status: DataTypes.ENUM(
      'hidup',
      'mati'
    ),

    status_verifikasi: DataTypes.ENUM(
      'menunggu',
      'disetujui',
      'revisi'
    ),

    catatan_koreksi: DataTypes.TEXT,

    verified_by_user_id: DataTypes.STRING

  }, {

    sequelize,
    modelName: 'DetailMonitoring'

  });

  return DetailMonitoring;
};