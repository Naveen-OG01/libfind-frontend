import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from './api';
import './App.css';

function MyBooks() {
  const [loans, setLoans] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    let savedStudent;
    try {
      savedStudent = JSON.parse(localStorage.getItem('student') || 'null');
    } catch (parseError) {
      savedStudent = null;
    }

    if (!savedStudent || !localStorage.getItem('student_token')) {
      navigate('/login');
      return () => { active = false; };
    }
    setStudent(savedStudent);

    apiRequest(`/api/students/${encodeURIComponent(savedStudent.roll_number)}/loans`)
      .then(result => {
        if (active) setLoans(Array.isArray(result) ? result : []);
      })
      .catch(requestError => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [navigate]);

  if (!student) return null;

  return (
    <main className="page-content">
      <header className="page-heading">
        <p className="eyebrow">Student account</p>
        <h2>My books</h2>
        <p>Active loans, due dates, renewals, and any current late fees.</p>
      </header>
      {error && <p className="notice error" role="alert">{error}</p>}
      {loading ? (
        <p className="loading-state">Loading your loans…</p>
      ) : loans.length === 0 ? (
        <div className="empty-state">
          <h3>No active loans</h3>
          <p>Browse the catalogue to find your next read.</p>
          <Link className="login-btn" to="/">Browse books</Link>
        </div>
      ) : (
        <div className="loan-list">
          {loans.map(loan => (
            <article key={loan.id} className={`loan-card ${loan.days_late > 0 ? 'overdue' : ''}`}>
              <div>
                <h3>{loan.title}</h3>
                <p>Due {String(loan.due_date).slice(0, 10)}</p>
                <p>{loan.renewals || 0} renewals used</p>
              </div>
              <div className="loan-status">
                {loan.days_late > 0 ? (
                  <span className="fine-alert">
                    Overdue by {loan.days_late} day{loan.days_late === 1 ? '' : 's'} · Fine ₹{loan.fine}
                  </span>
                ) : (
                  <span className="on-time">On time</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default MyBooks;
