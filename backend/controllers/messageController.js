const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const User = require('../models/User');
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

// ... (allMessages function remains the same)
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

module.exports = { sendMessage, allMessages };