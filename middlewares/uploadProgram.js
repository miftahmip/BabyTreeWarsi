const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ================= FOLDER SETUP =================
const uploadPath = path.join(__dirname, '../src/uploads/program');

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// ================= STORAGE =================
const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },

    filename: function (req, file, cb) {

        const ext = path.extname(file.originalname);

        const uniqueName =
            Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;

        cb(null, uniqueName);
    }

});

// ================= FILE FILTER =================
const fileFilter = (req, file, cb) => {

    const allowedExt = /jpg|jpeg|png|webp/;
    const allowedMime = /image\/jpeg|image\/png|image\/webp/;

    const extValid = allowedExt.test(
        path.extname(file.originalname).toLowerCase()
    );

    const mimeValid = allowedMime.test(file.mimetype);

    if (extValid && mimeValid) {
        cb(null, true);
    } else {
        cb(new Error('File harus berupa gambar (jpg, jpeg, png, webp)'));
    }
};

// ================= MULTER EXPORT =================
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    }
});

module.exports = upload;