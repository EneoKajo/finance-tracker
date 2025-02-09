// components/TransactionModal.jsx
import React, { useState } from 'react';
import axios from 'axios';
import '../styles/TransactionModal.css'

const categories = ['food', 'bills', 'transportation', 'entertainment', 'testing']; // Add your categories
const incomeCategories = ['salary', 'freelance', 'investment', 'other']; // Add your income categories


const TransactionModal = ({ isOpen, onClose, type, onTransactionAdd }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('authToken');
            const axiosInstance = axios.create({
                baseURL: 'http://localhost:5000',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
    
            // Format amount based on type and ensure it's stored correctly
            const formattedAmount = type === 'expense' 
                ? -Math.abs(parseFloat(amount)) // Force negative for expenses
                : Math.abs(parseFloat(amount));  // Force positive for income
    
            const response = await axiosInstance.post('/add-transactions', {
                amount: formattedAmount,
                type: type === 'expense' ? 'outcome' : 'income', // Change type here
                description,
                category
            });
    
            if (response.data.success) {
                onTransactionAdd();
                onClose();
                setAmount('');
                setDescription('');
                setCategory(categories[0]);
            }
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to add transaction');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Add {type === 'expense' ? 'Expense' : 'Income'}</h2>
                {error && <p className="error-message">{error}</p>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                        >
                             <option value="">Select a category</option>
                            {(type === 'expense' ? categories : incomeCategories).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" className={type === 'expense' ? 'expense-btn' : 'income-btn'}>
                            Add {type === 'expense' ? 'Expense' : 'Income'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionModal;