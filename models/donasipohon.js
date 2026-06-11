'use strict';

module.exports = (sequelize, DataTypes) => {

  const DonasiPohon = sequelize.define(
    'DonasiPohon',
    {

      id_donasi: {
        type: DataTypes.STRING,
        primaryKey: true
      },

      id_pohon: {
        type: DataTypes.STRING,
        primaryKey: true
      }

    },
    {
      tableName: 'donasi_pohon'
    }
  );

  DonasiPohon.associate = function(models) {

    DonasiPohon.belongsTo(models.Donasi, {
      foreignKey: 'id_donasi',
      as: 'donasi'
    });

    DonasiPohon.belongsTo(models.Pohon, {
      foreignKey: 'id_pohon',
      as: 'pohon'
    });

  };

  return DonasiPohon;

};