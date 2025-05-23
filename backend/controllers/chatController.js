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

// @desc    Create Group Chat
// @route   POST /api/chats/group
// @access  Private
const createGroupChat = asyncHandler(async (req, res) => {
    if (!req.body.users || !req.body.name) {
        return res.status(400).send({ message: "Please fill all the fields" });
    }

    var users = JSON.parse(req.body.users); // Users array sent as string from frontend

    if (users.length < 2) {
        return res
            .status(400)
            .send("More than 2 users are required to form a group chat");
    }

    users.push(req.user); // Add the current user to the group

    try {
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user._id,
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        res.status(200).json(fullGroupChat);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});


module.exports = { accessChat, fetchChats, createGroupChat };