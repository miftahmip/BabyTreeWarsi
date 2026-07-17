const AuthController = require('../../controllers/authController');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

jest.mock('../../models');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthController', () => {

    let req;
    let res;

    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});

        req = {
            body: {},
            query: {}
        };

        res = {
            send: jest.fn(),
            redirect: jest.fn(),
            render: jest.fn(),
            cookie: jest.fn(),
            clearCookie: jest.fn()
        };

        jest.clearAllMocks();

        process.env.JWT_SECRET = 'secret';
        process.env.JWT_EXPIRES = '1d';
    });


    describe('loginPage', () => {

        test('render login page', () => {

            req.query = {
                email: 'test@mail.com',
                returnUrl: '/donasi'
            };

            AuthController.loginPage(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'login',
                {
                    formEmail: 'test@mail.com',
                    returnUrl: '/donasi'
                }
            );
        });

        test('loginPage tanpa query', () => {

            req.query = {};

            AuthController.loginPage(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'login',
                {
                    formEmail: '',
                    returnUrl: ''
                }
            );
        });

    });


    describe('registerPage', () => {

        test('render register page', () => {

            req.query = {
                email: 'test@mail.com',
                nama: 'Miftah',
                returnUrl: '/donasi'
            };

            AuthController.registerPage(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'register',
                {
                    formEmail: 'test@mail.com',
                    formNama: 'Miftah',
                    returnUrl: '/donasi'
                }
            );
        });

        test('registerPage tanpa query', () => {

            req.query = {};

            AuthController.registerPage(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'register',
                {
                    formEmail: '',
                    formNama: '',
                    returnUrl: ''
                }
            );
        });

    });


    describe('register', () => {

        test('role tidak valid', async () => {

            req.body = {
                role: 'admin'
            };

            await AuthController.register(req, res);

            expect(res.send)
                .toHaveBeenCalledWith('Role tidak valid');
        });

        test('field wajib kosong', async () => {

            req.body = {
                role: 'donatur_umum',
                nama_lengkap: '',
                email: '',
                no_telepon: '',
                password: '',
                konfirmasi_password: ''
            };

            await AuthController.register(req, res);

            expect(res.send)
                .toHaveBeenCalledWith('Semua field wajib diisi');
        });

        test('konfirmasi password tidak sesuai', async () => {

            req.body = {
                role: 'donatur_umum',
                nama_lengkap: 'Miftah',
                email: 'test@mail.com',
                no_telepon: '08123',
                password: '12345678',
                konfirmasi_password: '87654321'
            };

            await AuthController.register(req, res);

            expect(res.send)
                .toHaveBeenCalledWith(
                    'Konfirmasi password tidak sesuai'
                );
        });

        test('password kurang dari 8 karakter', async () => {

            req.body = {
                role: 'donatur_umum',
                nama_lengkap: 'Miftah',
                email: 'test@mail.com',
                no_telepon: '08123',
                password: '123456',
                konfirmasi_password: '123456'
            };

            await AuthController.register(req, res);

            expect(res.send)
                .toHaveBeenCalledWith(
                    'Password minimal 8 karakter'
                );
        });

        test('email sudah terdaftar', async () => {

            User.findOne.mockResolvedValue({
                id_user: 'USR0001'
            });

            req.body = {
                role: 'donatur_umum',
                nama_lengkap: 'Miftah',
                email: 'test@mail.com',
                no_telepon: '08123',
                password: '12345678',
                konfirmasi_password: '12345678'
            };

            await AuthController.register(req, res);

            expect(res.send)
                .toHaveBeenCalledWith(
                    'Email sudah terdaftar'
                );
        });

        test('register berhasil redirect home', async () => {

            User.findOne.mockResolvedValue(null);

            User.count.mockResolvedValue(1);

            bcrypt.hash.mockResolvedValue(
                'hashedPassword'
            );

            User.create.mockResolvedValue({});

            req.body = {
                role: 'donatur_umum',
                nama_lengkap: 'Miftah',
                email: 'test@mail.com',
                no_telepon: '08123',
                password: '12345678',
                konfirmasi_password: '12345678'
            };

            await AuthController.register(req, res);

            expect(User.create)
                .toHaveBeenCalled();

            expect(res.redirect)
                .toHaveBeenCalledWith('/');
        });

        test('register berhasil dengan returnUrl', async () => {

            User.findOne.mockResolvedValue(null);

            User.count.mockResolvedValue(1);

            bcrypt.hash.mockResolvedValue(
                'hashedPassword'
            );

            User.create.mockResolvedValue({});

            req.body = {
                role: 'donatur_umum',
                nama_lengkap: 'Miftah',
                email: 'test@mail.com',
                no_telepon: '08123',
                password: '12345678',
                konfirmasi_password: '12345678',
                returnUrl: '/donasi'
            };

            await AuthController.register(req, res);

            expect(res.redirect)
                .toHaveBeenCalled();
        });

        test('error database register', async () => {

            User.findOne.mockRejectedValue(
                new Error('Database Error')
            );

            req.body = {
                role: 'donatur_umum',
                nama_lengkap: 'Miftah',
                email: 'test@mail.com',
                no_telepon: '08123',
                password: '12345678',
                konfirmasi_password: '12345678'
            };

            await AuthController.register(req, res);

            expect(res.send)
                .toHaveBeenCalledWith(
                    'Database Error'
                );
        });

    });


    describe('login', () => {

        test('email tidak ditemukan', async () => {

            User.findOne.mockResolvedValue(null);

            req.body = {
                email: 'test@mail.com',
                password: '12345678'
            };

            await AuthController.login(req, res);

            expect(res.render)
                .toHaveBeenCalledWith(
                    'login',
                    expect.objectContaining({
                        error: expect.any(String)
                    })
                );
        });

        test('error sistem login tanpa email', async () => {

            User.findOne.mockRejectedValue(
                new Error('DB Error')
            );

            req.body = {};

            await AuthController.login(req, res);

            expect(res.render)
                .toHaveBeenCalledWith(
                    'login',
                    expect.objectContaining({
                        formEmail: ''
                    })
                );
        });

        test('akun nonaktif', async () => {

            User.findOne.mockResolvedValue({
                status: 'nonaktif'
            });

            req.body = {
                email: 'test@mail.com',
                password: '12345678'
            };

            await AuthController.login(req, res);

            expect(res.render)
                .toHaveBeenCalled();
        });

        test('password salah', async () => {

            User.findOne.mockResolvedValue({
                status: 'aktif',
                password: 'hash'
            });

            bcrypt.compare.mockResolvedValue(false);

            req.body = {
                email: 'test@mail.com',
                password: '12345678'
            };

            await AuthController.login(req, res);

            expect(res.render)
                .toHaveBeenCalled();
        });

        test('login admin pusat berhasil', async () => {

            User.findOne.mockResolvedValue({
                id_user: 'USR001',
                nama_lengkap: 'Admin',
                role: 'admin_pusat',
                status: 'aktif',
                password: 'hash'
            });

            bcrypt.compare.mockResolvedValue(true);

            jwt.sign.mockReturnValue('token123');

            req.body = {
                email: 'admin@mail.com',
                password: '12345678'
            };

            await AuthController.login(req, res);

            expect(res.cookie)
                .toHaveBeenCalled();

            expect(res.redirect)
                .toHaveBeenCalledWith(
                    '/admin-pusat/dashboard'
                );
        });

        test('login admin wilayah berhasil', async () => {

            User.findOne.mockResolvedValue({
                id_user: 'USR001',
                nama_lengkap: 'Admin Wilayah',
                role: 'admin_wilayah',
                kode_provinsi: '13',
                status: 'aktif',
                password: 'hash'
            });

            bcrypt.compare.mockResolvedValue(true);

            jwt.sign.mockReturnValue('token123');

            req.body = {
                email: 'admin@mail.com',
                password: '12345678'
            };

            await AuthController.login(req, res);

            expect(jwt.sign)
                .toHaveBeenCalled();

            expect(res.redirect)
                .toHaveBeenCalledWith(
                    '/admin-wilayah/dashboard'
                );
        });

        test('login donatur dengan returnUrl', async () => {

            User.findOne.mockResolvedValue({
                id_user: 'USR001',
                nama_lengkap: 'Donatur',
                role: 'donatur_umum',
                status: 'aktif',
                password: 'hash'
            });

            bcrypt.compare.mockResolvedValue(true);

            jwt.sign.mockReturnValue('token123');

            req.body = {
                email: 'donatur@mail.com',
                password: '12345678',
                returnUrl: '/checkout'
            };

            await AuthController.login(req, res);

            expect(res.redirect)
                .toHaveBeenCalledWith(
                    '/checkout'
                );
        });

        test('login petugas lapangan berhasil', async () => {

            User.findOne.mockResolvedValue({
                id_user: 'USR001',
                nama_lengkap: 'Petugas',
                role: 'petugas_lapangan',
                status: 'aktif',
                password: 'hash'
            });

            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token123');

            req.body = {
                email: 'petugas@mail.com',
                password: '12345678'
            };

            await AuthController.login(req, res);

            expect(res.redirect)
                .toHaveBeenCalledWith(
                    '/petugas-lapangan/dashboard'
                );
        });

        test('login donatur umum berhasil', async () => {

            User.findOne.mockResolvedValue({
                id_user: 'USR001',
                nama_lengkap: 'Donatur',
                role: 'donatur_umum',
                status: 'aktif',
                password: 'hash'
            });

            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token123');

            req.body = {
                email: 'donatur@mail.com',
                password: '12345678'
            };

            await AuthController.login(req, res);

            expect(res.redirect)
                .toHaveBeenCalledWith(
                    '/donatur/donasi-saya'
                );
        });

        test('login donatur corporate berhasil', async () => {

            User.findOne.mockResolvedValue({
                id_user: 'USR001',
                nama_lengkap: 'Corporate',
                role: 'donatur_corporate',
                status: 'aktif',
                password: 'hash'
            });

            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token123');

            req.body = {
                email: 'corp@mail.com',
                password: '12345678'
            };

            await AuthController.login(req, res);

            expect(res.redirect)
                .toHaveBeenCalledWith(
                    '/corporate/donasi-saya'
                );
        });

        test('login pimpinan berhasil', async () => {

            User.findOne.mockResolvedValue({
                id_user: 'USR001',
                nama_lengkap: 'Pimpinan',
                role: 'pimpinan',
                status: 'aktif',
                password: 'hash'
            });

            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token123');

            req.body = {
                email: 'pimpinan@mail.com',
                password: '12345678'
            };

            await AuthController.login(req, res);

            expect(res.redirect)
                .toHaveBeenCalledWith(
                    '/pimpinan/dashboard'
                );
        });

        test('role tidak valid', async () => {

            User.findOne.mockResolvedValue({
                id_user: 'USR001',
                nama_lengkap: 'Test',
                role: 'unknown',
                status: 'aktif',
                password: 'hash'
            });

            bcrypt.compare.mockResolvedValue(true);

            jwt.sign.mockReturnValue('token123');

            req.body = {
                email: 'test@mail.com',
                password: '12345678'
            };

            await AuthController.login(req, res);

            expect(res.send)
                .toHaveBeenCalledWith(
                    'Role tidak valid'
                );
        });

        test('error sistem login', async () => {

            User.findOne.mockRejectedValue(
                new Error('DB Error')
            );

            req.body = {
                email: 'test@mail.com',
                password: '12345678'
            };

            await AuthController.login(req, res);

            expect(res.render)
                .toHaveBeenCalledWith(
                    'login',
                    expect.objectContaining({
                        error: expect.any(String)
                    })
                );
        });

    });


    describe('logout', () => {

        test('logout berhasil', () => {

            AuthController.logout(req, res);

            expect(res.clearCookie)
                .toHaveBeenCalledWith(
                    'token'
                );

            expect(res.redirect)
                .toHaveBeenCalledWith(
                    '/login'
                );
        });

    });

});