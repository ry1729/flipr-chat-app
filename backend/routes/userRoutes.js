const express = require('express');
const { getUserProfile, searchUsers } = require('../controllers/userController'); // Assuming these are in userController.js
const { protect } = require('../middleware/authMiddleware'); // Import the protect middleware
const router = express.Router();

// Route to get the profile of the currently logged-in user
// This route is protected, meaning only authenticated users can access it.
router.route('/profile').get(protect, getUserProfile);

// Route to search for users (e.g., to initiate a new DM)
// This route is also protected.
router.route('/').get(protect, searchUsers); // Example: /api/users?search=John

module.exports = router;