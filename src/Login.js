import React, { useState } from 'react';
import { apiRequest } from './api';
import './App.css';

function Login() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const isRegistration = mode === 'register';
      const result = await apiRequest(
        isRegistration ? '/api/register' : '/api/login',
        {
          method: 'POST',
          body: JSON.stringify(isRegistration
            ? { name, email, roll_number: rollNumber, password }
            : { roll_number: rollNumber, password }),
        },
        null
      );
      localStorage.setItem('student', JSON.stringify(result.student));
      localStorage.setItem('student_token', result.token);
      window.location.assign('/');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{mode === 'login' ? 'Student sign in' : 'Create student account'}</h2>
        <p>
          {mode === 'login'
            ? 'Sign in to borrow books and manage your library account.'
            : 'Register with your college details to start borrowing books.'}
        </p>
        <div className="auth-switch" role="tablist" aria-label="Account options">
          <button
            type="button"
            className={mode === 'login' ? 'selected' : ''}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'selected' : ''}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Register
          </button>
        </div>
        {error && <div className="error-msg" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="input-group">
                <label htmlFor="student-name">Full name</label>
                <input
                  id="student-name"
                  value={name}
                  onChange={event => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="student-email">College email</label>
                <input
                  id="student-email"
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </>
          )}
          <div className="input-group">
            <label htmlFor="student-roll">Roll number</label>
            <input
              id="student-roll"
              value={rollNumber}
              onChange={event => setRollNumber(event.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="student-password">Password</label>
            <input
              id="student-password"
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={mode === 'register' ? 6 : undefined}
              required
            />
          </div>
          {mode === 'register' && (
            <div className="input-group">
              <label htmlFor="student-confirm-password">Confirm password</label>
              <input
                id="student-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
          )}
          <button className="login-submit-btn" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
