import React, { useState } from 'react';
import '../styles/EditInitialBudget.css';

const EditInitialBudgetModal = ({ initialBudget, onClose, onSave }) => {
  const [budget, setBudget] = useState(initialBudget || 0);

  const handleBudgetChange = (e) => {
    setBudget(parseFloat(e.target.value));
  };

  const handleSave = () => {
    onSave(budget);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{initialBudget === 0 ? 'Add Initial Budget' : 'Edit Initial Budget'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <input
            type="number"
            value={budget}
            onChange={handleBudgetChange}
            placeholder={initialBudget || 0}
          />
        </div>
        <div className="modal-footer">
          <button className="save-button" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default EditInitialBudgetModal;