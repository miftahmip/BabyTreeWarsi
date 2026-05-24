'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class Pohon extends Model {

    static associate(models) {

      Pohon.belongsTo(models.Penanaman, {
        foreignKey: 'id_penanaman',
        as: 'penanaman'
      });

      Pohon.belongsTo(models.Mitra, {
        foreignKey: 'id_mitra',
        as: 'mitra'
      });

      Pohon.belongsTo(models.JenisPohon, {
        foreignKey: 'id_jenis_pohon',
        as: 'jenisPohon'
      });

      Pohon.hasMany(models.DetailMonitoring, {
        foreignKey: 'id_pohon',
        as: 'detailMonitoring'
      });

      Pohon.belongsTo(models.User, {
        foreignKey: 'verified_by_user_id',
        as: 'verifikator'
      });

    }
  }

  Pohon.init({

    id_pohon: {
      type: DataTypes.STRING,
      primaryKey: true
    },

    id_penanaman: DataTypes.STRING,

    id_mitra: DataTypes.STRING,

    id_jenis_pohon: DataTypes.STRING,

    tgl_tanam: DataTypes.DATEONLY,

    latitude: DataTypes.DECIMAL(12,8),

    longitude: DataTypes.DECIMAL(12,8),

    foto_bukti_tanam: DataTypes.TEXT,

    status_verifikasi: DataTypes.ENUM(
      'menunggu',
      'disetujui',
      'revisi'
    ),

    catatan_koreksi: DataTypes.TEXT,

    verified_by_user_id: DataTypes.STRING

  }, {

    sequelize,
    modelName: 'Pohon'

  });

  return Pohon;
};