'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Donasis', 'id_sertifikat', {
      type: Sequelize.STRING,
      allowNull: true, // nullable: donasi belum tentu sudah terhubung ke sertifikat
      references: {
        model: 'Sertifikats',
        key: 'id_sertifikat'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Donasis', 'id_sertifikat');
  }
};