const jwt = require('jsonwebtoken');
const {
    verifyToken,
    allowRole
} = require('../../middlewares/authMiddleware');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {

    let req;
    let res;
    let next;

    beforeEach(() => {

        req = {
            cookies: {},
            user: null
        };

        res = {
            redirect: jest.fn(),
            send: jest.fn()
        };

        next = jest.fn();

        jest.clearAllMocks();
    });


    describe('verifyToken', () => {

        test('redirect jika token tidak ada', () => {

            req.cookies = {};

            verifyToken(req, res, next);

            expect(res.redirect)
                .toHaveBeenCalledWith('/login');

            expect(next)
                .not.toHaveBeenCalled();
        });

        test('berhasil verifikasi token', () => {

            req.cookies = {
                token: 'validtoken'
            };

            jwt.verify.mockReturnValue({
                id_user: 'USR001',
                role: 'admin_pusat'
            });

            verifyToken(req, res, next);

            expect(jwt.verify)
                .toHaveBeenCalledWith(
                    'validtoken',
                    process.env.JWT_SECRET
                );

            expect(req.user)
                .toBeDefined();

            expect(next)
                .toHaveBeenCalled();
        });

        test('token invalid / error', () => {

            req.cookies = {
                token: 'invalidtoken'
            };

            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            verifyToken(req, res, next);

            expect(res.redirect)
                .toHaveBeenCalledWith('/login');

            expect(next)
                .not.toHaveBeenCalled();
        });

    });


    describe('allowRole', () => {

        test('akses ditolak jika role tidak sesuai', () => {

            req.user = {
                role: 'user_biasa'
            };

            const middleware = allowRole('admin_pusat', 'admin_wilayah');

            middleware(req, res, next);

            expect(res.send)
                .toHaveBeenCalledWith('Akses ditolak');

            expect(next)
                .not.toHaveBeenCalled();
        });

        test('akses diterima jika role sesuai', () => {

            req.user = {
                role: 'admin_pusat'
            };

            const middleware = allowRole('admin_pusat', 'admin_wilayah');

            middleware(req, res, next);

            expect(next)
                .toHaveBeenCalled();
        });

    });

});