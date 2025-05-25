// src/components/Chat/MyChats.jsx - Enhanced with online status
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import UserListItem from './UserListItem';
import { io } from 'socket.io-client';

let socket;

function MyChats() {
    const { user } = useAuth();
    const { selectedChat, setSelectedChat, chats, setChats } = useChat();

    const [loadingChats, setLoadingChats] = useState(false);
    const [search, setSearch] = useState('');
    const [searchResult, setSearchResult] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());

    // Initialize socket for online status (if not already done)
    useEffect(() => {
        if (!socket && user) {
            socket = io(import.meta.env.VITE_REACT_APP_SOCKET_ENDPOINT);
            
            // Listen for online/offline status updates
            socket.on('user online', (userData) => {
                setOnlineUsers(prev => new Set([...prev, userData.userId]));
            });

            socket.on('user offline', (userData) => {
                setOnlineUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(userData.userId);
                    return newSet;
                });
            });
        }

        return () => {
            if (socket) {
                socket.off('user online');
                socket.off('user offline');
            }
        };
    }, [user]);

    // Fetch existing chats of the logged-in user
    const fetchChats = async () => {
        if (!user) return;
        setLoadingChats(true);
        try {
            const { data } = await api.get(`/chats`);
            setChats(data);
            console.log('Fetched user chats:', data);
        } catch (error) {
            toast.error('Failed to load chats.');
            console.error('Error fetching user chats:', error);
        } finally {
            setLoadingChats(false);
        }
    };

    // Search Users Function
    const handleSearch = async () => {
        if (!search) {
            toast.warning('Please enter something to search.');
            return;
        }
        setLoadingSearch(true);
        try {
            const { data } = await api.get(`/users?search=${search}`);
            setSearchResult(data);
            console.log('Search results:', data);
        } catch (error) {
            toast.error('Failed to search users.');
            console.error('Error searching users:', error);
        } finally {
            setLoadingSearch(false);
        }
    };

    // Access (Create or Fetch) Chat with a User
    const accessChat = async (userId) => {
        try {
            setLoadingChats(true);
            const { data } = await api.post('/chats', { userId });
            setSelectedChat(data);
            setSearch('');
            setSearchResult([]);

            // If the newly accessed chat is not already in 'chats' context, add it
            if (!chats.find((c) => c._id === data._id)) {
                setChats([data, ...chats]);
            }
            toast.success('Chat accessed successfully!');
        } catch (error) {
            toast.error('Failed to access chat.');
            console.error('Error accessing chat:', error);
        } finally {
            setLoadingChats(false);
        }
    };

    // Handle Chat Selection (from existing chats list)
    const handleChatSelect = (chat) => {
        setSelectedChat(chat);
    };

    // Check if user is online
    const isUserOnline = (userId) => {
        return onlineUsers.has(userId);
    };

    // Format last seen
    const formatLastSeen = (lastSeen) => {
        if (!lastSeen) return '';
        const now = new Date();
        const lastSeenDate = new Date(lastSeen);
        const diffMs = now - lastSeenDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return lastSeenDate.toLocaleDateString();
    };

    useEffect(() => {
        if (user) {
            fetchChats();
        }
    }, [user]);

    return (
        <div className="my-chats-container">
            <div className="my-chats-header">
                <h3>My Chats</h3>
            </div>

            {/* User Search Section */}
            <div className="chat-search-box">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSearch();
                    }}
                />
                <button onClick={handleSearch} disabled={loadingSearch}>
                    {loadingSearch ? 'Searching...' : 'Go'}
                </button>
            </div>

            {/* Display Search Results */}
            {searchResult.length > 0 && (
                <div className="search-results-list">
                    {searchResult.map((u) => (
                        <UserListItem
                            key={u._id}
                            user={u}
                            handleFunction={() => accessChat(u._id)}
                            isOnline={isUserOnline(u._id)}
                            lastSeen={u.lastSeen}
                        />
                    ))}
                </div>
            )}

            {/* Display User's Existing Chats */}
            <div className="chat-list-area">
                {loadingChats ? (
                    <LoadingSpinner />
                ) : chats.length > 0 ? (
                    chats.map((chat) => {
                        const otherUser = chat.isGroupChat 
                            ? null 
                            : chat.users.find((u) => u._id !== user._id);
                        
                        return (
                            <div
                                key={chat._id}
                                onClick={() => handleChatSelect(chat)}
                                className={`chat-list-item ${selectedChat?._id === chat._id ? 'selected' : ''}`}
                            >
                                <div className="chat-item-content">
                                    <div className="chat-item-header">
                                        <h4>
                                            {chat.isGroupChat
                                                ? chat.chatName
                                                : otherUser?.username || 'Unknown User'}
                                        </h4>
                                        {!chat.isGroupChat && otherUser && (
                                            <div className="user-status">
                                                <div className={`${isUserOnline(otherUser._id) ? 'online-indicator' : 'offline-indicator'}`}></div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {!chat.isGroupChat && otherUser && (
                                        <div className="chat-user-status">
                                            {isUserOnline(otherUser._id) 
                                                ? <span className="online-text">Online</span>
                                                : <span className="last-seen">Last seen {formatLastSeen(otherUser.lastSeen)}</span>
                                            }
                                        </div>
                                    )}
                                    
                                    {chat.latestMessage && (
                                        <p className="latest-message-snippet">
                                            {chat.latestMessage.sender._id === user._id ? 'You: ' : `${chat.latestMessage.sender.username}: `}
                                            {chat.latestMessage.type === 'text'
                                                ? chat.latestMessage.content.substring(0, 30) + (chat.latestMessage.content.length > 30 ? '...' : '')
                                                : `[${chat.latestMessage.type.charAt(0).toUpperCase() + chat.latestMessage.type.slice(1)}]`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="no-chats-found">
                        No chats found. Start a new conversation!
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyChats;