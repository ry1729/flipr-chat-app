const multer = require('multer');
const path = require('path');

// Configure storage for Multer
// We'll store files temporarily in a 'uploads' folder
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Store files in an 'uploads' directory
    },
    filename: function (req, file, cb) {
        // Create a unique filename for the uploaded file
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

// File filter to allow only certain file types (e.g., images)
const fileFilter = (req, file, cb) => {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif|mp4|webm|pdf|doc|docx/; // Add more as needed
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime type
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only images, videos, and documents are allowed!'), false); // Customize error message
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 10 }, // 10MB file size limit
    fileFilter: fileFilter,
});

module.exports = upload;