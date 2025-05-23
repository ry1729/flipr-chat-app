// src/components/chat/ScrollableChat.jsx
import React, { useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Message from './Message'; // Import the new Message component
import '../../styles/ChatComponents.css'; // Reuses the same CSS file

function ScrollableChat({ messages, isTyping }) {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages or typing indicator change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="scrollable-chat-area">
      {messages.map((msg, i) => (
        <Message key={msg._id} message={msg} /> // Use the Message component
      ))}
      {isTyping && <div className="typing-indicator">Typing...</div>}
      <div ref={messagesEndRef} /> {/* Scroll target */}
    </div>
  );
}

export default ScrollableChat;