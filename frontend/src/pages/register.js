import React, { useState } from 'react';
import '../styles/LoginPage.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    repeatPassword: '',
    email: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Add success state

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.repeatPassword) {
      setError('Passwords do not match');
      setSuccess(''); // Clear any success message
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:5000/register', {
        username: formData.username,
        password: formData.password,
        email: formData.email
      });

      setSuccess('User registered successfully!'); // Set success message
      setError(''); // Clear any error message
      setFormData({ // Clear form
        username: '',
        password: '',
        repeatPassword: '',
        email: ''
      });

      setTimeout(() => {
        navigate('/login');
    }, 2000);
      
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed');
      setSuccess(''); // Clear any success message
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    if (error) setError('');
    if (success) setSuccess('');
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
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
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
              required
            />
          </div>
          <div className="form-group">
            <label>Repeat Password</label>
            <input
              type="password"
              name="repeatPassword"
              value={formData.repeatPassword}
              onChange={handleChange}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;