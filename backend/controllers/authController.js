const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => { // asyncHandler will catch errors here
    console.log('RegisterUser: Function started.');
    const { username, email, password, avatar } = req.body;

    // Basic server-side validation (already present, but good to re-check)
    if (!username || !email || !password) {
        console.error('RegisterUser: Missing required fields in request body.');
        res.status(400);
        throw new Error('Please enter all required fields (username, email, password)');
    }

    try {
        console.log('RegisterUser: Checking if user exists...');
        const userExists = await User.findOne({ $or: [{ email }, { username }] });

        if (userExists) {
            console.error('RegisterUser: User already exists with this email or username.');
            res.status(400); // Use 409 Conflict for duplicates, but 400 is fine for now
            throw new Error('User with this email or username already exists');
        }
        console.log('RegisterUser: User does not exist, proceeding to create.');

        // --- Step 1: Hash password explicitly here (for robust debugging) ---
        // This makes the hashing process visible and controllable.
        // If your model's pre-save hook is causing issues, this bypasses it for testing.
        console.log('RegisterUser: Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('RegisterUser: Password hashed successfully.');

        // --- Step 2: Create User in Database ---
        console.log('RegisterUser: Attempting to create user in DB...');
        const user = await User.create({
            username,
            email,
            password: hashedPassword, // Use the HASHED password here
            avatar: avatar || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg", // Ensure avatar has a default if not provided
        });
        console.log('RegisterUser: User.create call completed.');

        // --- Step 3: Respond to Client ---
        if (user) {
            console.log('RegisterUser: User created successfully. Sending response.');
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                token: generateToken(user._id),
            });
        } else {
            // This 'else' block should ideally not be hit if User.create throws an error
            // but it's a good fallback.
            console.error('RegisterUser: User.create returned null/undefined unexpectedly.');
            res.status(400);
            throw new Error('Invalid user data received during creation');
        }
    } catch (error) {
        // This catch block inside asyncHandler will log the error before asyncHandler passes it on
        console.error('********************************************************');
        console.error('REGISTER USER CONTROLLER - CAUGHT ERROR (Inside try/catch):');
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        console.error('Error Name:', error.name);
        if (error.code && error.code === 11000) { // MongoDB duplicate key error
            console.error('Duplicate key error - likely email or username unique constraint violation.');
            res.status(409); // Use 409 for conflict
            throw new Error('A user with this email or username already exists.');
        }
        console.error('********************************************************');
        // Re-throw the error so asyncHandler can pass it to your main error middleware
        throw error;
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
// (Keep your existing authUser function here)
// backend/controllers/authController.js


const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email); // New Log
    const user = await User.findOne({ email });

    if (user) {
        console.log('User found:', user.email); // New Log
        const passwordMatches = await user.matchPassword(password);
        console.log('Password match result:', passwordMatches); // New Log

        if (passwordMatches) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                token: generateToken(user._id),
            });
        } else {
            res.status(401);
            throw new Error('Invalid Email or Password (Password mismatch)'); // More specific error message
        }
    } else {
        console.log('User not found for email:', email); // New Log
        res.status(401);
        throw new Error('Invalid Email or Password (User not found)'); // More specific error message
    }
});

module.exports = { registerUser, authUser };