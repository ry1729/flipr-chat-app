// src/context/ChatContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext'; // Assuming AuthContext provides user
import api from '../utils/api'; // Use the centralized API utility
import { toast } from 'react-toastify';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth(); // Get user from AuthContext
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [notification, setNotification] = useState([]); // For unread messages
  const [loadingChats, setLoadingChats] = useState(false);

  // Function to fetch all chats for the logged-in user
  const fetchChats = async () => {
    if (!user) return; // Don't fetch if no user is logged in

    setLoadingChats(true);
    try {
      const { data } = await api.get('/chats'); // Using the centralized API utility
      setChats(data);
    } catch (error) {
      toast.error('Failed to load chats.');
      console.error("Error fetching chats:", error);
    } finally {
      setLoadingChats(false);
    }
  };

  // Automatically fetch chats when user logs in/changes
  useEffect(() => {
    if (user) {
      fetchChats();
    } else {
      // Clear chats if user logs out
      setChats([]);
      setSelectedChat(null);
      setNotification([]);
    }
  }, [user]); // Dependency on 'user'

  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        chats,
        setChats,
        notification,
        setNotification,
        loadingChats,
        fetchChats, // Provide fetchChats so other components can trigger it
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  return useContext(ChatContext);
};