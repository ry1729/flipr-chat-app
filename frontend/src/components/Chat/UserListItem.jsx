// src/components/Chat/UserListItem.jsx (Enhanced with online status)
import React from 'react';
import '../../styles/ChatComponents.css';

function UserListItem({ user, handleFunction, isOnline, lastSeen }) {
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

    return (
        <div className="user-list-item" onClick={handleFunction}>
            <div className="user-avatar-container">
                {user.avatar || user.profilePic ? (
                    <img 
                        src={user.avatar || user.profilePic} 
                        alt={user.username} 
                        className="user-avatar" 
                    />
                ) : (
                    <div className="user-avatar avatar-placeholder">
                        {user.username?.charAt(0).toUpperCase()}
                    </div>
                )}
                {/* Online status indicator */}
                <div className={`status-indicator ${isOnline ? 'online-indicator' : 'offline-indicator'}`}></div>
            </div>
            
            <div className="user-info">
                <div className="user-name-status">
                    <p className="username">{user.username}</p>
                    {isOnline ? (
                        <span className="online-badge">Online</span>
                    ) : (
                        <span className="last-seen-badge">
                            {formatLastSeen(lastSeen)}
                        </span>
                    )}
                </div>
                <p className="email">{user.email}</p>
            </div>
        </div>
    );
}

export default UserListItem;