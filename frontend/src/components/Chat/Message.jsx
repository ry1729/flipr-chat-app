// src/components/chat/Message.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/ChatComponents.css'; // Reuses the same CSS file

function Message({ message }) {
  const { user } = useAuth();

  // Determine if the message is from the current user
  const isSelf = message.sender._id === user._id;

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
        <div className="message-timestamp">
          {new Date(message.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export default Message;