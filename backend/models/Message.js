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
        // FIXED: Reactions array with proper validation
        reactions: [
        {
            emoji: {
            type: String,
            required: true, // This field is required when the reaction object exists
            },
            user: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            }
            ],
        }
        ],
  
    }, // This is the closing brace for the main schema definition object
    { timestamps: true } // This is the options object
);

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;