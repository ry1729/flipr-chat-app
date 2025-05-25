// src/components/Chat/Message.jsx - Enhanced with reactions
import React, { useState, useEffect } from 'react'; // Added useEffect for socket listener
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import ReactionPicker from './ReactionPicker';
import '../../styles/ChatComponents.css';
import '../../styles/Reactions.css';

function Message({ message, socket }) {
    const { user } = useAuth();
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    // Initialize reactions from message prop.
    // If message.reactions is meant to be a flat array of { user, type, createdAt } from backend,
    // we need to process it to display unique reaction types with counts.
    const [groupedReactions, setGroupedReactions] = useState([]);

    // Determine if the message is from the current user
    const isSelf = message.sender._id === user._id;

    // Helper to group reactions by type
    const groupReactions = (rawReactions) => {
        if (!rawReactions || rawReactions.length === 0) return [];
        const grouped = {};
        rawReactions.forEach(reaction => {
            if (!grouped[reaction.type]) {
                grouped[reaction.type] = {
                    emoji: reaction.type, // 'type' from backend is the emoji
                    users: [],
                };
            }
            // Add user object to the specific reaction type group
            if (reaction.user && !grouped[reaction.type].users.some(u => u._id === reaction.user._id)) {
                grouped[reaction.type].users.push(reaction.user);
            }
        });
        return Object.values(grouped);
    };

    // Update groupedReactions whenever message.reactions changes
    useEffect(() => {
        setGroupedReactions(groupReactions(message.reactions));
    }, [message.reactions]);

    // Handle initial reaction selection from picker
    const handleReactionSelect = async (selectedEmoji) => {
        try {
            // ⭐ CORRECTED: Send as 'reactionType' to match backend expectation ⭐
            const { data } = await api.post(`/messages/${message._id}/reactions`, {
                reactionType: selectedEmoji
            });

            // Update local state with the new grouped reactions from the backend response
            // Backend should return the message with updated reactions
            setGroupedReactions(groupReactions(data.reactions));

            // Emit reaction update via socket (adjust event name if needed)
            socket.emit("message reaction update", { // Used a more specific event name
                chatId: message.chat._id, // Send chat ID for targeted emission
                updatedMessage: data // Send the full updated message object
            });

            toast.success(`Reaction ${selectedEmoji} added!`, { autoClose: 1000 });
            setShowReactionPicker(false); // Close picker after selection
        } catch (error) {
            toast.error('Failed to add reaction');
            console.error('Error adding reaction:', error.response?.data?.message || error.message);
        }
    };

    // Handle clicking on existing reaction (to toggle - add/remove)
    // This logic needs to be robust for toggling reactions.
    // The backend `addReaction` currently just adds. For toggling, it needs to check
    // if the user already reacted with that type and remove it, otherwise add.
    const handleReactionClick = async (clickedEmoji) => {
        try {
            // This API call needs to be designed on the backend to handle toggling.
            // For now, assuming the backend's 'addReaction' simply adds.
            // If you want real toggling, the backend endpoint should either:
            // 1. Have separate add/remove endpoints.
            // 2. Have a single endpoint that checks for existence and toggles.
            // The current `addReaction` only pushes. To toggle, you'd need more logic there.
            // For this fix, I'll assume `handleReactionClick` also tries to 'add' for simplicity,
            // but for production, you'd refine the backend.
            const { data } = await api.post(`/messages/${message._id}/reactions`, {
                reactionType: clickedEmoji
            });

            setGroupedReactions(groupReactions(data.reactions));

            socket.emit("message reaction update", {
                chatId: message.chat._id,
                updatedMessage: data
            });

            // toast.info(`Reaction ${clickedEmoji} toggled!`, { autoClose: 1000 }); // More appropriate toast
        } catch (error) {
            toast.error('Failed to update reaction');
            console.error('Error updating reaction:', error.response?.data?.message || error.message);
        }
    };

    // Check if current user has reacted with specific emoji within a grouped reaction
    const hasUserReacted = (groupedReaction) => {
        return groupedReaction.users.some(u => u._id === user._id);
    };

    // Get reaction tooltip text
    const getReactionTooltip = (groupedReaction) => {
        const usernames = groupedReaction.users.map(u => u.username).join(', ');
        return `${usernames} reacted with ${groupedReaction.emoji}`;
    };

    // Listen for real-time reaction updates
    useEffect(() => {
        if (socket) {
            socket.on("message reaction update", (updatedMessage) => {
                if (updatedMessage._id === message._id) {
                    setGroupedReactions(groupReactions(updatedMessage.reactions));
                }
            });
        }
        // Cleanup socket listener
        return () => {
            if (socket) {
                socket.off("message reaction update");
            }
        };
    }, [socket, message._id]); // Re-subscribe if socket or message ID changes

    return (
        <div className={`message-bubble-wrapper ${isSelf ? 'self' : 'other'}`}>
            <div className="message-bubble">
                <div className="message-sender">
                    {isSelf ? 'You' : message.sender.username}
                </div>

                {/* Render message content based on type */}
                {message.type === 'text' && (
                    <p className="message-content">{message.content}</p>
                )}
                {message.type === 'image' && (
                    <img src={message.content} alt="Sent Image" className="message-image" />
                )}
                {message.type === 'video' && (
                    <video controls src={message.content} className="message-video"></video>
                )}
                {(message.type === 'file' || message.type === 'audio') && (
                    <a href={message.content} target="_blank" rel="noopener noreferrer" className="message-file-link">
                        <span className="file-icon">📁</span> Download {message.type.charAt(0).toUpperCase() + message.type.slice(1)}
                    </a>
                )}

                {/* Reactions Display */}
                {groupedReactions.length > 0 && (
                    <div className="message-reactions">
                        {groupedReactions.map((groupedReaction, index) => (
                            <button
                                key={`${groupedReaction.emoji}-${index}`}
                                className={`reaction-pill ${hasUserReacted(groupedReaction) ? 'user-reacted' : ''}`}
                                onClick={() => handleReactionClick(groupedReaction.emoji)}
                                title={getReactionTooltip(groupedReaction)}
                            >
                                <span className="reaction-emoji">{groupedReaction.emoji}</span>
                                <span className="reaction-count">{groupedReaction.users.length}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="message-footer">
                    <div className="message-timestamp">
                        {new Date(message.createdAt).toLocaleString()}
                    </div>

                    {/* Add Reaction Button */}
                    <button
                        className="add-reaction-btn"
                        onClick={() => setShowReactionPicker(true)}
                        title="Add reaction"
                    >
                        😊
                    </button>
                </div>
            </div>

            {/* Reaction Picker Modal - Render conditionally based on showReactionPicker */}
            {showReactionPicker && (
                <ReactionPicker
                    message={message} // Pass the message to the picker if it needs message details
                    onReactionSelect={handleReactionSelect}
                    isVisible={showReactionPicker} // This prop might be redundant if rendered conditionally
                    onClose={() => setShowReactionPicker(false)}
                />
            )}
        </div>
    );
}

export default Message;