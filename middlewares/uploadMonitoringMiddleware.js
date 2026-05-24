const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadPath =
  path.join(
    __dirname,
    '../src/uploads/monitoring'
  );

// buat folder otomatis
if (!fs.existsSync(uploadPath)) {

  fs.mkdirSync(uploadPath, {
    recursive: true
  });

}

const storage =
  multer.diskStorage({

    destination:
      function(req, file, cb) {

        cb(
          null,
          uploadPath
        );

      },

    filename:
      function(req, file, cb) {

        cb(
          null,
          Date.now() +
          path.extname(file.originalname)
        );

      }

  });

module.exports =
  multer({ storage });