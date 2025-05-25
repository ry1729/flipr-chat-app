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
        // Consolidated and corrected reactions field
        reactions: [
            {
                emoji: { // The emoji character or shortcode (e.g., '👍', '😂', '🔥')
                    type: String,
                    required: true,
                },
                users: [ // Array of users who added this specific emoji reaction
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User',
                    }
                ],
                // You might also want to add a createdAt or updatedAt for the reaction group
                // For example, to know when the first reaction of this type was added
                // firstReactedAt: { type: Date, default: Date.now },
                // lastReactedAt: { type: Date, default: Date.now },
            }
        ],
    }, // This is the closing brace for the main schema definition object
    { timestamps: true } // This is the options object
);

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;