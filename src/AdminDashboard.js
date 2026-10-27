import React, { useState, useEffect } from 'react';
import './App.css';

function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem('admin_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard State
  const [stats, setStats] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [message, setMessage] = useState('');
  
  // Bulk Import State
  const [file, setFile] = useState(null);
  const [importMsg, setImportMsg] = useState('');

  // Manage Books State
  const [books, setBooks] = useState([]);
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '', category: '', total_copies: 1 });
  const [bookMsg, setBookMsg] = useState('');

  const API_URL = 'https://libfind-api.onrender.com';

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchReminders();
      fetchBooks();
    }
  }, [isAdmin]);

  const fetchStats = () => fetch(`${API_URL}/api/admin/stats`).then(r => r.json()).then(d => setStats(d)).catch(console.error);
  const fetchReminders = () => fetch(`${API_URL}/api/admin/reminders`).then(r => r.json()).then(d => setReminders(Array.isArray(d) ? d : [])).catch(console.error);
  const fetchBooks = () => fetch(`${API_URL}/api/admin/books`).then(r => r.json()).then(d => setBooks(Array.isArray(d) ? d : [])).catch(console.error);

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
    } catch (err) { setMessage("Failed to send emails."); }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setImportMsg("Uploading and importing...");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/api/admin/bulk-import-books`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setImportMsg(`✅ ${data.message}`);
      setFile(null);
      fetchBooks();
    } catch (err) { setImportMsg(`❌ Error: ${err.message}`); }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setBookMsg('');
    try {
      const res = await fetch(`${API_URL}/api/admin/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setBookMsg("✅ Book added successfully!");
      setNewBook({ title: '', author: '', isbn: '', category: '', total_copies: 1 });
      fetchBooks();
    } catch (err) { setBookMsg(`❌ Error: ${err.message}`); }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/books/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete");
      fetchBooks();
      setBookMsg("🗑️ Book deleted.");
    } catch (err) { setBookMsg(`❌ Error: ${err.message}`); }
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #334155', paddingBottom: '10px' }}>
          <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</button>
          <button className={`tab-btn ${activeTab === 'books' ? 'active' : ''}`} onClick={() => setActiveTab('books')}>📚 Manage Books</button>
          <button className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`} onClick={() => setActiveTab('import')}>📄 Bulk Import</button>
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

        {/* Manage Books Tab */}
        {activeTab === 'books' && (
          <div>
            <h3 style={{ color: '#38bdf8', marginBottom: '20px' }}>➕ Add a New Book</h3>
            <form onSubmit={handleAddBook} className="login-card" style={{ maxWidth: '100%', marginBottom: '40px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="input-group"><label>Title *</label><input type="text" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} required /></div>
                <div className="input-group"><label>Author *</label><input type="text" value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} required /></div>
                <div className="input-group"><label>ISBN</label><input type="text" value={newBook.isbn} onChange={e => setNewBook({...newBook, isbn: e.target.value})} /></div>
                <div className="input-group"><label>Category</label><input type="text" value={newBook.category} onChange={e => setNewBook({...newBook, category: e.target.value})} /></div>
                <div className="input-group"><label>Total Copies</label><input type="number" value={newBook.total_copies} onChange={e => setNewBook({...newBook, total_copies: parseInt(e.target.value)})} required /></div>
              </div>
              <button type="submit" className="login-submit-btn" style={{ marginTop: '15px' }}>Add Book</button>
              {bookMsg && <p style={{ color: bookMsg.includes('Error') ? '#ef4444' : '#10b981', marginTop: '15px' }}>{bookMsg}</p>}
            </form>

            <h3 style={{ color: '#38bdf8', marginBottom: '20px' }}>📚 Library Catalog</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {books.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                  <div>
                    <strong style={{ color: '#f8fafc' }}>{b.title}</strong>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>by {b.author} | {b.category_name || 'General'}</p>
                  </div>
                  <button onClick={() => handleDeleteBook(b.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bulk Import Tab */}
        {activeTab === 'import' && (
          <div style={{ maxWidth: '600px' }}>
            <h3 style={{ color: '#38bdf8', marginBottom: '20px' }}>📄 Bulk Import Books</h3>
            <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Upload a CSV file with columns: <strong>title, author, isbn, category, publisher, year, total_copies, shelf, rack</strong>.</p>
            <form onSubmit={handleBulkUpload} className="login-card" style={{ maxWidth: '100%' }}>
              <div className="input-group">
                <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} required />
              </div>
              <button type="submit" className="login-submit-btn">Upload & Import</button>
            </form>
            {importMsg && <p style={{ marginTop: '20px', color: '#10b981', fontWeight: 'bold' }}>{importMsg}</p>}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div>
            <h3 style={{ color: '#38bdf8', marginBottom: '20px' }}>Overdue & Due Soon Alerts</h3>
            {reminders.length === 0 ? <p style={{ color: '#94a3b8' }}>No students to notify today.</p> : (
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

      </main>
    </div>
  );
}

export default AdminDashboard;
