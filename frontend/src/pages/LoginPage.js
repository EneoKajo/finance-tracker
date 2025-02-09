import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verify token
      axios.get('http://localhost:5000/verify-token', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(() => {
        navigate('/'); // Redirect to home if token is valid
      })
      .catch(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/login', formData);
      
      if (response.data.success) {
        // Store auth data
        localStorage.setItem('authToken', response.data.authToken);
        localStorage.setItem('user', JSON.stringify({
          username: response.data.user.username,
          id: response.data.user.user_id
        }));

        // Setup axios defaults for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.authToken}`;

        // Navigate to home page
        navigate('/');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    if (error) setError('');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Finance Tracker</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-button">Login</button>
          <div className="register-link">
            Don't have an account? <span onClick={() => navigate('/register')}>Register here</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;