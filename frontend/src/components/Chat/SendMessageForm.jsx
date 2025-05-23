// src/components/chat/SendMessageForm.jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import '../../styles/ChatComponents.css'; // Reuses the same CSS file

function SendMessageForm({ selectedChat, socket, setMessages, socketConnected }) {
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false); // Local typing state for this component

  // --- Send Message (Text) ---
  const sendMessage = async (e) => {
    // Check for Enter key press or explicit button click
    if ((e.key === 'Enter' || e.type === 'click') && newMessage.trim()) {
      socket.emit("stop typing", selectedChat._id); // Stop typing indicator
      try {
        setNewMessage(""); // Clear input immediately

        const { data } = await api.post(
          '/messages',
          {
            content: newMessage.trim(),
            chatId: selectedChat._id,
            type: 'text' // Explicitly set type for text messages
          }
        );
        socket.emit("new message", data); // Emit new message to socket server
        setMessages((prevMessages) => [...prevMessages, data]); // Update local state
      } catch (error) {
        toast.error('Failed to send message.');
        console.error("Failed to send message:", error);
      }
    }
  };

  // --- Handle File Upload ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedChat) {
      return;
    }

    // You might want to show a loading indicator here (e.g., passed from ChatBox)
    // setLoadingMessages(true); // Example if passed as prop

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatId', selectedChat._id);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
        },
      };

      const { data } = await api.post('/messages', formData, config);
      socket.emit("new message", data);
      setMessages((prevMessages) => [...prevMessages, data]);
      toast.success('File sent successfully!');
    } catch (error) {
      toast.error('Failed to upload file.');
      console.error("Failed to upload file:", error);
    } finally {
      // setLoadingMessages(false); // Example if passed as prop
      e.target.value = null; // Clear file input
    }
  };

  // --- Typing Indicator Handler ---
  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000; // 3 seconds
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  return (
    <div className="message-input-area">
      <input
        type="text"
        placeholder="Type a message..."
        value={newMessage}
        onChange={typingHandler}
        onKeyDown={sendMessage}
        className="message-input"
        disabled={!socketConnected || !selectedChat}
      />
      <label htmlFor="file-upload" className="file-upload-button">
        📎
      </label>
      <input
        type="file"
        id="file-upload"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        disabled={!selectedChat}
      />
      <button
        onClick={sendMessage} // Button click handler
        className="send-button"
        disabled={!newMessage.trim() || !socketConnected || !selectedChat}
      >
        Send
      </button>
    </div>
  );
}

export default SendMessageForm;