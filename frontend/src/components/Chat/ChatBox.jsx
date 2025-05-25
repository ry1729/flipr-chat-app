// src/components/chat/ChatBox.jsx (Updated and Populated)
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext'; // Use ChatContext for selectedChat, messages, etc.
import api from '../../utils/api';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
// import ScrollableChat from './ScrollableChat'; // If you have this, import it
import SendMessageForm from './SendMessageForm'; // Assuming you have this (from your previous list)
import ProfileModal from '../modals/ProfileModal';
import '../../styles/ChatComponents.css';

let socket; // Global socket instance for this component

function ChatBox() {
    const { user } = useAuth();
    const { selectedChat, setSelectedChat, notification, setNotification, chats, setChats } = useChat(); // Use context

    const [messages, setMessages] = useState([]); // Messages for the selected chat
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false); // Typing indicator from others
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const messagesEndRef = useRef(null); // Ref for auto-scrolling

    // --- Socket.IO connection and setup (from your old ChatPage, now here) ---
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

    // --- Message received listener (from your old ChatPage, now here) ---
    useEffect(() => {
        socket.on('message received', (newMessageReceived) => {
            if (!selectedChat || selectedChat._id !== newMessageReceived.chat._id) {
                // If not the selected chat, add to notification
                if (!notification.some(n => n._id === newMessageReceived._id)) { // Prevent duplicates
                    setNotification([newMessageReceived, ...notification]);
                    toast.info(`New message from ${newMessageReceived.sender.username} in ${newMessageReceived.chat.chatName || 'a chat'}!`);
                    // Update latestMessage in chats context for sidebar preview
                    setChats(prevChats => prevChats.map(chat =>
                        chat._id === newMessageReceived.chat._id
                            ? { ...chat, latestMessage: newMessageReceived }
                            : chat
                    ));
                }
            } else {
                // If it's the selected chat, update messages
                setMessages((prevMessages) => [...prevMessages, newMessageReceived]);
                // Optional: Emit a "read receipt" here if you implement that feature
            }
        });

        return () => {
            socket.off('message received');
        };
    }, [selectedChat, notification, setNotification, setChats]); // Add setChats to dependencies

    // --- Auto-scroll to bottom of messages (from your old ChatPage, now here) ---
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- Fetch messages for selected chat (from your old ChatPage, now here) ---
    const fetchMessages = async () => {
        if (!selectedChat) {
            setMessages([]); // Clear messages if no chat selected
            return;
        }

        setLoadingMessages(true);
        try {
            const { data } = await api.get(`/messages/${selectedChat._id}`); // Your backend endpoint
            setMessages(data);
            socket.emit('join chat', selectedChat._id); // Join the chat room
        } catch (error) {
            toast.error('Failed to load messages.');
            console.error('Error fetching messages:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    // --- Fetch messages whenever selected chat changes (from your old ChatPage, now here) ---
    useEffect(() => {
        fetchMessages();
        // Remove notification for selected chat when it's opened
        setNotification(notification.filter((n) => n.chat._id !== selectedChat?._id));
    }, [selectedChat]); // Fetch messages whenever selected chat changes, also clear notifications

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
        <div className="chat-box-container"> {/* This was your .chat-main-area */}
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
                            // Render individual messages (similar to your old ChatPage's message map)
                            // Ideally, you'd use a ScrollableChat component here as you imported
                            // Assuming your ScrollableChat can take messages and isTyping prop
                            <div className="messages-scroll-container">
                                {messages.map((msg) => (
                                    <div
                                        key={msg._id}
                                        className={`message-bubble-wrapper ${msg.sender._id === user._id ? 'self' : 'other'}`}
                                    >
                                        <div className="message-bubble">
                                            <div className="message-sender">
                                                {msg.sender._id === user._id ? 'You' : msg.sender.username}
                                            </div>
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
                                ))}
                                {isTyping && <div className="typing-indicator">Typing...</div>}
                                <div ref={messagesEndRef} /> {/* Scroll target */}
                            </div>
                        ) : (
                            <div className="no-messages-placeholder">
                                Start a conversation!
                            </div>
                        )}
                    </div>

                    {/* Use the SendMessageForm component for input and send button */}
                    <SendMessageForm
                        selectedChat={selectedChat}
                        socket={socket}
                        setMessages={setMessages} // Send setMessages for updating UI after send
                        socketConnected={socketConnected}
                        // If SendMessageForm needs typingHandler or handleFileUpload directly
                        // you might pass them as props here, or implement them inside SendMessageForm
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