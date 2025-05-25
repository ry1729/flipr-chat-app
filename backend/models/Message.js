const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId, // Who sent the message
            ref: 'User',
        },
        content: { type: String, trim: true }, // The actual message text or URL if media
        chat: {
            type: mongoose.Schema.Types.ObjectId, // Which chat this message belongs to
            ref: 'Chat',
        },
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId, // Users who have read this message
                ref: 'User',
            },
        ],
        type: {
            type: String,
            default: 'text', // Default to 'text' for regular messages
            enum: ['text', 'image', 'video', 'file', 'audio'], // Define allowed message types
        },
        // ⭐ New field for reactions ⭐
        reactions: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                type: {
                    type: String,
                    required: true,
                }, // e.g., '👍', '❤️', '😂', '🔥' - store the actual emoji or a shortcode
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;