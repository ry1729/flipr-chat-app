// backend/controllers/reactionController.js - FIXED VERSION
const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');

// @desc    Add or remove reaction to a message
// @route   POST /api/messages/:messageId/reactions
// @access  Private
const toggleReaction = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  console.log('Reaction request:', { messageId, emoji, userId }); // Debug log

  if (!emoji) {
    console.log('No emoji provided'); // Debug log
    res.status(400);
    throw new Error('Emoji is required');
  }

  try {
    const message = await Message.findById(messageId).populate('reactions.users', 'username avatar');

    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    console.log('Current message reactions:', message.reactions); // Debug log

    // Find if this emoji already exists in reactions
    let existingReactionIndex = message.reactions.findIndex(r => r.emoji === emoji);

    if (existingReactionIndex > -1) {
      // Reaction exists - check if user already reacted
      const existingReaction = message.reactions[existingReactionIndex];
      const userReactionIndex = existingReaction.users.findIndex(u => u._id.toString() === userId.toString());

      if (userReactionIndex > -1) {
        // Remove user's reaction
        existingReaction.users.splice(userReactionIndex, 1);
        
        // If no users left, remove the entire reaction
        if (existingReaction.users.length === 0) {
          message.reactions.splice(existingReactionIndex, 1);
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

    console.log('Updated reactions:', message.reactions); // Debug log

    // Save the message
    await message.save();

    // Populate the message with full user details
    const populatedMessage = await Message.findById(messageId)
      .populate('sender', 'username avatar')
      .populate('reactions.users', 'username avatar')
      .populate('chat');

    console.log('Sending response:', populatedMessage.reactions); // Debug log

    res.json(populatedMessage);
  } catch (error) {
    console.error('Reaction error:', error); // Debug log
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { toggleReaction };