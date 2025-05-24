import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { toast } from 'react-toastify'; // Import toast for notifications

let socket; // Global socket instance

function ChatPage() {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState(null); // To select a chat/DM
  const [allChats, setAllChats] = useState([]); // List of user's chats
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true); // New state for loading chats
  const [loadingMessages, setLoadingMessages] = useState(false); // New state for loading messages

  const messagesEndRef = useRef(null); // Ref for auto-scrolling messages

  // --- Socket.IO Connection and Event Listeners ---
  useEffect(() => {
    if (!user) {
      // If user is not logged in, prevent socket connection
      return;
    }

    socket = io(import.meta.env.VITE_REACT_APP_SOCKET_ENDPOINT);
    socket.emit("setup", user); // Emit setup event with user data

    socket.on("connected", () => {
      setSocketConnected(true);
      console.log("Socket.IO connected!");
    });
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    // Cleanup function for socket disconnection
    return () => {
      socket.disconnect();
      console.log("Socket.IO disconnected.");
    };
  }, [user]); // Re-run effect if user changes (e.g., login/logout)

  // --- Message Received Listener ---
  useEffect(() => {
    // This listener should be set up once and handle incoming messages
    socket.on("message received", (newMessageReceived) => {
      // Check if the received message belongs to the currently selected chat
      if (selectedChat && selectedChat._id === newMessageReceived.chat._id) {
        setMessages((prevMessages) => [...prevMessages, newMessageReceived]);
        // Optional: Emit a "read receipt" here if you implement that feature
      } else {
        // Handle notification for new messages in other chats (e.g., toast, badge)
        toast.info(`New message from ${newMessageReceived.sender.username} in ${newMessageReceived.chat.chatName || 'a chat'}!`);
        // You might want to update the `allChats` list to show unread count
      }
    });

    // Clean up the listener when the component unmounts or selectedChat changes
    // This is important to prevent multiple listeners
    return () => {
      socket.off("message received");
    };
  }, [selectedChat]); // Re-run if selectedChat changes to ensure correct context

  // --- Auto-scroll to bottom of messages ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]); // Scroll whenever messages array updates

  // --- Fetch Chats for the User ---
  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await api.get(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/chats`, config);
      setAllChats(data);
      if (data.length > 0) {
        // Auto-select the first chat for convenience
        setSelectedChat(data[0]);
        socket.emit("join chat", data[0]._id);
        fetchMessages(data[0]._id);
      }
    } catch (error) {
      toast.error('Failed to load chats.');
      console.error("Failed to fetch chats:", error);
    } finally {
      setLoadingChats(false);
    }
  };

  // --- Fetch Messages for the Selected Chat ---
  const fetchMessages = async (chatId) => {
    if (!chatId) return;
    setLoadingMessages(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await api.get(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/messages/${chatId}`, config);
      setMessages(data);
    } catch (error) {
      toast.error('Failed to load messages.');
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // --- Handle Chat Selection ---
  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    socket.emit("join chat", chat._id); // Join the new chat room
    fetchMessages(chat._id); // Fetch messages for the newly selected chat
  };

  // --- Send Message (Text or File) ---
  const sendMessage = async (e) => {
    // Only send on Enter key press for text messages
    if (e.key === 'Enter' && newMessage.trim()) {
      socket.emit("stop typing", selectedChat._id); // Stop typing indicator
      try {
        const config = {
          headers: {
            "Content-Type": "application/json", // Default for text
            Authorization: `Bearer ${user.token}`,
          },
        };

        const messageContent = newMessage.trim();
        setNewMessage(""); // Clear input immediately

        const { data } = await api.post(
          `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/messages`,
          {
            content: messageContent,
            chatId: selectedChat._id,
          },
          config
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

    setLoadingMessages(true); // Show loading while uploading
    try {
      const formData = new FormData(); // FormData for file uploads
      formData.append('file', file);
      formData.append('chatId', selectedChat._id);
      // No 'content' needed for file upload, as content will be the file URL

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await api.post(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/messages`,
        formData,
        config
      );
      socket.emit("new message", data);
      setMessages((prevMessages) => [...prevMessages, data]);
      toast.success('File sent successfully!');
    } catch (error) {
      toast.error('Failed to upload file.');
      console.error("Failed to upload file:", error);
    } finally {
      setLoadingMessages(false);
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

  // --- Initial Fetch of Chats on Component Mount/User Change ---
  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]); // Dependency on 'user' ensures it runs when user data is available

  return (
    <div className="chat-page"> {/* Main container for the chat page */}
      <div className="chat-sidebar"> {/* Left sidebar for chats list */}
        <div className="sidebar-header">
          <h2>Chats</h2>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
        <div className="chat-list">
          {loadingChats ? (
            <p>Loading chats...</p>
          ) : allChats.length > 0 ? (
            allChats.map(chat => (
              <div
                key={chat._id}
                className={`chat-list-item ${selectedChat?._id === chat._id ? 'selected' : ''}`}
                onClick={() => handleChatSelect(chat)}
              >
                {/* Display chat name (group) or other user's name (DM) */}
                {chat.isGroupChat
                  ? chat.chatName
                  : chat.users.find(u => u._id !== user._id)?.username || 'Unnamed Chat'}
                {/* Optional: Display latest message snippet */}
                {chat.latestMessage && (
                  <div className="latest-message-snippet">
                    {chat.latestMessage.sender._id === user._id ? 'You: ' : `${chat.latestMessage.sender.username}: `}
                    {chat.latestMessage.type === 'text'
                      ? chat.latestMessage.content.substring(0, 30) + (chat.latestMessage.content.length > 30 ? '...' : '')
                      : `[${chat.latestMessage.type.charAt(0).toUpperCase() + chat.latestMessage.type.slice(1)}]`}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>No chats found. Start a new conversation!</p>
          )}
        </div>
      </div>

      <div className="chat-main-area"> {/* Right main chat area */}
        {selectedChat ? (
          <>
            <div className="chat-header">
              <h3>
                {selectedChat.isGroupChat
                  ? selectedChat.chatName
                  : selectedChat.users.find(u => u._id !== user._id)?.username || 'Direct Message'}
              </h3>
            </div>
            <div className="message-area"> {/* Area to display messages */}
              {loadingMessages ? (
                <p>Loading messages...</p>
              ) : messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`message-bubble-wrapper ${msg.sender._id === user._id ? 'self' : 'other'}`}
                  >
                    <div className="message-bubble">
                      <div className="message-sender">
                        {msg.sender._id === user._id ? 'You' : msg.sender.username}
                      </div>
                      {/* Render message content based on type */}
                      {msg.type === 'text' && (
                        <p className="message-content">{msg.content}</p>
                      )}
                      {msg.type === 'image' && (
                        <img src={msg.content} alt="Sent Image" className="message-image" />
                      )}
                      {msg.type === 'video' && (
                        <video controls src={msg.content} className="message-video"></video>
                      )}
                      {(msg.type === 'file' || msg.type === 'audio') && (
                        <a href={msg.content} target="_blank" rel="noopener noreferrer" className="message-file-link">
                          <span className="file-icon">📁</span> Download {msg.type}
                        </a>
                      )}
                      <div className="message-timestamp">
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-messages-placeholder">
                  Start a conversation!
                </div>
              )}
              {isTyping && <div className="typing-indicator">Typing...</div>}
              <div ref={messagesEndRef} /> {/* Scroll target */}
            </div>
            <div className="message-input-area"> {/* Input area for new messages */}
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
                onClick={() => sendMessage({ key: 'Enter', target: { value: newMessage } })}
                className="send-button"
                disabled={!newMessage.trim() || !socketConnected || !selectedChat}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatPage;