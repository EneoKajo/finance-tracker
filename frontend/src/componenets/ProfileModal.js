import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Save, Edit2, LogOut } from 'lucide-react';
import api from '../utils/axios';
import '../styles/ProfileModal.css';

const ProfileModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userDetails, setUserDetails] = useState({
    username: '',
    email: '',
  });
  const [editedDetails, setEditedDetails] = useState({
    username: '',
    email: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUserDetails();
    }
  }, [isOpen]);

  const fetchUserDetails = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/user-details');
      setUserDetails(response.data);
      setEditedDetails(response.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError(error.response?.data?.error || 'Failed to load user details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await api.put('/update-user', editedDetails);
      
      if (response.data.success) {
        setUserDetails(editedDetails);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating user details:', error);
      setError(error.response?.data?.error || 'Failed to update user details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="profile-modal">
        <div className="modal-header">
          <h2>Profile Details</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={isEditing ? editedDetails.username : userDetails.username}
              onChange={(e) => setEditedDetails({
                ...editedDetails,
                username: e.target.value
              })}
              disabled={!isEditing || isLoading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={isEditing ? editedDetails.email : userDetails.email}
              onChange={(e) => setEditedDetails({
                ...editedDetails,
                email: e.target.value
              })}
              disabled={!isEditing || isLoading}
              className="form-input"
            />
          </div>
        </div>

        <div className="modal-footer">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="edit-button"
                disabled={isLoading}
              >
                <Edit2 size={16} />
                <span>Edit</span>
              </button>
              <button
                onClick={handleLogout}
                className="logout-button"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedDetails(userDetails);
                  setError('');
                }}
                className="cancel-button"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="save-button"
                disabled={isLoading}
              >
                <Save size={16} />
                <span>{isLoading ? 'Saving...' : 'Save'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;