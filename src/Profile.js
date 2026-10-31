import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from './api';
import './App.css';

function Profile() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    let student;
    try {
      student = JSON.parse(localStorage.getItem('student') || 'null');
    } catch (parseError) {
      student = null;
    }

    if (!student || !localStorage.getItem('student_token')) {
      navigate('/login');
      return () => { active = false; };
    }

    apiRequest(`/api/students/${encodeURIComponent(student.roll_number)}/dashboard`)
      .then(result => {
        if (active) setData(result);
      })
      .catch(requestError => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [navigate]);

  if (loading) return <main className="page-content loading-state">Loading your account…</main>;
  if (error) return <main className="page-content"><p className="notice error" role="alert">{error}</p></main>;
  if (!data) return <main className="page-content"><p className="notice error">Account details are unavailable.</p></main>;

  return (
    <main className="page-content">
      <header className="page-heading">
        <p className="eyebrow">Student account</p>
        <h2>{data.student.name}</h2>
        <p>{data.student.roll_number} · {data.student.email}</p>
      </header>

      <section className="stats-grid account-stats" aria-label="Account summary">
        <article className="stat-card warning">
          <h3>Unpaid fines</h3>
          <p className="stat-number">₹{data.total_fines || 0}</p>
        </article>
        <article className="stat-card">
          <h3>Books borrowed</h3>
          <p className="stat-number">{data.active_loans.length}</p>
        </article>
        <article className="stat-card info">
          <h3>Reservations</h3>
          <p className="stat-number">{data.reservations.length}</p>
        </article>
      </section>

      <section className="account-section">
        <div className="section-heading">
          <div><h2>Current loans</h2><p>Check due dates and late fees.</p></div>
          <Link className="text-button" to="/my-books">View all loans</Link>
        </div>
        {data.active_loans.length === 0 ? (
          <p className="muted-copy">No active loans.</p>
        ) : (
          <div className="loan-list">
            {data.active_loans.map(loan => (
              <article key={loan.id} className={`loan-card ${loan.days_late > 0 ? 'overdue' : ''}`}>
                <div>
                  <h3>{loan.title}</h3>
                  <p>Due {String(loan.due_date).slice(0, 10)}</p>
                </div>
                <div className="loan-status">
                  {loan.days_late > 0
                    ? <span className="fine-alert">Overdue · ₹{loan.fine}</span>
                    : <span className="on-time">On time</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="account-section">
        <div className="section-heading">
          <div><h2>My reservations</h2><p>Books you have reserved while they are checked out.</p></div>
        </div>
        {data.reservations.length === 0 ? (
          <p className="muted-copy">No pending reservations.</p>
        ) : (
          <div className="loan-list">
            {data.reservations.map(reservation => (
              <article key={reservation.id} className="loan-card reservation-card">
                <div>
                  <h3>{reservation.title}</h3>
                  <p>Reserved {String(reservation.reserve_date).slice(0, 10)}</p>
                </div>
                <span className="reservation-status">Waiting</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Profile;
