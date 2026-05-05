const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedFileTypes = /jpeg|jpg|png/;
        const extname = allowedFileTypes.test(file.originalname.toLowerCase().split('.').pop());
        const mimetype = allowedFileTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }

        return cb(new Error('Images only! (jpeg, jpg, png)'));
    }
});

module.exports = upload;