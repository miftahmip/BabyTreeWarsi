module.exports = (sequelize, DataTypes) => {

  const Penanaman = sequelize.define('Penanaman', {

    id_penanaman: {
      type: DataTypes.STRING,
      primaryKey: true
    },

    id_program:
    DataTypes.STRING,

    tanggal_mulai:
    DataTypes.DATEONLY,

    tanggal_selesai:
    DataTypes.DATEONLY,

    status_penanaman: {
      type: DataTypes.ENUM(
        'aktif',
        'selesai'
      ),
      defaultValue: 'aktif'
    },


  }, {
    tableName: 'Penanamans'
  });

  Penanaman.associate = (models) => {

    Penanaman.belongsTo(models.ProgramDonasi, {
      foreignKey: 'id_program',
      as: 'program'
    });


    Penanaman.hasMany(models.DetailPenanaman, {
      foreignKey: 'id_penanaman',
      as: 'detailPenanaman'
    });

    Penanaman.hasMany(models.Pohon, {
      foreignKey: 'id_penanaman',
      as: 'pohon'
    });

    Penanaman.hasMany(models.HargaPenanaman, {
      foreignKey: 'id_penanaman',
      as: 'hargaPenanaman'
    });

  };

  return Penanaman;
};