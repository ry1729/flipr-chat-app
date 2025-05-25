// src/pages/ChatPage.jsx (Revised for Reactive Responsiveness, Resizable Sidebar, and Theme Toggle)

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import MyChats from '../components/Chat/MyChats';
import ChatBox from '../components/Chat/ChatBox';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext'; // Import useTheme hook
import '../styles/ChatPage.css'; // Ensure ChatPage.css contains all necessary styles

function ChatPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { selectedChat, setSelectedChat } = useChat();
    const { theme, toggleTheme } = useTheme(); // Use theme context to get current theme and toggle function

    // State to track if we are on a mobile view
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // State for sidebar width, initialize from localStorage or default to 400px
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const savedWidth = localStorage.getItem('sidebarWidth');
        // Ensure savedWidth is a valid number, otherwise default to 400
        return savedWidth && !isNaN(parseInt(savedWidth, 10)) ? parseInt(savedWidth, 10) : 400;
    });

    const sidebarRef = useRef(null); // Ref for the sidebar div
    const resizerRef = useRef(null); // Ref for the resizer div (though its direct ref isn't strictly needed for dragging)

    // Effect to handle window resize for mobile detection and sidebar width adjustment
    useEffect(() => {
        const handleResize = () => {
            const currentIsMobile = window.innerWidth <= 768;
            setIsMobile(currentIsMobile);

            if (!currentIsMobile) { // Only adjust on desktop transition or if already desktop
                const savedWidth = localStorage.getItem('sidebarWidth');
                setSidebarWidth(prevWidth => {
                    // If we're transitioning from mobile, or if the current desktop width is too small/large,
                    // apply the saved width or default
                    if (savedWidth && !isNaN(parseInt(savedWidth, 10))) {
                        return parseInt(savedWidth, 10);
                    }
                    // Otherwise, keep the current width if it's reasonable, or reset to 400
                    return (prevWidth > 250 && prevWidth < window.innerWidth - 300) ? prevWidth : 400;
                });
            } else {
                // On mobile, the CSS will handle width: 100%, so no need to update state,
                // but ensure we don't save a 100% width as a desktop preference.
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Effect to save sidebar width to localStorage whenever it changes (for desktop view)
    useEffect(() => {
        // Only save width if it's a desktop view and a valid number
        if (!isMobile && sidebarWidth > 0) {
            localStorage.setItem('sidebarWidth', sidebarWidth.toString());
        }
    }, [sidebarWidth, isMobile]);

    // Handle drag start for the resizable sidebar
    const handleMouseDown = useCallback((e) => {
        if (isMobile) return; // Disable resizing on mobile
        e.preventDefault(); // Prevent text selection during drag

        const startX = e.clientX;
        // Use current.offsetWidth for the actual rendered width of the sidebar
        const initialWidth = sidebarRef.current ? sidebarRef.current.offsetWidth : sidebarWidth;

        const handleMouseMove = (mouseMoveEvent) => {
            // Calculate new width based on mouse movement
            const newWidth = initialWidth + (mouseMoveEvent.clientX - startX);
            
            // Define min/max widths for usability
            const minSidebarWidth = 250; // Minimum width for the sidebar
            const maxSidebarWidth = window.innerWidth - 300; // Leaves at least 300px for the chatbox

            // Ensure new width stays within the defined bounds
            setSidebarWidth(Math.max(minSidebarWidth, Math.min(newWidth, maxSidebarWidth)));
        };

        const handleMouseUp = () => {
            // Remove event listeners once drag stops
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            // Restore default cursor and text selection
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };

        // Add event listeners for dragging
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        // Temporarily disable text selection and change cursor during drag
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ew-resize'; // East-west resize cursor
    }, [isMobile, sidebarWidth]); // Dependencies for useCallback

    // User authentication check on component mount
    useEffect(() => {
        if (!user) {
            navigate('/');
        }
    }, [user, navigate]);

    // Logout Function
    const handleLogout = () => {
        logout();
        toast.info('You have been logged out.');
        navigate('/');
    };

    // Determine visibility of MyChats sidebar and ChatBox pane based on mobile state and selectedChat
    const showChatBoxOnMobile = isMobile && selectedChat;
    const showMyChatsSidebar = isMobile ? !selectedChat : true; // MyChats is visible if not mobile, or if mobile and no chat selected

    return (
        <div className="chat-page-container">
            <div className="chat-page-header">
                {/* Conditionally render back button on mobile when chatbox is active */}
                {showChatBoxOnMobile && (
                    <button onClick={() => setSelectedChat(null)} className="back-button">
                        &larr; Back
                    </button>
                )}
                <h2>Flipr Chat App</h2>
                <div>
                    {user && <span className="logged-in-user">Logged in as: {user.username}</span>}

                    {/* Theme Toggle Button */}
                    <button onClick={toggleTheme} className="theme-toggle-button">
                        {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                    </button>

                    <button onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                </div>
            </div>

            <div className="chat-content-area">
                {/* MyChats Sidebar - conditionally hide/show based on mobile and selectedChat */}
                {showMyChatsSidebar && (
                    <div
                        ref={sidebarRef} // Attach ref for sidebar width calculations
                        className={`my-chats-sidebar ${showChatBoxOnMobile ? 'hidden-on-mobile' : ''}`}
                        // Apply dynamic width for desktop, full width for mobile via CSS
                        style={{ width: isMobile ? '100%' : `${sidebarWidth}px` }}
                    >
                        {/* MyChats component expects selectedChat and setSelectedChat */}
                        <MyChats selectedChat={selectedChat} setSelectedChat={setSelectedChat} />
                    </div>
                )}

                {/* Resizer/Divider - only visible on desktop and when sidebar is shown */}
                {!isMobile && showMyChatsSidebar && (
                    <div
                        ref={resizerRef} // Ref to the resizer element
                        className="resizer"
                        onMouseDown={handleMouseDown} // Attach the drag start handler
                    ></div>
                )}

                {/* ChatBox Pane - conditionally hide/show based on mobile and selectedChat */}
                {/* Show if mobile and a chat is selected, OR if it's desktop (always visible) */}
                {(showChatBoxOnMobile || !isMobile) ? (
                    <div className={`chatbox-pane ${showChatBoxOnMobile ? 'visible-on-mobile' : ''}`}>
                        {selectedChat ? (
                            <ChatBox selectedChat={selectedChat} />
                        ) : (
                            // Display a message when no chat is selected on desktop
                            !isMobile && ( // Only show this message on desktop
                                <div className="no-chat-selected">
                                    <h2>Select a chat to start messaging!</h2>
                                </div>
                            )
                        )}
                    </div>
                ) : null} {/* If not mobile and no chat selected, and it's not desktop, render nothing */}
            </div>
        </div>
    );
}

export default ChatPage;