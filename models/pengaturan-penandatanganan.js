'use strict';
const { Model, Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PengaturanPenandatangan extends Model {
    static associate(models) {
      PengaturanPenandatangan.belongsTo(models.User, {
        foreignKey: 'id_user',
        as: 'user'
      });

      PengaturanPenandatangan.hasMany(models.Sertifikat, {
        foreignKey: 'id_pengaturan',
        as: 'sertifikat'
      });
    }
  }

  PengaturanPenandatangan.init(
    {
      id_pengaturan: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      },
      id_user: {
        type: DataTypes.STRING,
        allowNull: false
      },
      jabatan: {
        type: DataTypes.STRING,
        allowNull: false
      },
      ttd_file: {
        type: DataTypes.STRING,
        allowNull: false
      },
      is_aktif: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      sequelize,
      modelName: 'PengaturanPenandatangan',
      tableName: 'pengaturan_penandatangan',
      hooks: {
        async beforeCreate(instance, options) {
          if (instance.is_aktif) {
            await PengaturanPenandatangan.update(
              { is_aktif: false },
              {
                where: { is_aktif: true },
                transaction: options.transaction
              }
            );
          }
        },
        async beforeUpdate(instance, options) {
          if (instance.changed('is_aktif') && instance.is_aktif) {
            await PengaturanPenandatangan.update(
              { is_aktif: false },
              {
                where: {
                  is_aktif: true,
                  id_pengaturan: { [Op.ne]: instance.id_pengaturan }
                },
                transaction: options.transaction
              }
            );
          }
        }
      }
    }
  );

  return PengaturanPenandatangan;
};