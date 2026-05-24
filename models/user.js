'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {}

  User.init({
    id_user: {
      type: DataTypes.STRING,
      primaryKey: true
    },

    kode_provinsi: 
    DataTypes.STRING,

    email: 
    DataTypes.STRING,

    password: 
    DataTypes.STRING,

    nama_lengkap: 
    DataTypes.STRING,

    no_telepon: 
    DataTypes.STRING,
    
    role: {
      type: DataTypes.ENUM(
        'admin_pusat',
        'admin_wilayah',
        'petugas_lapangan',
        'donatur_umum',
        'donatur_corporate',
        'pimpinan'
      )
    },
    
    status: {
      type: DataTypes.ENUM('aktif', 'nonaktif')
    },

  }, {
    sequelize,
    modelName: 'User'
  });

  User.associate = function (models) {

    User.hasMany(models.ProgramDonasi, {
      foreignKey: 'created_by_user_id',
      as: 'program_donasi'
    });

    User.hasMany(models.DetailPenanaman, {
      foreignKey: 'id_user',
      as: 'detailPenanaman'
    });

    User.hasMany(models.Pohon, {
      foreignKey: 'verified_by_user_id',
      as: 'verifikasiPohon'
    });

    // VERIFIKASI MONITORING
    User.hasMany(models.DetailMonitoring, {
      foreignKey: 'verified_by_user_id',
      as: 'verifikasiMonitoring'
    });

  };

  return User;
};