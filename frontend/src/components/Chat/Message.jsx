// src/components/Chat/Message.jsx - Enhanced with reactions
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import ReactionPicker from './ReactionPicker';
import '../../styles/ChatComponents.css';
import '../../styles/Reactions.css';

function Message({ message, socket }) {
  const { user } = useAuth();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactions, setReactions] = useState(message.reactions || []);

  // Determine if the message is from the current user
  const isSelf = message.sender._id === user._id;

  // Handle adding/removing reactions
  const handleReactionSelect = async (emoji) => {
    try {
      const { data } = await api.post(`/messages/${message._id}/reactions`, {
        emoji: emoji
      });

      // Update local reactions state
      setReactions(data.reactions);

      // Emit reaction update via socket
      socket.emit("message reaction", {
        chat: message.chat,
        messageId: message._id,
        updatedMessage: data
      });

      toast.success(`Reaction ${emoji} added!`, { autoClose: 1000 });
    } catch (error) {
      toast.error('Failed to add reaction');
      console.error('Error adding reaction:', error);
    }
  };

  // Handle clicking on existing reaction (to add/remove)
  const handleReactionClick = async (emoji) => {
    try {
      const { data } = await api.post(`/messages/${message._id}/reactions`, {
        emoji: emoji
      });

      setReactions(data.reactions);

      // Emit reaction update via socket
      socket.emit("message reaction", {
        chat: message.chat,
        messageId: message._id,
        updatedMessage: data
      });
    } catch (error) {
      toast.error('Failed to update reaction');
      console.error('Error updating reaction:', error);
    }
  };

  // Check if current user has reacted with specific emoji
  const hasUserReacted = (emoji) => {
    const reaction = reactions.find(r => r.emoji === emoji);
    return reaction && reaction.users.some(u => u._id === user._id);
  };

  // Get reaction tooltip text
  const getReactionTooltip = (reaction) => {
    const usernames = reaction.users.map(u => u.username).join(', ');
    return `${usernames} reacted with ${reaction.emoji}`;
  };

  return (
    <div className={`message-bubble-wrapper ${isSelf ? 'self' : 'other'}`}>
      <div className="message-bubble">
        <div className="message-sender">
          {isSelf ? 'You' : message.sender.username}
        </div>
        
        {/* Render message content based on type */}
        {message.type === 'text' && (
          <p className="message-content">{message.content}</p>
        )}
        {message.type === 'image' && (
          <img src={message.content} alt="Sent Image" className="message-image" />
        )}
        {message.type === 'video' && (
          <video controls src={message.content} className="message-video"></video>
        )}
        {(message.type === 'file' || message.type === 'audio') && (
          <a href={message.content} target="_blank" rel="noopener noreferrer" className="message-file-link">
            <span className="file-icon">📁</span> Download {message.type.charAt(0).toUpperCase() + message.type.slice(1)}
          </a>
        )}

        {/* Reactions Display */}
        {reactions.length > 0 && (
          <div className="message-reactions">
            {reactions.map((reaction, index) => (
              <button
                key={`${reaction.emoji}-${index}`}
                className={`reaction-pill ${hasUserReacted(reaction.emoji) ? 'user-reacted' : ''}`}
                onClick={() => handleReactionClick(reaction.emoji)}
                title={getReactionTooltip(reaction)}
              >
                <span className="reaction-emoji">{reaction.emoji}</span>
                <span className="reaction-count">{reaction.users.length}</span>
              </button>
            ))}
          </div>
        )}

        <div className="message-footer">
          <div className="message-timestamp">
            {new Date(message.createdAt).toLocaleString()}
          </div>
          
          {/* Add Reaction Button */}
          <button
            className="add-reaction-btn"
            onClick={() => setShowReactionPicker(true)}
            title="Add reaction"
          >
            😊
          </button>
        </div>
      </div>

      {/* Reaction Picker Modal */}
      <ReactionPicker
        message={message}
        onReactionSelect={handleReactionSelect}
        isVisible={showReactionPicker}
        onClose={() => setShowReactionPicker(false)}
      />
    </div>
  );
}

export default Message;