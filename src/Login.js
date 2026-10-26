import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css'; // Reuse the styles

function Login() {
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('https://libfind-api.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roll_number: rollNumber,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Save student info to localStorage
      localStorage.setItem('student', JSON.stringify(data.student));
      
      // Redirect to home page
      navigate('/');
      window.location.reload(); // Refresh to update Navbar

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>🔐 Student Login</h2>
        <p>Log in to borrow books and view your library.</p>
        
        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Roll Number</label>
            <input 
              type="text" 
              placeholder="e.g. 21CS001" 
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-submit-btn">Log In</button>
        </form>
      </div>
    </div>
  );
}

export default Login;