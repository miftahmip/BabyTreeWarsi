'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class JenisPohon extends Model {

    static associate(models) {

      JenisPohon.hasMany(models.Pohon, {
        foreignKey: 'id_jenis_pohon',
        as: 'pohon'
      });

    }
  }

  JenisPohon.init({

    id_jenis_pohon: {
      type: DataTypes.STRING,
      primaryKey: true
    },

    nama_pohon: DataTypes.STRING,

    nama_latin: DataTypes.STRING

  }, {

    sequelize,
    modelName: 'JenisPohon'

  });

  return JenisPohon;
};