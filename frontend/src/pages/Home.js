import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';
import { motion } from 'framer-motion';
import { Wallet, TrendingDown, TrendingUp, Calendar, ClockIcon } from 'lucide-react';
import EditInitialBudgetModal from '../componenets/EditInitialBudget';


const HomePage = () => {
  const [budgetData, setBudgetData] = useState({
    current_budget: 0,
    initial_budget: 0,
  });
  const [username, setUsername] = useState('Guest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [animatedBudget, setAnimatedBudget] = useState({ current: 0, initial: 0 });
  const [transactions, setTransactions] = useState([]);
  const [showEditBudgetModal, setShowEditBudgetModal] = useState(false);


  const navigate = useNavigate();

  // Refs to store critical initial state
  const initialBudgetRef = useRef(0);
  const processedTransactionsRef = useRef(new Set());

  // Precise budget calculation function
  const calculateCurrentBudget = useCallback((initialBudget, transactionsList) => {
    console.log('🧮 Calculating Budget:', {
      initialBudget,
      transactionsCount: transactionsList.length,
      transactionAmounts: transactionsList.map(t => t.amount)
    });

    return initialBudget + transactionsList.reduce((sum, t) => sum + t.amount, 0);
  }, []);

  useEffect(() => {
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
    
        switch (message.type) {
          case 'transaction_update':
            console.log('💸 Received transaction update:', message.data);
    
            if (message.data.action === 'add') {
              const newTransaction = message.data.transaction;
              
              // Extensive logging for debugging
              console.log('🔍 Transaction Details:', {
                id: newTransaction.id,
                amount: newTransaction.amount,
                description: newTransaction.description
              });

              // Prevent processing the same transaction multiple times
              if (processedTransactionsRef.current.has(newTransaction.id)) {
                console.warn(`🚫 Duplicate transaction detected: ${newTransaction.id}`);
                return;
              }

              // Mark this transaction as processed
              processedTransactionsRef.current.add(newTransaction.id);

              // Update transactions and budget
              setTransactions((prevTransactions) => {
                // Ensure no duplicate transactions
                const isDuplicate = prevTransactions.some(t => t.id === newTransaction.id);
                if (isDuplicate) {
                  console.warn(`🚫 Duplicate transaction in state: ${newTransaction.id}`);
                  return prevTransactions;
                }

                // Add new transaction to the beginning of the list
                const updatedTransactions = [newTransaction, ...prevTransactions];

                // Recalculate budget precisely
                const newCurrentBudget = calculateCurrentBudget(
                  initialBudgetRef.current, 
                  updatedTransactions
                );

                // Update budget data
                setBudgetData(prev => ({
                  ...prev,
                  current_budget: newCurrentBudget
                }));

                // Animate budget
                animateBudget(newCurrentBudget, initialBudgetRef.current);

                return updatedTransactions;
              });
            }
            break;
    
          default:
            console.log('ℹ️ Unhandled message type:', message.type);
        }
      } catch (error) {
        console.error('❌ Error processing WebSocket message:', error);
      }
    };
  
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
  
    ws.onclose = () => {
      console.log('🔴 Disconnected from WebSocket');
    };
  
    return () => {
      console.log('🧹 Cleaning up WebSocket connection...');
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [calculateCurrentBudget]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }
    
        const axiosInstance = axios.create({
          baseURL: 'http://localhost:5000',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
    
        // Fetch budget data
        const budgetResponse = await axiosInstance.get('/budget');
        const initialBudget = budgetResponse.data.initial_budget;
        
        // Store initial budget in ref for precise tracking
        initialBudgetRef.current = initialBudget;
        
        setUsername(budgetResponse.data.username || 'Guest');
    
        // Fetch transactions
        const transactionsResponse = await axiosInstance.get('/transactions');
        
        // Mark initial transactions as processed
        processedTransactionsRef.current = new Set(
          transactionsResponse.data.map(t => t.id)
        );
    
        setTransactions(transactionsResponse.data);
    
        // Calculate current budget precisely
        const initialCalculatedBudget = calculateCurrentBudget(
          initialBudget, 
          transactionsResponse.data
        );
    
        // Set the budget data and trigger the animation
        setBudgetData({
          initial_budget: initialBudget,
          current_budget: initialCalculatedBudget,
        });
    
        animateBudget(initialCalculatedBudget, initialBudget);
    
        setLoading(false);
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to load data');
        setLoading(false);
    
        if (error.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchData();
  }, [navigate, calculateCurrentBudget]);

  const animateBudget = (current, initial) => {
    const duration = 1500;
    const steps = 60;
    const currentStep = current / steps;
    const initialStep = initial / steps;
    let currentCount = animatedBudget.current;
    let initialCount = animatedBudget.initial;
    let step = 0;

    const interval = setInterval(() => {
      if (step < steps) {
        currentCount += currentStep;
        initialCount += initialStep;
        setAnimatedBudget({
          current: currentCount,
          initial: initialCount,
        });
        step++;
      } else {
        clearInterval(interval);
        setAnimatedBudget({
          current: current,
          initial: initial,
        });
      }
    }, duration / steps);
  };

  // Helper functions
  const getEarliestTransaction = () => {
    return transactions.length > 0
      ? transactions.reduce((earliest, t) => (t.date < earliest.date ? t : earliest))
      : null;
  };

  const getLatestTransaction = () => {
    return transactions.length > 0
      ? transactions.reduce((latest, t) => (t.date > latest.date ? t : latest))
      : null;
  };

  const getTopRecentTransactions = () => {
    return transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  };

  const handleSaveInitialBudget = async (newInitialBudget) => {
    try {
        const token = localStorage.getItem('authToken');
        await axios.post('http://localhost:5000/add-budget', { initial_budget: newInitialBudget }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        setBudgetData(prevData => ({
            ...prevData,
            initial_budget: newInitialBudget,
        }));
    } catch (error) {
        console.error('Failed to update initial budget:', error);
        // Handle error, show user-friendly message, etc.
    }
};

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="container">
      <motion.div
        className="budget-card"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="card-header">
          <h1>Your Budget Overview</h1>
        </div>

        <div className="budget-info">
          <div className="budget-item">
            <h2>Current Budget</h2>
            <motion.p
              className="budget-amount"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
  {budgetData.current_budget !== null ? `$${budgetData.current_budget.toFixed(2)}` : '-'}
  </motion.p>
          </div>

          <div className="budget-item" onClick={() => setShowEditBudgetModal(true)}>
            <h2 >Initial Budget</h2>
            <motion.p
              className="budget-amount"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
  {budgetData.initial_budget !== null ? `$${budgetData.initial_budget.toFixed(2)}` : '-'}
  </motion.p>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="progress-bar-container">
          <div
            className={`progress-bar ${
              (animatedBudget.current / animatedBudget.initial) < 0.5 ? 'progress-danger' : ''
            }`}
            style={{
              width: `${(animatedBudget.current / animatedBudget.initial) * 100}%`,
            }}
          ></div>
        </div>
      </motion.div>

      {/* Transaction Summary Cards */}
      <motion.div 
        className="transaction-summary-container"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="summary-header">Transaction Overview</h2>
        <div className="transaction-summary-cards">
          <div className="summary-card expenses">
            <div className="summary-icon-wrapper expense-icon">
              <TrendingDown size={24} />
            </div>
            <div className="summary-content">
              <h3>Total Expenses</h3>
              <p className="summary-amount">
                ${Math.abs(transactions
                  .filter(t => t.amount < 0)
                  .reduce((sum, t) => sum + t.amount, 0))
                  .toFixed(2)}
              </p>
              <p className="summary-label">Total outgoing transactions</p>
            </div>
          </div>
          <div className="summary-card income">
            <div className="summary-icon-wrapper income-icon">
              <TrendingUp size={24} />
            </div>
            <div className="summary-content">
              <h3>Total Income</h3>
              <p className="summary-amount">
                ${transactions
                  .filter(t => t.amount > 0)
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
              <p className="summary-label">Total incoming transactions</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Earliest and Latest Transactions */}
      <motion.div 
        className="transaction-cards"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="transaction-card">
          <div className="card-header-with-icon">
            <div className="icon-wrapper">
              <Calendar size={20} />
            </div>
            <h3>Earliest Transaction</h3>
          </div>
          {getEarliestTransaction() ? (
            <div className="transaction-details">
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">{getEarliestTransaction().date}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className={getEarliestTransaction().amount < 0 ? 'amount-negative' : 'amount-positive'}>
                  ${Math.abs(getEarliestTransaction().amount).toFixed(2)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Description:</span>
                <span className="detail-value">{getEarliestTransaction().description}</span>
              </div>
            </div>
          ) : (
            <p>No transactions found.</p>
          )}
        </div>

        <div className="transaction-card">
          <div className="card-header-with-icon">
            <div className="icon-wrapper">
              <ClockIcon size={20} />
            </div>
            <h3>Latest Transaction</h3>
          </div>
          {getLatestTransaction() ? (
            <div className="transaction-details">
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">{getLatestTransaction().date}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className={getLatestTransaction().amount < 0 ? 'amount-negative' : 'amount-positive'}>
                  ${Math.abs(getLatestTransaction().amount).toFixed(2)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Description:</span>
                <span className="detail-value">{getLatestTransaction().description}</span>
              </div>
            </div>
          ) : (
            <p>No transactions found.</p>
          )}
        </div>
      </motion.div>

      {/* Recent Transactions Table */}
      <motion.div 
        className="recent-transactions"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h3>Recent Transactions</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {getTopRecentTransactions().map((t) => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>
                  <span className={t.amount < 0 ? 'table-amount-negative' : 'table-amount-positive'}>
                    ${Math.abs(t.amount).toFixed(2)}
                  </span>
                </td>
                <td>{t.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {showEditBudgetModal && (
  <EditInitialBudgetModal
    initialBudget={budgetData.initial_budget}
    onClose={() => setShowEditBudgetModal(false)}
    onSave={handleSaveInitialBudget}
  />
)}
    </div>
  );
};

export default HomePage;