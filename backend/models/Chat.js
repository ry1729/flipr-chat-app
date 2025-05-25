const mongoose = require('mongoose');

const chatSchema = mongoose.Schema(
    {
        chatName: { type: String, trim: true }, // For group chats
        isGroupChat: { type: Boolean, default: false },
        users: [
            {
                type: mongoose.Schema.Types.ObjectId, // Array of User IDs
                ref: 'User', // Reference to the User model
            },
        ],
        latestMessage: {
            type: mongoose.Schema.Types.ObjectId, // Reference to the latest message in this chat
            ref: 'Message',
        },
        groupAdmin: {
            type: mongoose.Schema.Types.ObjectId, // If it's a group chat, who is the admin
            ref: 'User',
        },
    },
    { timestamps: true } // Adds createdAt and updatedAt
);

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;