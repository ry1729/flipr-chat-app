// src/components/Chat/ChatBox.jsx - Enhanced with status indicators
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import api from '../../utils/api';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import ScrollableChat from './ScrollableChat';
import SendMessageForm from './SendMessageForm';
import ProfileModal from '../modals/ProfileModal';
import '../../styles/ChatComponents.css';

let socket;

function ChatBox() {
  const { user } = useAuth();
  const { selectedChat, setSelectedChat, notification, setNotification } = useChat();

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(''); // NEW: Track who is typing
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set()); // NEW: Track online users

  // Socket.IO connection and setup
  useEffect(() => {
    if (!user) return;
    socket = io(import.meta.env.VITE_REACT_APP_SOCKET_ENDPOINT);
    socket.emit('setup', user);
    socket.on('connected', () => setSocketConnected(true));
    
    // Enhanced typing indicators
    socket.on('typing', (data) => {
      setIsTyping(true);
      setTypingUser(data?.username || 'Someone');
    });
    
    socket.on('stop typing', () => {
      setIsTyping(false);
      setTypingUser('');
    });

    // NEW: Online/offline status listeners
    socket.on('user online', (userData) => {
      setOnlineUsers(prev => new Set([...prev, userData.userId]));
      toast.success(`${userData.username} is now online`, {
        position: "top-right",
        autoClose: 2000,
      });
    });

    socket.on('user offline', (userData) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userData.userId);
        return newSet;
      });
      toast.info(`${userData.username} went offline`, {
        position: "top-right",
        autoClose: 2000,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Message received listener
  useEffect(() => {
    socket.on('message received', (newMessageReceived) => {
      if (!selectedChat || selectedChat._id !== newMessageReceived.chat._id) {
        if (!notification.includes(newMessageReceived)) {
          setNotification([newMessageReceived, ...notification]);
          toast.info(`New message from ${newMessageReceived.sender.username}!`);
        }
      } else {
        setMessages((prevMessages) => [...prevMessages, newMessageReceived]);
      }
    });

    // NEW: Handle real-time reaction updates
    socket.on('reaction received', (reactionData) => {
      setMessages((prevMessages) => 
        prevMessages.map(msg => 
          msg._id === reactionData.messageId 
            ? { ...msg, reactions: reactionData.updatedMessage.reactions }
            : msg
        )
      );
    });

    return () => {
      socket.off('message received');
      socket.off('reaction received'); // Clean up reaction listener
    };
  }, [selectedChat, notification, setNotification]);

  // Fetch messages for selected chat
  const fetchMessages = async () => {
    if (!selectedChat) return;

    setLoadingMessages(true);
    try {
      const { data } = await api.get(`/messages/${selectedChat._id}`);
      setMessages(data);
      socket.emit('join chat', selectedChat._id);
    } catch (error) {
      toast.error('Failed to load messages.');
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    setNotification(notification.filter((n) => n.chat._id !== selectedChat?._id));
  }, [selectedChat]);

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

  // NEW: Check if user is online (matching your schema)
  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  // NEW: Format last seen
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return '';
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return lastSeenDate.toLocaleDateString();
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
            <div className="chat-header-with-status">
              <div className="chat-title">
                <h3>{getChatName()}</h3>
                {!selectedChat.isGroupChat && getOtherUser() && (
                  <div className="user-status">
                    <div className={`${isUserOnline(getOtherUser()._id) ? 'online-indicator' : 'offline-indicator'}`}></div>
                  </div>
                )}
              </div>
              {!selectedChat.isGroupChat && getOtherUser() && (
                <div className={`chat-status ${isUserOnline(getOtherUser()._id) ? 'online' : 'offline'}`}>
                  {isUserOnline(getOtherUser()._id) 
                    ? 'Online' 
                    : `Last seen ${formatLastSeen(getOtherUser().lastSeen)}`}
                </div>
              )}
            </div>
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
              <ScrollableChat 
                messages={messages} 
                isTyping={isTyping} 
                typingUser={typingUser}
                socket={socket}
              />
            ) : (
              <div className="no-messages-placeholder">
                Start a conversation!
              </div>
            )}
          </div>

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