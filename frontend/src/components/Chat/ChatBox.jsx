// src/components/chat/ChatBox.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import api from '../../utils/api';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import LoadingSpinner from '../loadingSpinner';
import ScrollableChat from './ScrollableChat';
import SendMessageForm from './SendMessageForm'; // Import the new SendMessageForm
import ProfileModal from '../modals/ProfileModal';
import '../../styles/ChatComponents.css'; // Reuses the same CSS file

let socket; // Global socket instance

function ChatBox() {
  const { user } = useAuth();
  const { selectedChat, setSelectedChat, notification, setNotification } = useChat();

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // isTyping state for ScrollableChat
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // --- Socket.IO connection and setup ---
  useEffect(() => {
    if (!user) return;
    socket = io(import.meta.env.VITE_REACT_APP_SOCKET_ENDPOINT);
    socket.emit('setup', user);
    socket.on('connected', () => setSocketConnected(true));
    socket.on('typing', () => setIsTyping(true));
    socket.on('stop typing', () => setIsTyping(false));

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // --- Message received listener ---
  useEffect(() => {
    socket.on('message received', (newMessageReceived) => {
      if (!selectedChat || selectedChat._id !== newMessageReceived.chat._id) {
        // If not the selected chat, add to notification
        if (!notification.includes(newMessageReceived)) {
          setNotification([newMessageReceived, ...notification]);
          toast.info(`New message from ${newMessageReceived.sender.username} in ${newMessageReceived.chat.chatName || 'a chat'}!`);
        }
      } else {
        // If it's the selected chat, update messages and mark as read
        setMessages((prevMessages) => [...prevMessages, newMessageReceived]);
      }
    });

    return () => {
      socket.off('message received');
    };
  }, [selectedChat, notification, setNotification]);


  // --- Fetch messages for selected chat ---
  const fetchMessages = async () => {
    if (!selectedChat) return;

    setLoadingMessages(true);
    try {
      const { data } = await api.get(`/messages/${selectedChat._id}`);
      setMessages(data);
      socket.emit('join chat', selectedChat._id); // Join the chat room
    } catch (error) {
      toast.error('Failed to load messages.');
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Remove notification for selected chat when it's opened
    setNotification(notification.filter((n) => n.chat._id !== selectedChat?._id));
  }, [selectedChat]); // Fetch messages whenever selected chat changes


  const getChatName = () => {
    if (!selectedChat) return '';
    return selectedChat.isGroupChat
      ? selectedChat.chatName
      : selectedChat.users.find(u => u._id !== user._id)?.username || 'Direct Message';
  };

  const getOtherUser = () => {
    if (selectedChat && !selectedChat.isGroupChat) {
      return selectedChat.users.find(u => u._id !== user._id);
    }
    return null;
  };

  return (
    <div className="chat-box-container">
      {!selectedChat ? (
        <div className="no-chat-selected">
          Select a chat to start messaging
        </div>
      ) : (
        <>
          <div className="chat-header">
            <h3>
              {getChatName()}
            </h3>
            {!selectedChat.isGroupChat && getOtherUser() && (
              <button
                className="profile-view-button"
                onClick={() => setIsProfileModalOpen(true)}
              >
                View Profile
              </button>
            )}
          </div>

          <div className="message-area">
            {loadingMessages ? (
              <LoadingSpinner />
            ) : messages.length > 0 ? (
              <ScrollableChat messages={messages} isTyping={isTyping} />
            ) : (
              <div className="no-messages-placeholder">
                Start a conversation!
              </div>
            )}
          </div>

          {/* Use the new SendMessageForm component */}
          <SendMessageForm
            selectedChat={selectedChat}
            socket={socket}
            setMessages={setMessages}
            socketConnected={socketConnected}
          />
        </>
      )}

      {isProfileModalOpen && getOtherUser() && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={getOtherUser()}
        />
      )}
    </div>
  );
}

export default ChatBox;