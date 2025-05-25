// backend/controllers/reactionController.js
const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');

// @desc    Add or remove reaction to a message
// @route   POST /api/messages/:messageId/reactions
// @access  Private
const toggleReaction = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  if (!emoji) {
    res.status(400);
    throw new Error('Emoji is required');
  }

  try {
    const message = await Message.findById(messageId).populate('reactions.users', 'username avatar');

    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    // Find if this emoji already exists in reactions
    let existingReaction = message.reactions.find(r => r.emoji === emoji);

    if (existingReaction) {
      // Check if user already reacted with this emoji
      const userReactionIndex = existingReaction.users.findIndex(u => u._id.toString() === userId.toString());

      if (userReactionIndex > -1) {
        // Remove user's reaction
        existingReaction.users.splice(userReactionIndex, 1);
        
        // If no users left, remove the entire reaction
        if (existingReaction.users.length === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Add user to existing reaction
        existingReaction.users.push(userId);
      }
    } else {
      // Create new reaction
      message.reactions.push({
        emoji: emoji,
        users: [userId]
      });
    }

    await message.save();

    // Populate the message with full user details
    const populatedMessage = await Message.findById(messageId)
      .populate('sender', 'username avatar')
      .populate('reactions.users', 'username avatar')
      .populate('chat');

    res.json(populatedMessage);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { toggleReaction };