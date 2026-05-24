require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const ejsMate = require('ejs-mate');

const app = express();

// ================= MIDDLEWARE =================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ================= VIEW ENGINE =================
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ================= STATIC FILE =================

// untuk CSS, JS, dll (dari folder src)
app.use(express.static(path.join(__dirname, 'src')));

// akses gambar upload
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

// ================= ROUTES =================
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const programRoutes = require('./routes/programRoutes');
const landingRoutes = require('./routes/landingRoutes');
const donasiRoutes = require('./routes/donasiRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const midtransRoutes = require('./routes/midtransRoutes');
const penanamanRoutes = require('./routes/penanamanRoutes');
const mitraRoutes = require('./routes/mitraRoutes');
const jenisPohonRoutes = require('./routes/jenisPohonRoutes');
const pohonRoutes = require('./routes/pohonRoutes');
const verifikasiPohonRoutes = require('./routes/verifikasiPohonRoutes');
const monitoringRoutes = require('./routes/monitoringRoutes');
const hargaPenanamanRoutes = require('./routes/hargaPenanamanRoutes');
const rekapPembayaranRoutes = require('./routes/rekapPembayaranRoutes');

// public (landing page)
app.use('/', landingRoutes);

// lainnya
app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', programRoutes);
app.use('/', donasiRoutes);
app.use('/', paymentRoutes);
app.use('/', midtransRoutes);
app.use('/', penanamanRoutes);
app.use('/', mitraRoutes);
app.use('/', jenisPohonRoutes);
app.use('/', pohonRoutes);
app.use('/', verifikasiPohonRoutes);
app.use('/', monitoringRoutes);
app.use('/', hargaPenanamanRoutes);
app.use('/', rekapPembayaranRoutes);

// ================= ERROR HANDLER =================

// multer error & general error
app.use((err, req, res, next) => {
    console.error(err);

    if (err.name === 'MulterError') {
        return res.status(400).send(err.message);
    }

    if (err) {
        return res.status(500).send(err.message || 'Terjadi kesalahan pada server');
    }

    next();
});

// ================= SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});