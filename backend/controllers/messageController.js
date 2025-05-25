const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const User = require('../models/User'); // Assuming User model is needed for populating reaction users
const Chat = require('../models/Chat');
const cloudinary = require('../utils/cloudinary'); // Import Cloudinary util
const fs = require('fs'); // Node.js file system module to delete local file

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
    const { content, chatId } = req.body; // 'content' might be text or a placeholder if only file
    let fileUrl = null;
    let messageType = 'text';

    // Check if a file was uploaded by Multer
    if (req.file) {
        try {
            // Upload file to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                resource_type: "auto", // Automatically detect file type
                folder: "flipr_chat_app", // Optional: organize uploads in a folder
            });
            fileUrl = result.secure_url; // The URL of the uploaded file on Cloudinary
            // Determine message type based on MIME type or extension
            if (req.file.mimetype.startsWith('image/')) {
                messageType = 'image';
            } else if (req.file.mimetype.startsWith('video/')) {
                messageType = 'video';
            } else {
                messageType = 'file'; // Generic file
            }

            // Delete the temporary file from the local server after uploading to Cloudinary
            fs.unlinkSync(req.file.path);

        } catch (uploadError) {
            console.error("Cloudinary upload failed:", uploadError);
            res.status(500);
            // Delete local file even if Cloudinary upload fails
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            throw new Error('File upload failed');
        }
    }

    if (!content && !fileUrl) { // Message must have content or a file
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }
    if (!chatId) {
        console.log("Chat ID not passed with request");
        return res.sendStatus(400);
    }

    var newMessage = {
        sender: req.user._id,
        content: fileUrl || content, // If file, content is the URL. Otherwise, it's text.
        chat: chatId,
        type: messageType, // Set message type
    };

    try {
        var message = await Message.create(newMessage);

        message = await message.populate("sender", "username avatar");
        message = await message.populate("chat");
        message = await User.populate(message, {
            path: "chat.users",
            select: "username avatar email",
        });

        await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

        res.json(message);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

// @desc    Get all messages for a given chat
// @route   GET /api/messages/:chatId
// @access  Private
const allMessages = asyncHandler(async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .populate("sender", "username avatar email")
            .populate("chat");
        res.json(messages);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

// @desc    Add a reaction to a message
// @route   POST /api/messages/:messageId/reactions
// @access  Private
const addReaction = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { reactionType } = req.body; // e.g., '👍', '❤️', '😂'

    if (!reactionType) {
        res.status(400);
        throw new Error('Reaction type is required.');
    }

    try {
        // Find the message and update its reactions array
        // This assumes your Message schema has a 'reactions' field,
        // which is an array of objects like { user: ObjectId, type: String, createdAt: Date }
        const updatedMessage = await Message.findByIdAndUpdate(
            messageId,
            {
                $push: {
                    reactions: {
                        user: req.user._id, // User from protect middleware
                        emoji: reactionType,
                        createdAt: new Date(),
                    },
                },
            },
            { new: true, runValidators: true } // `new: true` returns the updated doc, `runValidators` runs schema validators
        )
        .populate("sender", "username avatar") // Populate sender info
        .populate("chat") // Populate chat info
        .populate("reactions.user", "username avatar"); // Populate user who added reaction

        if (!updatedMessage) {
            res.status(404);
            throw new Error('Message not found.');
        }

        // You might want to emit a socket event here to notify clients
        // about the new reaction without needing to refetch all messages.
        // This part depends on your Socket.IO setup, e.g.:
        // io.to(updatedMessage.chat._id).emit("reaction received", updatedMessage);

        res.status(200).json(updatedMessage); // Send back the updated message

    } catch (error) {
        console.error(`Error adding reaction to message ${messageId}:`, error);
        res.status(500);
        throw new Error('Failed to add reaction: ' + error.message);
    }
});


module.exports = { sendMessage, allMessages, addReaction };