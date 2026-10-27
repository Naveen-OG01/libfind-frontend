import React, { useState, useEffect } from 'react';
import './App.css';

function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem('admin_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [message, setMessage] = useState('');

  const API_URL = 'https://libfind-api.onrender.com';

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchReminders();
    }
  }, [isAdmin]);

  const fetchStats = () => {
    fetch(`${API_URL}/api/admin/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Stats Error:", err));
  };

  const fetchReminders = () => {
    fetch(`${API_URL}/api/admin/reminders`)
      .then(res => res.json())
      .then(data => setReminders(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("Reminders Error:", err);
        setReminders([]);
      });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      
      localStorage.setItem('admin_token', data.token);
      setIsAdmin(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendEmails = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/send-emails`, { method: 'POST' });
      const data = await res.json();
      setMessage(data.message || "Emails sent!");
    } catch (err) {
      setMessage("Failed to send emails.");
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
            <button type="submit" className="login-submit-btn">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="hero" style={{ padding: '40px 20px', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
        <h2>🛠️ Librarian Portal</h2>
        <p>Manage your library from one place.</p>
        <button className="login-btn" onClick={() => { localStorage.removeItem('admin_token'); setIsAdmin(false); }}>Logout Admin</button>
      </header>

      <main style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #334155', paddingBottom: '10px' }}>
          <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</button>
          <button className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>👥 Students</button>
          <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>✉️ Notifications</button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {!stats ? <p>Loading stats...</p> : (
              <div className="stats-grid">
                <div className="stat-card"><h3>📚 Books Borrowed</h3><p className="stat-number">{stats.active_loans || 0}</p></div>
                <div className="stat-card danger"><h3>⚠️ Overdue Books</h3><p className="stat-number">{stats.overdue || 0}</p></div>
                <div className="stat-card warning"><h3>💰 Unpaid Fines</h3><p className="stat-number">₹{stats.unpaid_fines || 0}</p></div>
                <div className="stat-card info"><h3>🔖 Reservations</h3><p className="stat-number">{stats.reservations || 0}</p></div>
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div>
            <h3 style={{ color: '#38bdf8', marginBottom: '20px' }}>Overdue & Due Soon Alerts</h3>
            {reminders.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No students to notify today.</p>
            ) : (
              <>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px' }}>
                  {reminders.map((r, i) => (
                    <li key={i} style={{ background: '#1e293b', padding: '15px', marginBottom: '10px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                      <strong>{r.name}</strong> ({r.roll_number}) — {r.title} (Due: {r.due_date.substring(0,10)})
                    </li>
                  ))}
                </ul>
                <button onClick={handleSendEmails} className="login-submit-btn" style={{ width: 'auto', padding: '10px 20px' }}>✉️ Send Email Reminders</button>
                {message && <p style={{ color: '#10b981', marginTop: '10px' }}>{message}</p>}
              </>
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div>
            <h3 style={{ color: '#38bdf8', marginBottom: '20px' }}>Registered Students</h3>
            <p style={{ color: '#94a3b8' }}>Bulk Student Import will be added here soon!</p>
          </div>
        )}

      </main>
    </div>
  );
}

export default AdminDashboard;