const fs = require('fs');
const path = require('path');

// path ke folder uploads di dalam src
const BASE_UPLOAD_PATH = path.join(__dirname, '../src/uploads');

const deleteFile = (fileName, folder = 'program') => {
    try {
        if (!fileName) return;

        const filePath = path.join(
            BASE_UPLOAD_PATH,
            folder,
            fileName
        );

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('File deleted:', fileName);
        } else {
            console.warn('File tidak ditemukan:', filePath);
        }

    } catch (error) {
        console.error('Error deleting file:', error.message);
    }
};

module.exports = { deleteFile };