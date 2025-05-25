// src/components/modals/GroupChatModal.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import UserListItem from '../Chat/UserListItem';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../styles/Modal.css';
import '../../styles/GroupChatModal.css';

function GroupChatModal({ isOpen, onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Search users
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data } = await api.get(`/users?search=${query}`);
      setSearchResults(data);
    } catch (error) {
      toast.error('Failed to search users');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      searchUsers(value);
    }, 300);
  };

  // Toggle user selection
  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  // Create group chat
  const createGroupChat = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (selectedUsers.length < 2) {
      toast.error('Please select at least 2 members');
      return;
    }

    setIsCreating(true);
    try {
      const { data } = await api.post('/chats/group', {
        name: groupName.trim(),
        users: selectedUsers.map(user => user._id)
      });

      toast.success(`Group "${groupName}" created successfully!`);
      onGroupCreated(data);
      handleClose();
    } catch (error) {
      toast.error('Failed to create group');
      console.error('Group creation error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Reset and close modal
  const handleClose = () => {
    setGroupName('');
    setSearchTerm('');
    setSearchResults([]);
    setSelectedUsers([]);
    clearTimeout(window.searchTimeout);
    onClose();
  };

  // Clear search results when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearTimeout(window.searchTimeout);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content group-chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Group Chat</h2>
          <button className="modal-close-button" onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={createGroupChat} className="modal-body">
          {/* Group Name Input */}
          <div className="form-group">
            <label htmlFor="groupName">Group Name</label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="form-input"
              maxLength={50}
              required
            />
            <div className="char-count">{groupName.length}/50</div>
          </div>

          {/* User Search */}
          <div className="form-group">
            <label htmlFor="userSearch">Add Members</label>
            <input
              id="userSearch"
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search users to add..."
              className="form-input"
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="selected-users">
              <h4>Selected Members ({selectedUsers.length})</h4>
              <div className="selected-users-list">
                {selectedUsers.map(user => (
                  <div key={user._id} className="selected-user-chip">
                    <span>{user.username}</span>
                    <button
                      type="button"
                      onClick={() => toggleUserSelection(user)}
                      className="remove-user-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          <div className="search-results-section">
            {isSearching && <LoadingSpinner />}
            
            {searchResults.length > 0 && (
              <div className="search-results">
                <h4>Search Results</h4>
                <div className="users-list">
                  {searchResults.map(user => (
                    <div key={user._id} className="selectable-user-item">
                      <UserListItem
                        user={user}
                        handleFunction={() => toggleUserSelection(user)}
                      />
                      <div className="selection-indicator">
                        {selectedUsers.find(u => u._id === user._id) ? (
                          <span className="selected-check">✓</span>
                        ) : (
                          <span className="add-btn">+</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchTerm && !isSearching && searchResults.length === 0 && (
              <div className="no-results">
                No users found for "{searchTerm}"
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCreating || !groupName.trim() || selectedUsers.length < 2}
            >
              {isCreating ? 'Creating...' : `Create Group (${selectedUsers.length + 1})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GroupChatModal;