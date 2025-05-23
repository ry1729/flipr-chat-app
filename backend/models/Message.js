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
    // --- End of new field ---
        // You might also consider adding:
        // reactions: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, emoji: String }],
        // originalFileName: { type: String } // Good for files where content is a URL
   
    },
    { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;