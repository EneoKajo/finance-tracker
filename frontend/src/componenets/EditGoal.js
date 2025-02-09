import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import '../styles/AddGoalModal.css';

const EditGoalModal = ({ 
  showModal, 
  setShowModal, 
  goalToEdit, 
  onGoalUpdated,
  onGoalDeleted 
}) => {
  const [editedGoal, setEditedGoal] = useState({
    name: '',
    target_amount: '',
    due_date: ''
  });
  const [error, setError] = useState('');
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  // Update local state when goalToEdit changes
  useEffect(() => {
    if (goalToEdit) {
      // Format the date for the date input (YYYY-MM-DD)
      const formattedDate = goalToEdit.due_date 
        ? new Date(goalToEdit.due_date).toISOString().split('T')[0] 
        : '';

      setEditedGoal({
        name: goalToEdit.name || '',
        target_amount: goalToEdit.target_amount || '',
        due_date: formattedDate
      });
      // Reset delete confirmation
      setIsDeleteConfirming(false);
    }
  }, [goalToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    if (!editedGoal.name || !editedGoal.target_amount || !editedGoal.due_date) {
      setError('Please fill out all fields');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Ensure the date is at the end of the day
      const dueDate = new Date(editedGoal.due_date);
      dueDate.setHours(23, 59, 59, 999);

      const response = await axios.put(`http://localhost:5000/edit-goal/${goalToEdit.id}`, {
        name: editedGoal.name,
        target_amount: parseFloat(editedGoal.target_amount),
        due_date: dueDate.toISOString()
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Close modal and notify parent component
      setShowModal(false);
      onGoalUpdated(response.data);
    } catch (error) {
      console.error('Error editing goal:', error);
      
      // More detailed error handling
      if (error.response) {
        setError(
          error.response.data.error || 
          error.response.data.message || 
          'Failed to edit goal'
        );
      } else {
        setError('Failed to edit goal. Please try again.');
      }
    }
  };

  const handleDelete = async () => {
    if (!isDeleteConfirming) {
      // First click - show confirmation
      setIsDeleteConfirming(true);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`http://localhost:5000/delete-goal/${goalToEdit.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Close modal and notify parent component
      setShowModal(false);
      onGoalDeleted(goalToEdit.id);
    } catch (error) {
      console.error('Error deleting goal:', error);
      setError(
        error.response?.data?.error || 
        'Failed to delete goal. Please try again.'
      );
      setIsDeleteConfirming(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedGoal(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!showModal || !goalToEdit) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowModal(false)}>
      <div 
        className="modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Edit Goal</h3>
      
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Goal Name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={editedGoal.name}
              onChange={handleInputChange}
              required
              placeholder="Enter goal name"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="target_amount">Target Amount</label>
            <input
              id="target_amount"
              type="number"
              name="target_amount"
              value={editedGoal.target_amount}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              placeholder="Enter target amount"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="due_date">Due Date</label>
            <input
              id="due_date"
              type="date"
              name="due_date"
              value={editedGoal.due_date}
              onChange={handleInputChange}
              required
              min={new Date().toISOString().split('T')[0]} // Prevent past dates
            />
          </div>
          
          <div className="modal-actions">
            <button 
              type="button"
              className={`delete-button ${isDeleteConfirming ? 'confirming' : ''}`}
              onClick={handleDelete}
            >
              <Trash2 size={16} />
              {isDeleteConfirming ? 'Confirm Delete' : 'Delete Goal'}
            </button>
            <div className="update-actions">
              <button 
                type="button" 
                className="cancel-button" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-button"
              >
                Update Goal
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGoalModal;