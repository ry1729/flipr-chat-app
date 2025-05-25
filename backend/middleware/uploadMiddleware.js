// backend/middleware/uploadMiddleware.js

const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Import fs module

// Configure storage for Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // ⭐ PROBLEM: 'uploads/' is a relative path.
        // It's relative to wherever your Node.js process is started.
        // This can be inconsistent and lead to issues.
        // Also, Multer's default behavior with `diskStorage` will *not* create the directory automatically.

        // ⭐ SOLUTION: Use an absolute path and ensure the directory exists. ⭐
        const uploadDir = path.join(__dirname, '..', 'uploads'); // Go up one level from 'middleware', then into 'uploads'

        // Create the directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir); // Pass the absolute path to the destination
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

// File filter (looks good)
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|mp4|webm|pdf|doc|docx|mp3|wav|ogg/; // Added common audio types
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        // Provide a more specific error message based on what was rejected
        const allowedTypes = filetypes.source.replace(/\|/g, ', ');
        cb(new Error(`Invalid file type. Only ${allowedTypes} are allowed!`), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 10 }, // 10MB file size limit
    fileFilter: fileFilter,
});

module.exports = upload;