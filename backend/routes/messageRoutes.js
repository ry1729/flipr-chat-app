const express = require('express');
const { sendMessage, allMessages } = require('../controllers/messageController'); // Assuming these are in messageController.js
const { protect } = require('../middleware/authMiddleware'); // Import the protect middleware
const upload = require('../middleware/uploadMiddleware'); // Import the upload middleware
const router = express.Router();

// Route to send a new message to a specific chat
// This is a POST request.
router.route('/').post(protect, upload.single('file') ,sendMessage);

// Route to fetch all messages for a given chat ID
// The ':chatId' is a URL parameter to specify which chat's messages to fetch.
// This is a GET request.
router.route('/:chatId').get(protect, allMessages);

module.exports = router;