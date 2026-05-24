const bcrypt = require('bcryptjs');
const axios = require('axios');
const { User } = require('../models');

class UserManagementController {
    static async index(req, res) {
        try {

            const users = await User.findAll({
                where: {
                    role: [
                        'admin_wilayah',
                        'petugas_lapangan',
                        'pimpinan'
                    ]
                },
                order: [['createdAt', 'DESC']]
            });

            const response = await axios.get(
                'https://wilayah.id/api/provinces.json'
            );

            const provinces =
                response.data.data || [];

            return res.render(
                'admin-pusat/kelola-akun',
                {
                    pageTitle: 'Kelola Akun',
                    activePage: 'kelola-akun',
                    user: req.user,
                    users,
                    provinces
                }
            );

        } catch (error) {
            return res.send(error.message);
        }
    }

    static async store(req, res) {
        try {

            const {
                nama_lengkap,
                email,
                no_telepon,
                password,
                role,
                kode_provinsi
            } = req.body;

            const allowedRoles = [
                'admin_wilayah',
                'petugas_lapangan',
                'pimpinan'
            ];

            if (
                !nama_lengkap ||
                !email ||
                !no_telepon ||
                !password ||
                !role
            ) {
                return res.send(
                    'Semua field wajib diisi'
                );
            }

            if (
                !allowedRoles.includes(role)
            ) {
                return res.send(
                    'Role tidak valid'
                );
            }

            if (
                role === 'admin_wilayah' &&
                !kode_provinsi
            ) {
                return res.send(
                    'Provinsi wajib dipilih'
                );
            }

            const checkEmail =
                await User.findOne({
                    where: { email }
                });

            if (checkEmail) {
                return res.send(
                    'Email sudah digunakan'
                );
            }

            const totalUser =
                await User.count();

            const id_user =
                'USR' +
                String(totalUser + 1)
                    .padStart(4, '0');

            const hashPassword =
                await bcrypt.hash(
                    password,
                    10
                );

            await User.create({
                id_user,
                kode_provinsi:
                    role === 'admin_wilayah'
                        ? kode_provinsi
                        : null,

                email,
                password:
                    hashPassword,
                nama_lengkap,
                no_telepon,
                role,
                status: 'aktif'
            });

            return res.redirect(
                '/admin-pusat/kelola-akun'
            );

        } catch (error) {
            return res.send(error.message);
        }
    }

    static async update(req, res) {
        try {

            const { id } = req.params;

            const {
                nama_lengkap,
                email,
                no_telepon,
                role,
                kode_provinsi,
                status
            } = req.body;

            const userData =
                await User.findByPk(id);

            if (!userData) {
                return res.send(
                    'User tidak ditemukan'
                );
            }

            const allowedRoles = [
                'admin_wilayah',
                'petugas_lapangan',
                'pimpinan'
            ];

            if (
                !allowedRoles.includes(role)
            ) {
                return res.send(
                    'Role tidak valid'
                );
            }

            await userData.update({
                nama_lengkap,
                email,
                no_telepon,
                role,

                kode_provinsi:
                    role === 'admin_wilayah'
                        ? kode_provinsi
                        : null,

                status
            });

            return res.redirect(
                '/admin-pusat/kelola-akun'
            );

        } catch (error) {
            return res.send(error.message);
        }
    }

    static async destroy(req, res) {
        try {

            const { id } = req.params;

            const userData =
                await User.findByPk(id);

            if (!userData) {
                return res.send(
                    'User tidak ditemukan'
                );
            }

            await userData.destroy();

            return res.redirect(
                '/admin-pusat/kelola-akun'
            );

        } catch (error) {
            return res.send(error.message);
        }
    }

}

module.exports = UserManagementController;