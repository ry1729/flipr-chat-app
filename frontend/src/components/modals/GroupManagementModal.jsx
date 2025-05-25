// src/components/modals/GroupManagementModal.jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import '../../styles/Modal.css';
import '../../styles/GroupManagementModal.css';

function GroupManagementModal({ isOpen, onClose, groupChat, onGroupUpdated }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('members');
  const [newGroupName, setNewGroupName] = useState(groupChat?.chatName || '');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !groupChat) return null;

  const isAdmin = groupChat.groupAdmin._id === user._id;

  // Rename Group
  const handleRenameGroup = async (e) => {
    e.preventDefault();
    
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (newGroupName.trim() === groupChat.chatName) {
      toast.info('Group name unchanged');
      return;
    }

    setIsUpdating(true);
    try {
      const { data } = await api.put(`/chats/${groupChat._id}/rename`, {
        chatName: newGroupName.trim()
      });

      onGroupUpdated(data);
      toast.success('Group renamed successfully!');
    } catch (error) {
      toast.error('Failed to rename group');
      console.error('Rename error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    setIsUpdating(true);
    try {
      const { data } = await api.put(`/chats/${groupChat._id}/remove`, {
        userId: userId
      });

      onGroupUpdated(data);
      toast.success('Member removed successfully!');
    } catch (error) {
      toast.error('Failed to remove member');
      console.error('Remove member error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Leave Group
  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) {
      return;
    }

    setIsUpdating(true);
    try {
      await api.put(`/chats/${groupChat._id}/remove`, {
        userId: user._id
      });

      toast.success('You have left the group');
      onClose();
      // The parent component should handle updating the chat list
    } catch (error) {
      toast.error('Failed to leave group');
      console.error('Leave group error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content group-management-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Group Settings</h2>
          <button className="modal-close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              👥 Members ({groupChat.users.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ Settings
            </button>
          </div>

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="tab-content">
              <div className="members-list">
                {groupChat.users.map((member) => (
                  <div key={member._id} className="member-item">
                    <div className="member-info">
                      <div className="member-avatar">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.username} />
                        ) : (
                          <span className="avatar-placeholder">
                            {member.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="member-details">
                        <h4>{member.username}</h4>
                        <p>{member.email}</p>
                        {member._id === groupChat.groupAdmin._id && (
                          <span className="admin-badge">Admin</span>
                        )}
                      </div>
                    </div>
                    
                    {isAdmin && member._id !== user._id && (
                      <button
                        className="remove-member-btn"
                        onClick={() => handleRemoveMember(member._id)}
                        disabled={isUpdating}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="tab-content">
              {/* Group Name */}
              <div className="setting-section">
                <h3>Group Name</h3>
                {isAdmin ? (
                  <form onSubmit={handleRenameGroup} className="rename-form">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Enter group name..."
                      maxLength={50}
                      disabled={isUpdating}
                      className="form-input"
                    />
                    <button
                      type="submit"
                      disabled={isUpdating || !newGroupName.trim()}
                      className="btn btn-primary"
                    >
                      {isUpdating ? 'Updating...' : 'Update Name'}
                    </button>
                  </form>
                ) : (
                  <div className="readonly-setting">
                    <p>{groupChat.chatName}</p>
                    <small>Only admins can change the group name</small>
                  </div>
                )}
              </div>

              {/* Group Info */}
              <div className="setting-section">
                <h3>Group Information</h3>
                <div className="group-stats">
                  <div className="stat-item">
                    <span className="stat-label">Members:</span>
                    <span className="stat-value">{groupChat.users.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Created:</span>
                    <span className="stat-value">
                      {new Date(groupChat.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Admin:</span>
                    <span className="stat-value">{groupChat.groupAdmin.username}</span>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="setting-section danger-zone">
                <h3>Danger Zone</h3>
                <button
                  className="btn btn-danger"
                  onClick={handleLeaveGroup}
                  disabled={isUpdating}
                >
                  {isAdmin ? 'Delete Group' : 'Leave Group'}
                </button>
                <small>
                  {isAdmin 
                    ? 'This will permanently delete the group for all members'
                    : 'You will no longer receive messages from this group'
                  }
                </small>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GroupManagementModal;