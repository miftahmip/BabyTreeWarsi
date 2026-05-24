'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class Monitoring extends Model {

    static associate(models) {

      Monitoring.hasMany(models.DetailMonitoring, {
        foreignKey: 'id_monitoring',
        as: 'detailMonitoring'
      });

    }
  }

  Monitoring.init({

    id_monitoring: {
      type: DataTypes.STRING,
      primaryKey: true
    },

    tahap_monitoring: DataTypes.INTEGER,

    tgl_monitoring: DataTypes.DATEONLY

  }, {

    sequelize,
    modelName: 'Monitoring'

  });

  return Monitoring;
};