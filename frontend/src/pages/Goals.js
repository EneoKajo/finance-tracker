import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Trash2, Edit2 } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import AddGoalModal from '../componenets/AddGoalModal';
import EditGoalModal from '../componenets/EditGoal';
import '../styles/Goals.css';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [currentBudget, setCurrentBudget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const navigate = useNavigate();
  const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return '$0.00'; // Fallback for invalid numbers
    return `$${number.toFixed(2)}`;
  };

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000',
    headers: { 
      Authorization: `Bearer ${localStorage.getItem('authToken')}` 
    }
  });
  

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const [budgetRes, transactionsRes, goalsRes] = await Promise.all([
        axiosInstance.get('/budget'),
        axiosInstance.get('/transactions'),
        axiosInstance.get('/goals'),
      ]);

      const initialBudget = budgetRes.data.initial_budget;
      const transactionsTotal = transactionsRes.data.reduce((sum, t) => sum + t.amount, 0);
      const calculatedCurrentBudget = initialBudget + transactionsTotal;

      setCurrentBudget(calculatedCurrentBudget);
      setGoals(goalsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch data error:', error);
      setError(error.response?.data?.error || 'Failed to load data');
      setLoading(false);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
      }
    }
  };
  useEffect(() => {
    fetchData();
    
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
            console.log('📩 Received WebSocket message:', message);

            if (message.type === 'goal_update') {
                const update = message.data;
                console.log('🎯 Processing goal update:', update);
                
                switch (update.action) {
                    case 'add':
                        setGoals(prev => {
                            if (prev.some(g => g.id === update.goal.id)) {
                                console.log('🚫 Duplicate goal detected:', update.goal.id);
                                return prev;
                            }
                            return [update.goal, ...prev];
                        });
                        break;
                    case 'edit':
                        setGoals(prev => 
                            prev.map(g => g.id === update.goal.id ? update.goal : g)
                        );
                        break;
                    case 'delete':
                        setGoals(prev => 
                            prev.filter(g => g.id !== update.goalId)
                        );
                        break;
                    default:
                        console.log('⚠️ Unknown goal action:', update.action);
                }
            } else if (message.type === 'transaction_update') {
                // Re-fetch data to update current budget when transactions change
                fetchData();
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

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleAddGoal = async (newGoalData) => {
    try {
        const dueDate = new Date(newGoalData.due_date);
        dueDate.setHours(23, 59, 59, 999);

        await axiosInstance.post('/add-goal', {
            name: newGoalData.name,
            target_amount: parseFloat(newGoalData.target_amount),
            due_date: dueDate.toISOString()
        });

        setShowAddModal(false);
    } catch (error) {
        console.error('Error adding goal:', error);
    }
};

const handleEditGoal = async (editedGoalData) => {
    try {
        const dueDate = new Date(editedGoalData.due_date);
        dueDate.setHours(23, 59, 59, 999);

        await axiosInstance.put(`/edit-goal/${selectedGoal.id}`, {
            name: editedGoalData.name,
            target_amount: parseFloat(editedGoalData.target_amount),
            due_date: dueDate.toISOString()
        });

        setShowEditModal(false);
        setSelectedGoal(null);
    } catch (error) {
        console.error('Error editing goal:', error);
    }
};

const handleDeleteGoal = async (goalId) => {
    try {
        await axiosInstance.delete(`/delete-goal/${goalId}`);
    } catch (error) {
        console.error('Error deleting goal:', error);
        setError('Failed to delete goal. Please try again.');
    }
};

  const openEditModal = (goal) => {
    setSelectedGoal(goal);
    setShowEditModal(true);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) return <div className="loading-container">Loading...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="goals-list">
          {/* Add Goal Card */}
          <div className="goal-card add-goal-card" onClick={() => setShowAddModal(true)}>
            <div className="add-goal-content">
              <div className="add-goal-icon">
                <Plus size={24} />
              </div>
              <h3 className="add-goal-text">Add New Goal</h3>
            </div>
          </div>

          {/* Existing Goals */}
          {goals.length === 0 ? (
            <div className="empty-state">No goals available.</div>
          ) : (
            goals.map((goal) => {
              const isAchievable = currentBudget >= goal.target_amount;
              const progress = Math.min((currentBudget / goal.target_amount) * 100, 100);

              return (
                <div key={goal.id} className="goal-card"                       onClick={() => openEditModal(goal)}
>
                  <div className="goal-header">
                    <h3 className="goal-title">{goal.name}</h3>
                    <div className="goal-date">
                      <Calendar size={16} />
                      <span>{formatDate(goal.due_date)}</span>
                    </div>
                  </div>

                  <div className="goal-amounts">
                    <div className="amount-section">
                      <span className="amount-label">Target Amount</span>
                      <span className={`amount-value ${isAchievable ? 'amount-achievable' : 'amount-not-achievable'}`}>
  {formatCurrency(goal.target_amount)}
</span>
                    </div>
                    <div className="amount-section">
                      <span className="amount-label">Progress</span>
                      
                    </div>
                  </div>

                  <div className="progress-bar-wrapper">
                    <div
                      className={`progress-bar ${isAchievable ? 'progress-achievable' : ''}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <div className="goal-status">
                    {isAchievable ? (
                      <span className="status-achievable">Goal is achievable with current budget</span>
                    ) : (
                      <span className={`amount-value ${isAchievable ? 'amount-achievable' : 'amount-not-achievable'}`}>
</span>
                    )}
                  </div>

               
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Add Goal Modal */}
      <AddGoalModal
        showModal={showAddModal}
        setShowModal={setShowAddModal}
        onGoalAdded={handleAddGoal}
      />

      {/* Edit Goal Modal */}
      <EditGoalModal
        showModal={showEditModal}
        setShowModal={setShowEditModal}
        goalToEdit={selectedGoal}
        onGoalUpdated={handleEditGoal}
      />
    </div>
  );
};

export default Goals;