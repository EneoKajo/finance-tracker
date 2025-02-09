import React, { useState } from 'react';
import axios from 'axios';
import '../styles/AddGoalModal.css';

const AddGoalModal = ({ showModal, setShowModal, onGoalAdded }) => {
  const [newGoal, setNewGoal] = useState({ 
    name: '', 
    target_amount: '', 
    due_date: '' 
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
  
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post('http://localhost:5000/add-goal', {
        name: newGoal.name,
        target_amount: parseFloat(newGoal.target_amount),
        due_date: new Date(newGoal.due_date).toISOString()
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Reset form
      setNewGoal({ name: '', target_amount: '', due_date: '' });
      
      // Close modal and notify parent component
      setShowModal(false);
      onGoalAdded(response.data); // This will update the goals state in the parent

    } catch (error) {
      console.error('Error adding goal:', error);
      setError(error.response?.data?.error || 'Failed to add goal. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGoal(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!showModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowModal(false)}>
      <div 
        className="modal" 
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="modal-header">
          <h3>Add New Goal</h3>
          
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Goal Name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={newGoal.name}
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
              value={newGoal.target_amount}
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
              value={newGoal.due_date}
              onChange={handleInputChange}
              required
              min={new Date().toISOString().split('T')[0]} // Prevent past dates
            />
          </div>
          
          <div className="modal-actions">
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
              Add Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoalModal;