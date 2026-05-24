module.exports = (sequelize, DataTypes) => {

  const DetailPenanaman = sequelize.define('DetailPenanaman', {

    id_penanaman: {
      type: DataTypes.STRING,
      primaryKey: true
    },

    id_user: {
      type: DataTypes.STRING,
      primaryKey: true
    }

  }, {
    tableName: 'DetailPenanamans'
  });

  DetailPenanaman.associate = (models) => {

    DetailPenanaman.belongsTo(models.Penanaman, {
      foreignKey: 'id_penanaman',
      as: 'penanaman'
    });

    DetailPenanaman.belongsTo(models.User, {
      foreignKey: 'id_user',
      as: 'petugas'
    });

  };

  return DetailPenanaman;
};