// src/components/Chat/ReactionPicker.jsx
import React, { useState } from 'react';
import '../../styles/Reactions.css';

const AVAILABLE_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

function ReactionPicker({ message, onReactionSelect, isVisible, onClose }) {
  if (!isVisible) return null;

  const handleReactionClick = (emoji) => {
    onReactionSelect(emoji);
    onClose();
  };

  return (
    <div className="reaction-picker-overlay" onClick={onClose}>
      <div className="reaction-picker" onClick={(e) => e.stopPropagation()}>
        <div className="reaction-picker-header">
          <span>React to message</span>
          <button className="close-picker" onClick={onClose}>×</button>
        </div>
        <div className="reaction-emojis">
          {AVAILABLE_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              className="reaction-emoji-btn"
              onClick={() => handleReactionClick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReactionPicker;