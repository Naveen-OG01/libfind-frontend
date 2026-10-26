import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function Profile() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedStudent = localStorage.getItem('student');
    if (!savedStudent) {
      navigate('/login');
      return;
    }
    const student = JSON.parse(savedStudent);

    fetch(`https://libfind-api.onrender.com/api/students/${student.roll_number}/dashboard`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [navigate]);

  if (loading) return <div className="app-container" style={{padding: '50px', textAlign: 'center'}}>Loading profile...</div>;
  if (!data) return <div className="app-container" style={{padding: '50px', textAlign: 'center'}}>Error loading profile.</div>;

  return (
    <div className="app-container">
      <header className="hero" style={{ padding: '40px 20px', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
        <h2>👤 {data.student.name}</h2>
        <p>Roll No: {data.student.roll_number} | Email: {data.student.email}</p>
      </header>

      <main style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Stats Row */}
        <div className="stats-grid" style={{ marginBottom: '40px' }}>
          <div className="stat-card warning">
            <h3>💰 Unpaid Fines</h3>
            <p className="stat-number" style={{ color: data.total_fines > 0 ? '#ef4444' : '#10b981' }}>
              ₹{data.total_fines}
            </p>
          </div>
          <div className="stat-card">
            <h3>📚 Books Borrowed</h3>
            <p className="stat-number">{data.active_loans.length}</p>
          </div>
          <div className="stat-card info">
            <h3>🔖 Reservations</h3>
            <p className="stat-number">{data.reservations.length}</p>
          </div>
        </div>

        {/* Active Loans */}
        <h3 style={{ color: '#38bdf8', marginBottom: '15px' }}>📖 Current Loans</h3>
        {data.active_loans.length === 0 ? (
          <p style={{ color: '#94a3b8', marginBottom: '30px' }}>No active loans.</p>
        ) : (
          <div className="loan-list" style={{ marginBottom: '40px' }}>
            {data.active_loans.map((loan, i) => (
              <div key={i} className="loan-card">
                <div>
                  <h3>{loan.title}</h3>
                  <p>Due: {loan.due_date.substring(0, 10)}</p>
                </div>
                <div className="loan-status">
                   <span className="on-time">✅ Active</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reservations */}
        <h3 style={{ color: '#38bdf8', marginBottom: '15px' }}>🔖 My Reservations</h3>
        {data.reservations.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No pending reservations.</p>
        ) : (
          <div className="loan-list">
            {data.reservations.map((res, i) => (
              <div key={i} className="loan-card" style={{ borderLeftColor: '#f59e0b' }}>
                <div>
                  <h3>{res.title}</h3>
                  <p>Reserved on: {res.reserve_date.substring(0, 10)}</p>
                </div>
                <div className="loan-status">
                   <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>⏳ Waiting</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

export default Profile;