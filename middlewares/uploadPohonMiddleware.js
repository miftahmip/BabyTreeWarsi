const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    const dir =
      path.join(
        __dirname,
        '../src/uploads/pohon'
      );

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },

  filename: (req, file, cb) => {

    const uniqueName =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1E9);

    cb(
      null,
      uniqueName +
      path.extname(file.originalname)
    );
  }

});

const fileFilter = (req, file, cb) => {

  const allowed =
    /jpg|jpeg|png/;

  const ext =
    allowed.test(
      path.extname(file.originalname).toLowerCase()
    );

  const mime =
    allowed.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'File harus berupa JPG/JPEG/PNG'
      )
    );
  }
};

const uploadPohon = multer({

  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter

});

module.exports = uploadPohon;