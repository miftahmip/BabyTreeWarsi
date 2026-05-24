module.exports = (sequelize,DataTypes) => {

  const ProgramDonasi =
    sequelize.define(
      'ProgramDonasi',
      {

        id_program: {
          type: DataTypes.STRING,
          primaryKey: true
        },

        created_by_user_id:
          DataTypes.STRING,

        judul_program:
          DataTypes.STRING,

        flyer_program:
          DataTypes.STRING,

        deskripsi:
          DataTypes.TEXT,

        pohon_terkumpul:
          DataTypes.INTEGER,

        harga_pohon:
          DataTypes.INTEGER,

        tanggal_mulai:
          DataTypes.DATEONLY,

        tanggal_selesai:
          DataTypes.DATEONLY,


        status_program:
          DataTypes.ENUM(
            'aktif',
            'selesai'
          ),

        kode_kelurahan:
          DataTypes.STRING,

        kode_kecamatan:
          DataTypes.STRING,

        kode_kbp_kota:
          DataTypes.STRING,

        kode_provinsi:
          DataTypes.STRING

      },
      {
        tableName:
          'ProgramDonasis'
      }
    );

  ProgramDonasi.associate =
    function (models) {

      ProgramDonasi.belongsTo(models.User, {
        foreignKey:'created_by_user_id',
        as: 'creator'
      });

      ProgramDonasi.hasMany(models.Donasi, {
        foreignKey: 'id_program',
        as: 'donasi'
      });

      ProgramDonasi.hasMany(models.Penanaman, {
        foreignKey: 'id_program',
        as: 'penanaman'
      });
    };

  return ProgramDonasi;

};