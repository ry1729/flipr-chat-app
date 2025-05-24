const express = require('express');
const router = express.Router();
const { registerUser, authUser } = require('../controllers/authController');

// Register
router.post('/register', registerUser);

// Login
router.post('/login', authUser);

module.exports = router;
