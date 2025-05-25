// src/pages/ChatPage.jsx (Fixed version)
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import MyChats from '../components/Chat/MyChats';
import ChatBox from '../components/Chat/ChatBox';
import { useAuth } from '../context/AuthContext'; // Fixed import path
import { useChat } from '../context/ChatContext';
import '../styles/ChatPage.css';

function ChatPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { selectedChat } = useChat();

    // User authentication check on component mount
    useEffect(() => {
        if (!user) {
            navigate('/'); // Navigate to home, not /login
        }
    }, [user, navigate]);

    // Logout Function
    const handleLogout = () => {
        logout();
        toast.info('You have been logged out.');
        navigate('/');
    };

    return (
        <div className="chat-page-container">
            <div className="chat-page-header">
                <h2>Flipr Chat App</h2>
                {user && <span className="logged-in-user">Logged in as: {user.username}</span>}
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </div>

            <div className="chat-content-area">
                {/* Left Sidebar: My Chats & Search */}
                <div className="my-chats-sidebar">
                    <MyChats />
                </div>

                {/* Right Pane: Chat Box */}
                <div className="chatbox-pane">
                    <ChatBox />
                </div>
            </div>
        </div>
    );
}

export default ChatPage;