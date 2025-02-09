// Transactions.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/Transactions.css";
import {Edit} from 'lucide-react'
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Calendar,
  ClockIcon,
} from "lucide-react";
import EditTransactionModal from "../componenets/EditTransactionModal";

import TransactionModal from "../componenets/TransactionsModal";

const Transactions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
 const [transactionType, setTransactionType] = useState('');

 const [selectedTransaction, setSelectedTransaction] = useState(null);
const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactions();
    
    const ws = new WebSocket('ws://localhost:3001');
    console.log('🔄 Attempting WebSocket connection...');
  
    ws.onopen = () => {
        console.log('🟢 Connected to WebSocket');
        const userId = JSON.parse(localStorage.getItem('user')).id;
        console.log('👤 Sending user identification:', userId);
        ws.send(JSON.stringify({
            type: 'identify',
            userId: userId,
        }));
    };

    ws.onmessage = (event) => {
      try {
          const message = JSON.parse(event.data);
          console.log('📩 Received WebSocket message:', message);
  
          if (message.type === 'transaction_update') {
              const update = message.data;
              console.log('🔄 Processing transaction update:', update);
              
              switch (update.action) {
                  case 'add':
                      setTransactions(prev => {
                          // Check if transaction already exists in current list
                          if (prev.some(t => t.id === update.transaction.id)) {
                              console.log('🚫 Duplicate transaction detected:', update.transaction.id);
                              return prev;
                          }
                          return [update.transaction, ...prev];
                      });
                      break;
                  case 'edit':
                      setTransactions(prev => {
                          // First check if we already have this exact state
                          const hasExactState = prev.some(t => 
                              t.id === update.transaction.id && 
                              t.amount === update.transaction.amount &&
                              t.description === update.transaction.description &&
                              t.category === update.transaction.category
                          );
                          
                          if (hasExactState) {
                              console.log('🔄 Transaction already in desired state');
                              return prev;
                          }
  
                          // If not, update it
                          return prev.map(t => 
                              t.id === update.transaction.id 
                                  ? {...update.transaction, date: t.date} 
                                  : t
                          );
                      });
                      break;
                  case 'delete':
                      setTransactions(prev => 
                          prev.filter(t => t.id !== update.transactionId)
                      );
                      break;
                  default:
                      console.log('⚠️ Unknown transaction action:', update.action);
              }
          }
      } catch (error) {
          console.error('❌ Error processing WebSocket message:', error);
      }
  };

    ws.onclose = () => {
        console.log('🔴 Disconnected from WebSocket');
    };

    ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
    };

    return () => {
        console.log('🧹 Cleaning up WebSocket connection...');
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    };
}, [navigate]);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const axiosInstance = axios.create({
        baseURL: "http://localhost:5000",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await axiosInstance.get("/transactions");
      setTransactions(response.data);
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to load transactions");
      setLoading(false);
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  };
  

  

 
  
  

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  const handleAddExpense = () => {
    setTransactionType('expense');
    setIsModalOpen(true);
};

const handleAddIncome = () => {
    setTransactionType('income');
    setIsModalOpen(true);
};

const handleTransactionClick = (transaction) => {
  setSelectedTransaction(transaction);
  setIsEditModalOpen(true); 
};
  return (
    <div className="container">
      <motion.div
        className="action-container"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="action-cards">
          <div className="action-card expense" onClick={handleAddExpense}>
            <div className="icon-background expense">
              <TrendingDown size={24} />
            </div>
            <div className="action-content">
              <h3>Add Expense</h3>
              <p>Add new outgoing transaction</p>
            </div>
          </div>
          <div className="action-card income" onClick={handleAddIncome}>
            <div className="icon-background income">
              <TrendingUp size={24} />
            </div>
            <div className="action-content">
              <h3>Add Income</h3>
              <p>Add new incoming transaction</p>
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div
        className="transactions-section"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="transactions-header">
          <p className="transaction-count">
            Total transactions: {transactions.length}
          </p>
        </div>

        <div className="transactions-table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((transaction) => (
                  <tr 
    key={transaction.id} 
    onClick={() => handleTransactionClick(transaction)} 
    className="clickable-row"
>
    <td>{transaction.date}</td>
    <td>{transaction.description}</td>
    <td>{transaction.category}</td>
    <td>
        <div className="amount-cell">
            <span className={transaction.amount < 0 ? 'table-amount-negative' : 'table-amount-positive'}>
                ${Math.abs(transaction.amount).toFixed(2)}
            </span>
            <Edit size={18} className="row-edit-icon" />
        </div>
    </td>
</tr>
                ))}
            </tbody>
          </table>
        </div>
      </motion.div>
      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={transactionType}
        onTransactionAdd={fetchTransactions}
      />
      <EditTransactionModal 
    isOpen={isEditModalOpen}
    onClose={() => {
        setIsEditModalOpen(false);
        setSelectedTransaction(null);
    }}
    transaction={selectedTransaction}
    onTransactionUpdate={fetchTransactions}
/>
    </div>

    
  );
};

export default Transactions;
