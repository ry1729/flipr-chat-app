const asyncHandler = require('express-async-handler');
const Chat = require('../models/Chat');
const User = require('../models/User'); // Needed to populate user details

// @desc    Access a chat (create if it doesn't exist)
// @route   POST /api/chats
// @access  Private
const accessChat = asyncHandler(async (req, res) => {
    const { userId } = req.body; // The ID of the user you want to chat with

    if (!userId) {
        console.log("UserId param not sent with request");
        return res.sendStatus(400);
    }

    // Check if a chat already exists between the current user and target user
    var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: req.user._id } } },
            { users: { $elemMatch: { $eq: userId } } },
        ],
    })
    .populate("users", "-password") // Populate user details except password
    .populate("latestMessage");

    // Populate sender details for the latest message
    isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "username avatar email",
    });

    if (isChat.length > 0) {
        res.send(isChat[0]); // If chat exists, return it
    } else {
        // If chat doesn't exist, create a new one
        var chatData = {
            chatName: "sender", // Default name for DM
            isGroupChat: false,
            users: [req.user._id, userId],
        };

        try {
            const createdChat = await Chat.create(chatData);
            const fullChat = await Chat.findOne({ _id: createdChat._id }).populate("users", "-password");
            res.status(200).json(fullChat);
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    }
});


// @desc    Fetch all chats for a user
// @route   GET /api/chats
// @access  Private
const fetchChats = asyncHandler(async (req, res) => {
    try {
        Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1 }) // Sort by latest message
            .then(async (results) => {
                results = await User.populate(results, {
                    path: "latestMessage.sender",
                    select: "username avatar email",
                });
                res.status(200).send(results);
            });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});


// backend/controllers/chatController.js - Add these functions to your existing file

// @desc    Create a group chat
// @route   POST /api/chats/group
// @access  Private
const createGroupChat = asyncHandler(async (req, res) => {
  const { name, users } = req.body;

  // Validation
  if (!name || !users || !Array.isArray(users)) {
    res.status(400);
    throw new Error('Please provide group name and users array');
  }

  if (users.length < 2) {
    res.status(400);
    throw new Error('Group chat must have at least 2 members');
  }

  if (name.length > 50) {
    res.status(400);
    throw new Error('Group name must be 50 characters or less');
  }

  try {
    // Add the current user to the group
    const allUsers = [...users, req.user._id];
    
    // Remove duplicates
    const uniqueUsers = [...new Set(allUsers)];

    // Verify all users exist
    const User = require('../models/User');
    const existingUsers = await User.find({ _id: { $in: uniqueUsers } });
    
    if (existingUsers.length !== uniqueUsers.length) {
      res.status(400);
      throw new Error('One or more users not found');
    }

    // Create the group chat
    const Chat = require('../models/Chat');
    const groupChat = await Chat.create({
      chatName: name.trim(),
      isGroupChat: true,
      users: uniqueUsers,
      groupAdmin: req.user._id,
    });

    // Populate the group chat with user details
    const populatedGroupChat = await Chat.findById(groupChat._id)
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(201).json(populatedGroupChat);
    
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Add user to group chat
// @route   PUT /api/chats/:chatId/add
// @access  Private
const addToGroup = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const { chatId } = req.params;

  if (!userId) {
    res.status(400);
    throw new Error('Please provide user ID');
  }

  try {
    const Chat = require('../models/Chat');
    
    // Find the chat and verify user is admin
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    if (!chat.isGroupChat) {
      res.status(400);
      throw new Error('This is not a group chat');
    }

    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only group admin can add members');
    }

    // Check if user is already in the group
    if (chat.users.includes(userId)) {
      res.status(400);
      throw new Error('User is already in the group');
    }

    // Add user to group
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { users: userId } },
      { new: true }
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.json(updatedChat);
    
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Remove user from group chat
// @route   PUT /api/chats/:chatId/remove
// @access  Private
const removeFromGroup = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const { chatId } = req.params;

  if (!userId) {
    res.status(400);
    throw new Error('Please provide user ID');
  }

  try {
    const Chat = require('../models/Chat');
    
    // Find the chat and verify user is admin or removing themselves
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    if (!chat.isGroupChat) {
      res.status(400);
      throw new Error('This is not a group chat');
    }

    // Allow admin to remove anyone, or users to remove themselves
    const isAdmin = chat.groupAdmin.toString() === req.user._id.toString();
    const isRemovingSelf = userId === req.user._id.toString();
    
    if (!isAdmin && !isRemovingSelf) {
      res.status(403);
      throw new Error('Only group admin can remove members');
    }

    // Don't allow admin to remove themselves if they're the only admin
    if (isRemovingSelf && isAdmin && chat.users.length > 1) {
      res.status(400);
      throw new Error('Group admin cannot leave the group. Transfer admin rights first.');
    }

    // Remove user from group
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.json(updatedChat);
    
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Update group chat name
// @route   PUT /api/chats/:chatId/rename
// @access  Private
const renameGroup = asyncHandler(async (req, res) => {
  const { chatName } = req.body;
  const { chatId } = req.params;

  if (!chatName || chatName.trim().length === 0) {
    res.status(400);
    throw new Error('Please provide a valid group name');
  }

  if (chatName.length > 50) {
    res.status(400);
    throw new Error('Group name must be 50 characters or less');
  }

  try {
    const Chat = require('../models/Chat');
    
    // Find the chat and verify user is admin
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    if (!chat.isGroupChat) {
      res.status(400);
      throw new Error('This is not a group chat');
    }

    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only group admin can rename the group');
    }

    // Update group name
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatName: chatName.trim() },
      { new: true }
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.json(updatedChat);
    
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  addToGroup,
  removeFromGroup,
  renameGroup,
};
// module.exports = { accessChat, fetchChats, createGroupChat };