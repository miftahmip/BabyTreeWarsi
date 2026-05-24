const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {

    const pass = await bcrypt.hash('12345678', 10);

    await queryInterface.bulkInsert('Users', [
      {
        id_user: 'USR0001',
        email: 'admin@system.com',
        password: pass,
        nama_lengkap: 'Admin Pusat',
        role: 'admin_pusat',
        status: 'aktif',
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', {
      id_user: [
        'USR0001'
      ]
    });
  }
};