import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReactPaginate from 'react-paginate';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import '../styles/Analytics.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const AnalyticsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [budgetData, setBudgetData] = useState({ current_budget: 0, initial_budget: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    action: null
});


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

            const budgetResponse = await axiosInstance.get('/budget');
            setBudgetData(budgetResponse.data);

            const transactionsResponse = await axiosInstance.get('/transactions');
            setTransactions(transactionsResponse.data);

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
    
    // WebSocket connection
    const ws = new WebSocket('ws://localhost:3001');
    console.log('🔄 Attempting WebSocket connection...');
  
    ws.onopen = () => {
        console.log('🟢 Connected to WebSocket');
        const userId = JSON.parse(localStorage.getItem('user')).id;
        console.log('👤 Sending user identification:', userId);
        ws.send(JSON.stringify({
            type: 'identify',
            userId: userId
        }));
    };

    ws.onmessage = (event) => {
      try {
          const message = JSON.parse(event.data);
          console.log('📩 Analytics: Received message:', message);

          if (message.type === 'transaction_update') {
              const update = message.data;
              console.log('💰 Analytics: Transaction update:', update);
              
              let actionText = '';
              switch (update.action) {
                  case 'add':
                      actionText = 'A new transaction was added';
                      break;
                  case 'edit':
                      actionText = 'A transaction was modified';
                      break;
                  case 'delete':
                      actionText = 'A transaction was deleted';
                      break;
                  default:
                      return;
              }

              setNotification({
                  show: true,
                  message: `${actionText}! Would you like to refresh analytics data?`,
                  action: () => fetchData()
              });
          }
      } catch (error) {
          console.error('❌ Analytics: WebSocket message error:', error);
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
  // Fetch data on component mount
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
        setBudgetData(budgetResponse.data);

        // Fetch transactions
        const transactionsResponse = await axiosInstance.get('/transactions');
        setTransactions(transactionsResponse.data);

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
  }, [navigate]);

  // Helper functions to calculate data
  const calculateSpentAmount = () => {
    return Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
  };

  const calculateRemainingBudget = () => {
    const totalTransactions = transactions.reduce((sum, t) => sum + t.amount, 0);
    return budgetData.initial_budget + totalTransactions;
  };

  const calculateTotalIncome = () => {
    return transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  };

  const calculateTotalExpenses = () => {
    return calculateSpentAmount();
  };

  // Chart data functions
  const calculateSpentVsRemaining = () => {
    const spent = calculateSpentAmount();
    const remaining = calculateRemainingBudget();
    return {
      labels: ['Spent', 'Remaining'],
      datasets: [
        {
          data: [spent, remaining],
          backgroundColor: ['#e74c3c', '#27ae60'],
          hoverBackgroundColor: ['#c0392b', '#2ecc71'],
        },
      ],
    };
  };

  const calculateIncomeVsExpenses = () => {
    const income = calculateTotalIncome();
    const expenses = calculateTotalExpenses();
    return {
      labels: ['Income', 'Expenses'],
      datasets: [
        {
          data: [income, expenses],
          backgroundColor: ['#3498db', '#e67e22'],
          hoverBackgroundColor: ['#2980b9', '#d35400'],
        },
      ],
    };
  };

  const calculateExpensesByCategory = () => {
    const categories = {};
    transactions.filter(t => t.amount < 0).forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
    });
    return {
      labels: Object.keys(categories),
      datasets: [
        {
          data: Object.values(categories),
          backgroundColor: ['#9b59b6', '#34495e', '#f1c40f', '#e74c3c', '#1abc9c'],
          hoverBackgroundColor: ['#8e44ad', '#2c3e50', '#f39c12', '#c0392b', '#16a085'],
        },
      ],
    };
  };

  const calculateIncomeByCategory = () => {
    const categories = {};
    transactions.filter(t => t.amount > 0).forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return {
      labels: Object.keys(categories),
      datasets: [
        {
          data: Object.values(categories),
          backgroundColor: ['#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'],
          hoverBackgroundColor: ['#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#d35400'],
        },
      ],
    };
  };

  // Array of chart data and titles
  const charts = [
    { title: 'Spent vs Remaining Budget', data: calculateSpentVsRemaining() },
    { title: 'Income vs Expenses', data: calculateIncomeVsExpenses() },
    { title: 'Expenses by Category', data: calculateExpensesByCategory() },
    { title: 'Income by Category', data: calculateIncomeByCategory() },
  ];

  // Handle pagination
  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="analytics-container">
      <motion.div
        className="analytics-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Analytics Card */}
        <motion.div
          className="analytics-card"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          
          <h2>{charts[currentPage].title}</h2>
          <div className="chart-container">
            <Pie
              data={charts[currentPage].data}
              options={{
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          </div>
          {/* Paginator below the chart */}
          <ReactPaginate
            previousLabel={'Previous'}
            nextLabel={'Next'}
            pageCount={charts.length}
            onPageChange={handlePageClick}
            containerClassName={'pagination'}
            activeClassName={'active'}
          />
          
        </motion.div>

        {/* Budget Overview Cards with Internal Scrolling */}
        <div className="budget-overview-container">
          <motion.div
            className="info-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="icon-wrapper">
              <Wallet size={24} />
            </div>
            <h3>Initial Budget</h3>
            <p className="amount">${budgetData.initial_budget.toFixed(2)}</p>
          </motion.div>

          <motion.div
            className="info-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="icon-wrapper">
              <TrendingDown size={24} />
            </div>
            <h3>Spent Amount</h3>
            <p className="amount negative">${calculateSpentAmount().toFixed(2)}</p>
          </motion.div>

          <motion.div
            className="info-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="icon-wrapper">
              <TrendingUp size={24} />
            </div>
            <h3>Remaining Budget</h3>
            <p className="amount positive">${calculateRemainingBudget().toFixed(2)}</p>
          </motion.div>

          <motion.div
            className="info-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="icon-wrapper">
              <ArrowUp size={24} />
            </div>
            <h3>Total Income</h3>
            <p className="amount positive">${calculateTotalIncome().toFixed(2)}</p>
          </motion.div>

          <motion.div
            className="info-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <div className="icon-wrapper">
              <ArrowDown size={24} />
            </div>
            <h3>Total Expenses</h3>
            <p className="amount negative">${calculateTotalExpenses().toFixed(2)}</p>
          </motion.div>
        </div>
      </motion.div>

      {notification.show && (
                <div className="notification-modal">
                    <div className="notification-content">
                        <p>{notification.message}</p>
                        <div className="notification-actions">
                            <button onClick={() => {
                                notification.action();
                                setNotification(prev => ({ ...prev, show: false }));
                            }}>
                                Refresh
                            </button>
                            <button onClick={() => 
                                setNotification(prev => ({ ...prev, show: false }))
                            }>
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}
    </div>
  );
};

export default AnalyticsPage;