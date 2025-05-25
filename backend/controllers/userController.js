const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get user profile (current logged in user)
// @route   GET /api/users/profile
// @access  Private (requires token)
const getUserProfile = asyncHandler(async (req, res) => {
    // req.user is populated by the 'protect' middleware
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            onlineStatus: user.onlineStatus,
            lastSeen: user.lastSeen,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Search for users
// @route   GET /api/users?search=keyword
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
    const keyword = req.query.search
        ? {
              $or: [
                  { username: { $regex: req.query.search, $options: 'i' } },
                  { email: { $regex: req.query.search, $options: 'i' } },
              ],
          }
        : {};

    const users = await User.find(keyword).find({ _id: { $ne: req.user._id } }).select('-password'); // Exclude current user
    res.send(users);
});

module.exports = { getUserProfile, searchUsers };