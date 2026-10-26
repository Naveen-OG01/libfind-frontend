import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is already logged in
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAdmin(true);
      fetchStats();
    }
  }, []);

  const fetchStats = () => {
    fetch('https://libfind-api.onrender.com/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('https://libfind-api.onrender.com/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      
      localStorage.setItem('admin_token', data.token);
      setIsAdmin(true);
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>🛡️ Librarian Login</h2>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Admin Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="login-submit-btn">Login as Admin</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="hero" style={{ padding: '40px 20px', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
        <h2>🛠️ Librarian Dashboard</h2>
        <p>Overview of the college library.</p>
        <button className="login-btn" onClick={() => { localStorage.removeItem('admin_token'); setIsAdmin(false); }}>Logout Admin</button>
      </header>

      <main style={{ padding: '40px' }}>
        {!stats ? <p>Loading stats...</p> : (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>📚 Books Borrowed</h3>
              <p className="stat-number">{stats.active_loans}</p>
            </div>
            <div className="stat-card danger">
              <h3>⚠️ Overdue Books</h3>
              <p className="stat-number">{stats.overdue}</p>
            </div>
            <div className="stat-card warning">
              <h3>💰 Unpaid Fines</h3>
              <p className="stat-number">₹{stats.unpaid_fines}</p>
            </div>
            <div className="stat-card info">
              <h3>🔖 Reservations</h3>
              <p className="stat-number">{stats.reservations}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;