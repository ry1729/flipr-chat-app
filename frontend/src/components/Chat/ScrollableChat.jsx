// src/components/Chat/ScrollableChat.jsx - Pass socket to Message
import React, { useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Message from './Message';
import '../../styles/ChatComponents.css';

function ScrollableChat({ messages, isTyping, typingUser, socket }) {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages or typing indicator change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="scrollable-chat-area">
      {messages.map((msg, i) => (
        <Message key={msg._id} message={msg} socket={socket} />
      ))}
      
      {/* Enhanced typing indicator */}
      {isTyping && (
        <div className="message-bubble-wrapper other">
          <div className="typing-indicator">
            {typingUser ? `${typingUser} is typing` : 'Typing'}...
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}

export default ScrollableChat;