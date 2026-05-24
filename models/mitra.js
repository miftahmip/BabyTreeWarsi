'use strict';

const {Model} = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class Mitra extends Model {

    static associate(models) {

    Mitra.hasMany(models.Pohon, {
      foreignKey: 'id_mitra',
      as: 'pohon'
    });

    }
  }

  Mitra.init({

    id_mitra: {
      type: DataTypes.STRING,
      primaryKey: true
    },

    nama_mitra: {
      type: DataTypes.STRING,
      allowNull: false
    },

    lembaga: {
      type: DataTypes.STRING,
      allowNull: true
    },

    kontak: {
      type: DataTypes.STRING,
      allowNull: false
    },

    no_rekening: {
      type: DataTypes.STRING,
      allowNull: false
    },

    bank: {
      type: DataTypes.STRING,
      allowNull: false
    },

    atas_nama_bank: {
      type: DataTypes.STRING,
      allowNull: false
    }

  }, {

    sequelize,
    modelName: 'Mitra'

  });

  return Mitra;
};