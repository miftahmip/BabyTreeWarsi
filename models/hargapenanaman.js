// models/hargapenanaman.js

module.exports = (sequelize, DataTypes) => {

  const HargaPenanaman = sequelize.define('HargaPenanaman', {

    id_harga_penanaman: {
      type: DataTypes.STRING,
      primaryKey: true
    },

    id_penanaman: {
      type: DataTypes.STRING,
      allowNull: false
    },

    tahap: {
      type: DataTypes.ENUM(
        'penanaman',
        'monitoring_1',
        'monitoring_2',
        'monitoring_3'
      ),
      allowNull: false
    },

    harga_per_pohon: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    created_by: {
      type: DataTypes.STRING
    }

  }, {
    tableName: 'HargaPenanamans'
  });

  HargaPenanaman.associate = (models) => {

    HargaPenanaman.belongsTo(models.Penanaman, {
      foreignKey: 'id_penanaman',
      as: 'penanaman'
    });

  };

  return HargaPenanaman;

};