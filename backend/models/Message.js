const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, trim: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file'],
      default: 'text',
    },
    // NEW: Reactions array
    reactions: [
      {
        emoji: {
          type: String,
          required: true,
        },
        users: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          }
        ],
      }
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;