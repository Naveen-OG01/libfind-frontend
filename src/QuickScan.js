import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from './api';
import './App.css';

function QuickScan() {
  const [rollNumber, setRollNumber] = useState('');
  const [student, setStudent] = useState(null);
  const [bookId, setBookId] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const isAdmin = Boolean(localStorage.getItem('admin_token'));

  if (!isAdmin) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Librarian sign-in required</h2>
          <p>Sign in to the librarian portal before using quick checkout.</p>
          <button className="login-submit-btn" onClick={() => navigate('/admin')}>
            Open librarian portal
          </button>
        </div>
      </div>
    );
  }

  const handleLookup = async event => {
    event.preventDefault();
    setMessage({ type: '', text: '' });
    setBusy(true);
    try {
      const result = await apiRequest(
        `/api/students/lookup/${encodeURIComponent(rollNumber.trim())}`,
        {},
        'admin_token'
      );
      setStudent(result);
    } catch (requestError) {
      setStudent(null);
      setMessage({ type: 'error', text: requestError.message });
    } finally {
      setBusy(false);
    }
  };

  const handleCheckout = async event => {
    event.preventDefault();
    if (!student) return;
    setBusy(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await apiRequest(
        '/api/borrow',
        {
          method: 'POST',
          body: JSON.stringify({
            student_id: student.id,
            book_id: Number.parseInt(bookId, 10),
            loan_days: 14,
          }),
        },
        'admin_token'
      );
      setMessage({
        type: 'success',
        text: `Checked out to ${student.name}. Due ${String(result.due_date).slice(0, 10)}.`,
      });
      setBookId('');
    } catch (requestError) {
      setMessage({ type: 'error', text: requestError.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-content">
      <header className="page-heading">
        <p className="eyebrow">Librarian tools</p>
        <h2>Quick scan checkout</h2>
        <p>Scan or type a student roll number, then scan the book ID.</p>
      </header>
      {message.text && <p className={`notice ${message.type}`} role="status">{message.text}</p>}

      {!student ? (
        <form className="login-card scan-card" onSubmit={handleLookup}>
          <h3>1. Find student</h3>
          <div className="input-group">
            <label htmlFor="scan-roll">Student roll number</label>
            <input
              id="scan-roll"
              value={rollNumber}
              onChange={event => setRollNumber(event.target.value)}
              autoFocus
              required
            />
          </div>
          <button className="login-submit-btn" type="submit" disabled={busy}>
            {busy ? 'Looking up…' : 'Find student'}
          </button>
        </form>
      ) : (
        <form className="login-card scan-card" onSubmit={handleCheckout}>
          <div className="scan-student">
            <h3>{student.name}</h3>
            <span>{student.roll_number}</span>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setStudent(null);
                setRollNumber('');
                setMessage({ type: '', text: '' });
              }}
            >
              Clear student
            </button>
          </div>
          <div className="input-group">
            <label htmlFor="scan-book">2. Book ID</label>
            <input
              id="scan-book"
              type="number"
              min="1"
              value={bookId}
              onChange={event => setBookId(event.target.value)}
              autoFocus
              required
            />
          </div>
          <button className="login-submit-btn" type="submit" disabled={busy}>
            {busy ? 'Processing…' : 'Process checkout'}
          </button>
        </form>
      )}
    </main>
  );
}

export default QuickScan;
