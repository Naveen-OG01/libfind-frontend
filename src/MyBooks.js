import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function MyBooks() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedStudent = localStorage.getItem('student');
    if (!savedStudent) {
      navigate('/login'); // Kick them to login if not logged in
      return;
    }
    
    const parsedStudent = JSON.parse(savedStudent);
    setStudent(parsedStudent);

    // Fetch the student's active loans
    fetch(`https://libfind-api.onrender.com/api/students/${parsedStudent.roll_number}/loans`)
      .then(res => res.json())
      .then(data => {
        setLoans(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [navigate]);

  if (!student) return null;

  return (
    <div className="app-container">
      <header className="hero" style={{ padding: '40px 20px' }}>
        <h2>📚 My Borrowed Books</h2>
        <p>Welcome back, {student.name}. Here are your active loans.</p>
      </header>

      <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        {loading ? (
          <p>Loading your books...</p>
        ) : loans.length === 0 ? (
          <div className="empty-state">
            <h3>No books borrowed yet!</h3>
            <p>Head back to the home page to find your next read.</p>
            <button className="login-btn" onClick={() => navigate('/')}>Browse Books</button>
          </div>
        ) : (
          <div className="loan-list">
            {loans.map((loan, index) => (
              <div key={index} className={`loan-card ${loan.days_late > 0 ? 'overdue' : ''}`}>
                <div>
                  <h3>{loan.title}</h3>
                  <p>Due Date: {loan.due_date.substring(0, 10)}</p>
                </div>
                <div className="loan-status">
                  {loan.days_late > 0 ? (
                    <div className="fine-alert">
                      ⚠️ OVERDUE by {loan.days_late} days<br/>
                      <strong>Fine: ₹{loan.fine}</strong>
                    </div>
                  ) : (
                    <span className="on-time">✅ On Time</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default MyBooks;
