const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;
        next();

    } catch (error) {
        return res.redirect('/login');
    }
};

exports.allowRole = (...roles) => {
    return (req, res, next) => {

        if (!roles.includes(req.user.role)) {
            return res.send('Akses ditolak');
        }

        next();
    };
};