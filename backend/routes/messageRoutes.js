const express = require('express');
const { sendMessage, allMessages, addReaction } = require('../controllers/messageController'); // Import the new addReaction
const { protect } = require('../middleware/authMiddleware'); // Import the protect middleware
const upload = require('../middleware/uploadMiddleware'); // Import the upload middleware
const router = express.Router();

// Route to send a new message to a specific chat
// This is a POST request.
router.route('/').post(protect, upload.single('file'), sendMessage);

// Route to fetch all messages for a given chat ID
// The ':chatId' is a URL parameter to specify which chat's messages to fetch.
// This is a GET request.
router.route('/:chatId').get(protect, allMessages);

// ⭐ NEW ROUTE: Route to add a reaction to a specific message ⭐
// This is a POST request to add a reaction.
router.route('/:messageId/reactions').post(protect, addReaction);

module.exports = router;