import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function QuickScan() {
  const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem('admin_token'));
  const [rollNumber, setRollNumber] = useState('');
  const [student, setStudent] = useState(null);
  const [bookId, setBookId] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  // If not admin, redirect to admin login
  if (!isAdmin) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>🔒 Admin Login Required</h2>
          <p>Please log in to the Librarian Portal first.</p>
          <button className="login-submit-btn" onClick={() => navigate('/admin')}>Go to Admin Login</button>
        </div>
      </div>
    );
  }

  const handleLookup = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setStudent(null);

    try {
      const res = await fetch(`https://libfind-api.onrender.com/api/students/lookup/${rollNumber}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || "Student not found");
      
      setStudent(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!student) return;
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('https://libfind-api.onrender.com/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, book_id: parseInt(bookId) })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || "Checkout failed");
      
      setMessage({ type: 'success', text: `✅ Book checked out to ${student.name}! Due: ${data.due_date.substring(0, 10)}` });
      setBookId(''); // Clear book ID for the next scan
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="app-container">
      <header className="hero" style={{ padding: '40px 20px', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
        <h2>📷 Quick Scan Checkout</h2>
        <p>Scan or type the student ID, then scan the book ID.</p>
      </header>

      <main style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
        
        {message.text && (
          <div style={{ padding: '15px', marginBottom: '20px', borderRadius: '8px', backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444', color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
            {message.text}
          </div>
        )}

        {/* Step 1: Find Student */}
        {!student ? (
          <div className="login-card" style={{ maxWidth: '100%' }}>
            <h3 style={{ color: '#f8fafc', marginBottom: '20px' }}>1️⃣ Scan Student ID</h3>
            <form onSubmit={handleLookup}>
              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="Enter Roll Number..." 
                  value={rollNumber}
                  onChange={e => setRollNumber(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <button type="submit" className="login-submit-btn">Find Student</button>
            </form>
          </div>
        ) : (
          /* Step 2: Checkout Book */
          <div className="login-card" style={{ maxWidth: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#10b981', margin: 0 }}>👤 {student.name}</h3>
              <button onClick={() => { setStudent(null); setRollNumber(''); setMessage({type:'',text:''}); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}>Clear Student</button>
            </div>
            
            <form onSubmit={handleCheckout}>
              <div className="input-group">
                <label style={{ color: '#94a3b8' }}>2️⃣ Scan Book ID</label>
                <input 
                  type="number" 
                  placeholder="Enter Book ID (e.g. 5)..." 
                  value={bookId}
                  onChange={e => setBookId(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <button type="submit" className="login-submit-btn" style={{ backgroundColor: '#10b981' }}>⚡ Process Checkout</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default QuickScan;