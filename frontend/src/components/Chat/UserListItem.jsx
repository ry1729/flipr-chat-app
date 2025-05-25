// src/components/Chat/UserListItem.jsx (Fixed version)
import React from 'react';
import '../../styles/ChatComponents.css'; // Enable CSS import

function UserListItem({ user, handleFunction }) {
    return (
        <div className="user-list-item" onClick={handleFunction}>
            {/* Add fallback for missing avatar */}
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
            <div className="user-info">
                <p className="username">{user.username}</p>
                <p className="email">{user.email}</p>
            </div>
        </div>
    );
}

export default UserListItem;