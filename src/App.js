import React, { useCallback, useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import Login from './Login';
import MyBooks from './MyBooks';
import Profile from './Profile';
import QuickScan from './QuickScan';
import { apiRequest } from './api';
import './App.css';

function getSavedStudent() {
  try {
    return JSON.parse(localStorage.getItem('student') || 'null');
  } catch (error) {
    localStorage.removeItem('student');
    localStorage.removeItem('student_token');
    return null;
  }
}

function App() {
  const [student, setStudent] = useState(getSavedStudent);
  const [books, setBooks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [field, setField] = useState('all');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('any');
  const [year, setYear] = useState('');
  const [loanDays, setLoanDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [recommendations, setRecommendations] = useState({});
  const [recommendationError, setRecommendationError] = useState('');
  const navigate = useNavigate();

  const loadBooks = useCallback(async (filters = {}) => {
    setLoading(true);
    setError('');
    setSuggestions([]);
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.field) params.set('field', filters.field);
    if (filters.category) params.set('category', filters.category);
    if (filters.availability && filters.availability !== 'any') {
      params.set('availability', filters.availability);
    }
    if (filters.year) params.set('year', filters.year);

    try {
      const result = await apiRequest(
        `/api/books/search?${params.toString()}`,
        {},
        null
      );
      const matches = Array.isArray(result) ? result : [];
      setBooks(matches);
      setSuggestions([]);
      if (
        matches.length === 0
        && filters.query
        && (!filters.field || filters.field === 'all' || filters.field === 'title')
      ) {
        const suggestionParams = new URLSearchParams({ q: filters.query });
        if (filters.category) suggestionParams.set('category', filters.category);
        if (filters.availability && filters.availability !== 'any') {
          suggestionParams.set('availability', filters.availability);
        }
        if (filters.year) suggestionParams.set('year', filters.year);
        const nearby = await apiRequest(
          `/api/books/suggestions?${suggestionParams.toString()}`,
          {},
          null
        );
        setSuggestions(Array.isArray(nearby) ? nearby : []);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest('/api/categories', {}, null)
      .then(result => {
        if (active) setCategories(Array.isArray(result) ? result : []);
      })
      .catch(requestError => {
        if (active) setError(requestError.message);
      });
    loadBooks();
    return () => { active = false; };
  }, [loadBooks]);

  const handleLogout = () => {
    localStorage.removeItem('student');
    localStorage.removeItem('student_token');
    setStudent(null);
    setMessage({ type: '', text: '' });
    navigate('/');
  };

  const handleSearch = event => {
    event.preventDefault();
    setRecommendations({});
    loadBooks({ query, field, category, availability, year });
  };

  const handleBorrow = async bookId => {
    if (!student) {
      navigate('/login');
      return;
    }
    try {
      const result = await apiRequest('/api/borrow', {
        method: 'POST',
        body: JSON.stringify({
          student_id: student.id,
          book_id: bookId,
          loan_days: Number(loanDays) || 14,
        }),
      });
      setMessage({
        type: 'success',
        text: `Borrowed successfully. Return by ${String(result.due_date).slice(0, 10)}.`,
      });
      loadBooks({ query, field, category, availability, year });
    } catch (requestError) {
      setMessage({ type: 'error', text: requestError.message });
    }
  };

  const handleReserve = async bookId => {
    if (!student) {
      navigate('/login');
      return;
    }
    try {
      const result = await apiRequest('/api/reserve', {
        method: 'POST',
        body: JSON.stringify({ student_id: student.id, book_id: bookId }),
      });
      setMessage({ type: 'success', text: result.message });
    } catch (requestError) {
      setMessage({ type: 'error', text: requestError.message });
    }
  };

  const loadRecommendations = async bookId => {
    setRecommendationError('');
    try {
      const result = await apiRequest(
        `/api/books/${bookId}/recommendations`,
        {},
        null
      );
      setRecommendations(current => ({ ...current, [bookId]: result }));
    } catch (requestError) {
      setRecommendationError(requestError.message);
    }
  };

  const renderBook = book => (
    <article key={book.id} className="book-card">
      <div className="book-cover">
        {book.cover_image ? (
          <img src={book.cover_image} alt={`Cover of ${book.title}`} />
        ) : book.isbn ? (
          <img
            src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`}
            alt={`Cover of ${book.title}`}
            onError={event => { event.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="no-cover">{book.title}</div>
        )}
      </div>
      <div className="book-info">
        <h3>{book.title}</h3>
        <p className="author">by {book.author}</p>
        <p className="book-meta">
          {[book.category_name, book.publication_year, book.publisher].filter(Boolean).join(' · ')}
        </p>
        <p className="book-meta">
          {[book.shelf && `Shelf ${book.shelf}`, book.rack && `Rack ${book.rack}`]
            .filter(Boolean).join(' · ') || 'Location not listed'}
        </p>
        <div className="status">
          {Number(book.available_copies) > 0 ? (
            <span className="available">{book.available_copies} available</span>
          ) : (
            <span className="checked-out">Currently checked out</span>
          )}
        </div>
        <div className="book-actions">
          {Number(book.available_copies) > 0 ? (
            <button className="action-btn borrow-btn" onClick={() => handleBorrow(book.id)}>
              Borrow book
            </button>
          ) : (
            <button className="action-btn reserve-btn" onClick={() => handleReserve(book.id)}>
              Reserve book
            </button>
          )}
          <button
            className="text-button"
            onClick={() => loadRecommendations(book.id)}
            aria-expanded={Boolean(recommendations[book.id])}
          >
            Similar books
          </button>
        </div>
        {recommendations[book.id] && (
          <div className="recommendations">
            <strong>Readers also explore</strong>
            {recommendations[book.id].length ? (
              recommendations[book.id].map(item => (
                <p key={item.id}>{item.title} <span>by {item.author}</span></p>
              ))
            ) : (
              <p>No similar titles found.</p>
            )}
          </div>
        )}
      </div>
    </article>
  );

  const homePage = (
    <>
      <header className="hero">
        <h2>Discover your next read</h2>
        <p>Search by title, author, ISBN, or category, then find it on the shelf.</p>
        <form className="catalog-search" onSubmit={handleSearch}>
          <label>
            Search terms
            <input
              className="search-bar"
              type="search"
              placeholder="Title, author, ISBN, or category"
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
          </label>
          <div className="search-filters">
            <label>
              Search in
              <select value={field} onChange={event => setField(event.target.value)}>
                <option value="all">Everywhere</option>
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="isbn">ISBN</option>
                <option value="category">Category</option>
              </select>
            </label>
            <label>
              Category
              <select value={category} onChange={event => setCategory(event.target.value)}>
                <option value="">All categories</option>
                {categories.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label>
              Availability
              <select value={availability} onChange={event => setAvailability(event.target.value)}>
                <option value="any">Any availability</option>
                <option value="available">Available only</option>
                <option value="checked_out">Checked out</option>
              </select>
            </label>
            <label>
              Publication year
              <input
                type="number"
                min="0"
                max="2100"
                placeholder="Any year"
                value={year}
                onChange={event => setYear(event.target.value)}
              />
            </label>
            <label>
              Loan period (days)
              <input
                type="number"
                min="1"
                max="30"
                value={loanDays}
                onChange={event => setLoanDays(event.target.value)}
              />
            </label>
          </div>
          <button type="submit" className="login-submit-btn">Search books</button>
        </form>
      </header>

      {message.text && (
        <div className={`notice ${message.type}`} role="status">
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}
      {error && <p className="notice error" role="alert">{error}</p>}
      {recommendationError && <p className="notice error" role="alert">{recommendationError}</p>}

      <main className="catalog">
        <div className="section-heading">
          <div>
            <h2>Library catalogue</h2>
            <p>{loading ? 'Searching the catalogue…' : `${books.length} matching title${books.length === 1 ? '' : 's'}`}</p>
          </div>
          <button
            className="text-button"
            onClick={() => {
              setQuery('');
              setField('all');
              setCategory('');
              setAvailability('any');
              setYear('');
              loadBooks();
            }}
          >
            Clear filters
          </button>
        </div>
        {loading ? (
          <div className="loading-state"><div className="spinner" /><p>Loading library catalogue…</p></div>
        ) : books.length === 0 ? (
          <div className="empty-state">
            <h3>No matching books</h3>
            <p>Try a different title, author, ISBN, or category.</p>
            {suggestions.length > 0 && (
              <section className="suggestion-results">
                <h3>Did you mean one of these?</h3>
                <div className="book-grid">
                  {suggestions.map(book => renderBook(book))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="book-grid">{books.map(book => renderBook(book))}</div>
        )}
      </main>
    </>
  );

  return (
    <div className="app-container">
      <nav className="navbar">
        <Link to="/" className="brand"><h1>LibFind</h1></Link>
        <div className="nav-links">
          <Link to="/">Catalogue</Link>
          {student && <Link to="/my-books">My books</Link>}
          {student ? (
            <>
              <Link to="/profile">Hi, {student.name}</Link>
              <button className="login-btn" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <Link to="/login" className="login-btn">Student sign in</Link>
          )}
          <Link to="/admin" className="librarian-link">Librarian portal</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/my-books" element={<MyBooks />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/quick-scan" element={<QuickScan />} />
        <Route path="/" element={homePage} />
      </Routes>
    </div>
  );
}

export default App;
