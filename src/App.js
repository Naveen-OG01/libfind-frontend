import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './Login';
import './App.css';
import MyBooks from './MyBooks';
import AdminDashboard from './AdminDashboard';
import Profile from './Profile';
import QuickScan from './QuickScan';

function App() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const fetchBooks = () => {
    fetch('https://libfind-api.onrender.com/api/books')
      .then(res => res.json())
      .then(data => {
        setBooks(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    const savedStudent = localStorage.getItem('student');
    if (savedStudent) setStudent(JSON.parse(savedStudent));
    fetchBooks();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('student');
    setStudent(null);
    navigate('/');
  };

  const handleBorrow = async (bookId) => {
    if (!student) {
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetch('https://libfind-api.onrender.com/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, book_id: bookId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Alert the exact error from the backend
        alert("❌ Error: " + (data.detail || "Unknown error"));
        return;
      }
      
      alert(`✅ Success! Borrowed. Due on ${data.due_date.substring(0, 10)}`);
      
      // Refresh books
      const updatedBooks = await fetch('https://libfind-api.onrender.com/api/books').then(res => res.json());
      setBooks(updatedBooks);

    } catch (err) {
      alert("⚠️ Network Error: " + err.message);
    }
  };


  const handleReserve = async (bookId) => {
    if (!student) {
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetch('https://libfind-api.onrender.com/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, book_id: bookId })
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.detail);
      
      setMessage({ type: 'success', text: data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(search.toLowerCase()) || 
    book.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" style={{ textDecoration: 'none' }}><h1>📚 LibFind</h1></Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
                    <Link to="/">Home</Link>
          <Link to="/admin" style={{ color: '#f59e0b' }}>Librarian Portal</Link>
                    <Link to="/admin" style={{ color: '#f59e0b' }}>Librarian Portal</Link>
          <Link to="/quick-scan" style={{ color: '#10b981', fontWeight: 'bold' }}>📷 Quick Scan</Link>  
           {student && <Link to="/my-books">My Books</Link>}
          
           {student ? (
            <>
              <Link to="/profile" style={{ color: '#38bdf8', fontWeight: 'bold', textDecoration: 'none' }}>
                👤 {student.name}
              </Link>
              <button className="login-btn" onClick={handleLogout} style={{ backgroundColor: '#ef4444' }}>Logout</button>
            </>
          ) : (
            <Link to="/login">
              <button className="login-btn">Student Login</button>
            </Link>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/my-books" element={<MyBooks />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/quick-scan" element={<QuickScan />} />
        <Route path="/" element={
          <>
            <header className="hero">
              <h2>Discover Your Next Read</h2>
              <p>Search the entire college library catalogue.</p>
              
              <input 
                type="text" 
                className="search-bar" 
                placeholder="Search by title, author, or ISBN..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </header>

            {/* Success / Error Message */}
            {message.text && (
              <div style={{ padding: '15px', margin: '20px auto', maxWidth: '600px', textAlign: 'center', borderRadius: '8px', backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444', color: 'white', fontWeight: 'bold' }}>
                {message.text}
                <button onClick={() => setMessage({type:'', text:''})} style={{ marginLeft: '15px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>✖</button>
              </div>
            )}

            <main className="book-grid">
              {loading ? (
                <p>Loading books...</p>
              ) : filteredBooks.length === 0 ? (
                <p>No books found matching your search.</p>
              ) : (
                filteredBooks.map(book => (
                  <div key={book.id} className="book-card">
                                        <div className="book-cover">
                      {book.cover_image ? (
                          <img src={book.cover_image} alt={book.title} />
                      ) : book.isbn ? (
                          // Fetch from Open Library if we have an ISBN
                          <img src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`} alt={book.title} onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : (
                          // Fallback if no ISBN
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#334155', color: '#94a3b8', padding: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
                            {book.title}
                          </div>
                      )}
                    </div>
                    <div className="book-info">
                      <h3>{book.title}</h3>
                      <p className="author">by {book.author}</p>
                      
                      <div className="status">
                        {book.available_copies > 0 ? (
                          <span className="available">✅ {book.available_copies} Available</span>
                        ) : (
                          <span className="checked-out">❌ Checked Out</span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div style={{ marginTop: '15px' }}>
                        {book.available_copies > 0 ? (
                          <button className="action-btn borrow-btn" onClick={() => handleBorrow(book.id)}>Borrow Book</button>
                        ) : (
                          <button className="action-btn reserve-btn" onClick={() => handleReserve(book.id)}>Reserve Book</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </main>
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;