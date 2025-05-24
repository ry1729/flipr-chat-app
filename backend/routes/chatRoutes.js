const express = require('express');
const { accessChat, fetchChats, createGroupChat } = require('../controllers/chatController'); // Assuming these are in chatController.js
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

// (Optional) Routes for renaming group, adding/removing from group
// router.route('/group/rename').put(protect, renameGroup);
// router.route('/groupadd').put(protect, addToGroup);
// router.route('/groupremove').put(protect, removeFromGroup);


module.exports = router;