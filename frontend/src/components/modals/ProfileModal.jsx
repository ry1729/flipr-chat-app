// src/components/modals/ProfileModal.jsx
import React from 'react';
import '../../styles/Modal.css'; // We'll create this CSS file

function ProfileModal({ isOpen, onClose, user }) {
  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>User Profile</h2>
          <button className="modal-close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="profile-avatar">
            {user.profilePic ? (
              <img src={user.profilePic} alt={user.username} />
            ) : (
              <div className="avatar-placeholder-large">
                {user.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="profile-info">
            <h3>{user.username}</h3>
            <p className="profile-email">{user.email}</p>
            {user.bio && <p className="profile-bio">{user.bio}</p>}
            <p className="profile-joined">
              Joined: {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;