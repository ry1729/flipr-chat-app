const express = require('express');
const { accessChat, fetchChats, createGroupChat,addToGroup,removeFromGroup, renameGroup,  } = require('../controllers/chatController'); // Assuming these are in chatController.js
const { protect } = require('../middleware/authMiddleware'); // Import the protect middleware
const router = express.Router();

// Route to access a chat (create DM if it doesn't exist, or return existing)
// This is a POST request as it involves creating/modifying a chat.
router.route('/').post(protect, accessChat);

// Route to fetch all chats for the authenticated user
// This is a GET request as it retrieves data.
router.route('/').get(protect, fetchChats);

// Route to create a new group chat
// This is a POST request.
router.route('/group').post(protect, createGroupChat);
router.route('/:chatId/add').put(protect, addToGroup);
router.route('/:chatId/remove').put(protect, removeFromGroup);
router.route('/:chatId/rename').put(protect, renameGroup);
module.exports = router;