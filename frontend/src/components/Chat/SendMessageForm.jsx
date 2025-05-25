// src/components/chat/SendMessageForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';
// import '../../styles/ChatComponents.css'; // Or specific for forms

function SendMessageForm({ selectedChat, socket, setMessages, socketConnected }) {
    const { user } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [typing, setTyping] = useState(false); // Local typing state for this component

    // --- Send Message (Text) ---
    const sendMessage = async (e) => {
        // Trigger only on Enter key press for text messages
        if ((e.key === 'Enter' || e.type === 'click') && newMessage.trim()) {
            socket.emit("stop typing", selectedChat._id); // Stop typing indicator
            try {
                const config = {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user.token}`,
                    },
                };

                const messageContent = newMessage.trim();
                setNewMessage(""); // Clear input immediately

                const { data } = await api.post(
                    `/messages`, // Your backend endpoint for messages
                    {
                        content: messageContent,
                        chatId: selectedChat._id,
                        type: 'text' // Explicitly set type for text messages
                    },
                    config
                );
                socket.emit("new message", data); // Emit new message to socket server
                setMessages((prevMessages) => [...prevMessages, data]); // Update parent's messages state
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

        const fileType = file.type.split('/')[0]; // 'image', 'video', 'audio', 'application' (for file)
        let messageType = 'file';
        if (fileType === 'image') messageType = 'image';
        else if (fileType === 'video') messageType = 'video';
        else if (fileType === 'audio') messageType = 'audio';

        try {
            const formData = new FormData(); // FormData for file uploads
            formData.append('file', file);
            formData.append('chatId', selectedChat._id);
            formData.append('type', messageType); // Pass the determined type

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data', // Important for file uploads
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await api.post(
                `/messages`, // Your backend endpoint for messages
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
                onKeyDown={sendMessage} // Listen for Enter key
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
                onClick={sendMessage} // Use onClick for explicit send button
                className="send-button"
                disabled={!newMessage.trim() || !socketConnected || !selectedChat}
            >
                Send
            </button>
        </div>
    );
}

export default SendMessageForm;