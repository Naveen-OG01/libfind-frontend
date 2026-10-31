import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, downloadReport } from './api';
import './App.css';

const TABS = [
  ['dashboard', 'Dashboard'],
  ['books', 'Books'],
  ['categories', 'Categories'],
  ['import', 'Bulk import'],
  ['students', 'Students'],
  ['notifications', 'Notifications'],
  ['circulation', 'Returns / renewals'],
  ['reservations', 'Reservations'],
  ['analytics', 'Analytics'],
  ['records', 'Records & reports'],
  ['activity', 'Activity log'],
];

const EMPTY_BOOK = {
  title: '',
  author: '',
  isbn: '',
  category: 'General',
  publisher: '',
  publication_year: '',
  total_copies: 1,
  available_copies: '',
  shelf: '',
  rack: '',
  description: '',
};

function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(Boolean(localStorage.getItem('admin_token')));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [students, setStudents] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [records, setRecords] = useState([]);
  const [activity, setActivity] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [bookForm, setBookForm] = useState(EMPTY_BOOK);
  const [editingId, setEditingId] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [importFiles, setImportFiles] = useState({ books: null, students: null });
  const [importMessages, setImportMessages] = useState({ books: '', students: '' });
  const [days, setDays] = useState(2);
  const [resetForm, setResetForm] = useState({ roll_number: '', password: '' });

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      if (activeTab === 'dashboard') {
        const [nextStats, nextReminders, nextReservations] = await Promise.all([
          apiRequest('/api/admin/stats', {}, 'admin_token'),
          apiRequest('/api/admin/reminders?days=2', {}, 'admin_token'),
          apiRequest('/api/admin/reservations', {}, 'admin_token'),
        ]);
        setStats(nextStats);
        setReminders(nextReminders);
        setReservations(nextReservations);
      } else if (activeTab === 'books') {
        const [nextBooks, nextCategories] = await Promise.all([
          apiRequest('/api/admin/books', {}, 'admin_token'),
          apiRequest('/api/admin/categories', {}, 'admin_token'),
        ]);
        setBooks(nextBooks);
        setCategories(nextCategories);
      } else if (activeTab === 'categories') {
        setCategories(await apiRequest('/api/admin/categories', {}, 'admin_token'));
      } else if (activeTab === 'students') {
        setStudents(await apiRequest('/api/admin/students', {}, 'admin_token'));
      } else if (activeTab === 'notifications') {
        setReminders(await apiRequest('/api/admin/reminders?days=2', {}, 'admin_token'));
      } else if (activeTab === 'circulation') {
        setActiveLoans(await apiRequest('/api/admin/loans', {}, 'admin_token'));
      } else if (activeTab === 'reservations') {
        setReservations(await apiRequest('/api/admin/reservations', {}, 'admin_token'));
      } else if (activeTab === 'analytics') {
        setAnalytics(await apiRequest('/api/admin/analytics', {}, 'admin_token'));
      } else if (activeTab === 'records') {
        setRecords(await apiRequest('/api/admin/records', {}, 'admin_token'));
      } else if (activeTab === 'activity') {
        setActivity(await apiRequest('/api/admin/activity?limit=200', {}, 'admin_token'));
      }
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.message.toLowerCase().includes('session')) {
        localStorage.removeItem('admin_token');
        setIsAdmin(false);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  const handleLogin = async event => {
    event.preventDefault();
    setLoginError('');
    setBusy(true);
    try {
      const result = await apiRequest(
        '/api/admin/login',
        {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        },
        null
      );
      localStorage.setItem('admin_token', result.token);
      setIsAdmin(true);
      setPassword('');
    } catch (requestError) {
      setLoginError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAdmin(false);
    setStats(null);
    setError('');
    setNotice('');
  };

  const handleBookSubmit = async event => {
    event.preventDefault();
    setError('');
    setNotice('');
    let bookSaved = false;
    const body = {
      ...bookForm,
      publication_year: bookForm.publication_year ? Number(bookForm.publication_year) : null,
      total_copies: Number(bookForm.total_copies),
      available_copies: bookForm.available_copies === ''
        ? null
        : Number(bookForm.available_copies),
    };
    try {
      const endpoint = editingId
        ? `/api/admin/books/${editingId}`
        : '/api/admin/books';
      const result = await apiRequest(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      }, 'admin_token');
      bookSaved = true;
      if (editingId && coverFile) {
        const formData = new FormData();
        formData.append('file', coverFile);
        await apiRequest(`/api/admin/books/${editingId}/cover`, {
          method: 'POST',
          body: formData,
        }, 'admin_token');
      }
      setNotice(result.message);
      setBookForm(EMPTY_BOOK);
      setEditingId(null);
      setCoverFile(null);
      await loadData(false);
    } catch (requestError) {
      setError(requestError.message);
      if (bookSaved) await loadData(false);
    }
  };

  const handleEditBook = book => {
    setBookForm({
      ...EMPTY_BOOK,
      ...book,
      category: book.category_name || 'General',
      publication_year: book.publication_year || '',
      available_copies: book.available_copies,
    });
    setEditingId(book.id);
    setCoverFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBook = async book => {
    if (!window.confirm(`Delete "${book.title}" and its borrowing history?`)) return;
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest(`/api/admin/books/${book.id}`, {
        method: 'DELETE',
      }, 'admin_token');
      setNotice(result.message);
      await loadData(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAddCategory = async event => {
    event.preventDefault();
    setError('');
    try {
      const result = await apiRequest('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: categoryName }),
      }, 'admin_token');
      setCategories(result.categories);
      setCategoryName('');
      setNotice(result.message);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleDeleteCategory = async name => {
    if (!window.confirm(`Delete the empty category "${name}"?`)) return;
    setError('');
    try {
      const result = await apiRequest(
        `/api/admin/categories/${encodeURIComponent(name)}`,
        { method: 'DELETE' },
        'admin_token'
      );
      setNotice(result.message);
      await loadData(false);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleImport = async (event, type) => {
    event.preventDefault();
    const file = importFiles[type];
    if (!file) return;
    setImportMessages(current => ({ ...current, [type]: 'Importing…' }));
    const formData = new FormData();
    formData.append('file', file);
    try {
      const endpoint = type === 'books'
        ? '/api/admin/bulk-import-books'
        : '/api/admin/bulk-import-students';
      const result = await apiRequest(endpoint, {
        method: 'POST',
        body: formData,
      }, 'admin_token');
      const rowErrors = result.errors && result.errors.length
        ? ` ${result.errors.length} row(s) need attention: ${result.errors.slice(0, 5).join('; ')}`
        : '';
      setImportMessages(current => ({
        ...current,
        [type]: `${result.message}${rowErrors}`,
      }));
      setImportFiles(current => ({ ...current, [type]: null }));
      event.target.reset();
      await loadData(false);
    } catch (requestError) {
      setImportMessages(current => ({ ...current, [type]: requestError.message }));
    }
  };

  const loadReminders = async () => {
    setError('');
    try {
      const result = await apiRequest(
        `/api/admin/reminders?days=${Number(days)}`,
        {},
        'admin_token'
      );
      setReminders(result);
      setNotice(`Found ${result.length} loan(s) due soon or overdue.`);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleSendEmails = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest(
        `/api/admin/send-emails?days=${Number(days)}`,
        { method: 'POST' },
        'admin_token'
      );
      setNotice(result.message);
      if (result.errors && result.errors.length) {
        setError(result.errors.join(' · '));
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleStudentDelete = async student => {
    if (!window.confirm(`Delete ${student.name} (${student.roll_number})?`)) return;
    setError('');
    try {
      const result = await apiRequest(`/api/admin/students/${student.id}`, {
        method: 'DELETE',
      }, 'admin_token');
      setNotice(result.message);
      await loadData(false);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handlePasswordReset = async event => {
    event.preventDefault();
    setError('');
    try {
      const result = await apiRequest(
        `/api/admin/students/${encodeURIComponent(resetForm.roll_number)}/reset-password`,
        {
          method: 'POST',
          body: JSON.stringify({ password: resetForm.password }),
        },
        'admin_token'
      );
      setNotice(result.message);
      setResetForm({ roll_number: '', password: '' });
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleReturn = async (loan, finePaid) => {
    setError('');
    try {
      const result = await apiRequest(`/api/admin/loans/${loan.id}/return`, {
        method: 'POST',
        body: JSON.stringify({ fine_paid: finePaid }),
      }, 'admin_token');
      setNotice(result.message);
      await loadData(false);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleRenew = async loan => {
    setError('');
    try {
      const result = await apiRequest(`/api/admin/loans/${loan.id}/renew`, {
        method: 'POST',
      }, 'admin_token');
      setNotice(result.message);
      await loadData(false);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleDownload = async report => {
    setError('');
    try {
      await downloadReport(report);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="login-container">
        <form className="login-card" onSubmit={handleLogin}>
          <p className="eyebrow">Librarian tools</p>
          <h2>Librarian sign in</h2>
          <p>Sign in to manage the catalogue, circulation, and library reports.</p>
          {loginError && <p className="error-msg" role="alert">{loginError}</p>}
          <div className="input-group">
            <label htmlFor="admin-username">Username</label>
            <input
              id="admin-username"
              value={username}
              onChange={event => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="login-submit-btn" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <main className="page-content admin-page">
      <header className="page-heading admin-heading">
        <div>
          <p className="eyebrow">Librarian tools</p>
          <h2>Library management</h2>
          <p>Manage books, students, circulation, and reports.</p>
        </div>
        <div className="admin-heading-actions">
          <Link className="text-button scan-link" to="/quick-scan">Open quick scan</Link>
          <button
            className="login-submit-btn admin-add-book"
            onClick={() => {
              setActiveTab('books');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            + Add book
          </button>
          <button className="login-btn" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      {error && <p className="notice error" role="alert">{error}</p>}
      {notice && <p className="notice success" role="status">{notice}</p>}
      <nav className="admin-tabs" aria-label="Librarian sections">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            className={`tab-btn ${activeTab === id ? 'active' : ''}`}
            aria-current={activeTab === id ? 'page' : undefined}
            onClick={() => { setActiveTab(id); setError(''); setNotice(''); }}
          >
            {label}
          </button>
        ))}
      </nav>
      {loading && <p className="muted-copy">Loading library data…</p>}

      {activeTab === 'dashboard' && (
        <section>
          {stats && (
            <div className="stats-grid">
              <Stat label="Books borrowed" value={stats.active_loans} />
              <Stat label="Overdue books" value={stats.overdue} kind="danger" />
              <Stat label="Unpaid fines" value={`₹${stats.unpaid_fines || 0}`} kind="warning" />
              <Stat label="Reservations" value={stats.reservations} kind="info" />
              <Stat label="Registered students" value={stats.students} />
            </div>
          )}
          <div className="admin-two-column">
            <section className="panel">
              <h3>Overdue and upcoming due dates</h3>
              {reminders.length === 0 ? <p className="muted-copy">No loans need attention.</p> : (
                <ul className="plain-list">
                  {reminders.slice(0, 8).map((reminder, index) => (
                    <li key={`${reminder.roll_number}-${reminder.title}-${index}`}>
                      <strong>{reminder.name}</strong> · {reminder.title}
                      <span>{reminder.roll_number} · due {String(reminder.due_date).slice(0, 10)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="panel">
              <h3>Pending reservations</h3>
              {reservations.length === 0 ? <p className="muted-copy">No pending reservations.</p> : (
                <ul className="plain-list">
                  {reservations.slice(0, 8).map(item => (
                    <li key={item.id}>
                      <strong>{item.name}</strong> wants {item.title}
                      <span>{item.roll_number} · {String(item.reserve_date).slice(0, 10)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </section>
      )}

      {activeTab === 'books' && (
        <section>
          <form className="panel" onSubmit={handleBookSubmit}>
            <h3>{editingId ? 'Edit book' : 'Add a book'}</h3>
            <div className="form-grid">
              <Field label="Title *" value={bookForm.title} onChange={value => setBookForm({ ...bookForm, title: value })} required />
              <Field label="Author *" value={bookForm.author} onChange={value => setBookForm({ ...bookForm, author: value })} required />
              <Field label="ISBN" value={bookForm.isbn} onChange={value => setBookForm({ ...bookForm, isbn: value })} />
              <Field label="Category" value={bookForm.category} onChange={value => setBookForm({ ...bookForm, category: value })} list="book-categories" />
              <datalist id="book-categories">{categories.map(item => <option key={item.id} value={item.name} />)}</datalist>
              <Field label="Publisher" value={bookForm.publisher} onChange={value => setBookForm({ ...bookForm, publisher: value })} />
              <Field label="Publication year" type="number" min="0" max="2100" value={bookForm.publication_year} onChange={value => setBookForm({ ...bookForm, publication_year: value })} />
              <Field label="Total copies" type="number" min="1" max="10000" value={bookForm.total_copies} onChange={value => setBookForm({ ...bookForm, total_copies: value })} required />
              <Field label="Available copies" type="number" min="0" max={bookForm.total_copies} value={bookForm.available_copies} onChange={value => setBookForm({ ...bookForm, available_copies: value })} />
              <Field label="Shelf" value={bookForm.shelf} onChange={value => setBookForm({ ...bookForm, shelf: value })} />
              <Field label="Rack" value={bookForm.rack} onChange={value => setBookForm({ ...bookForm, rack: value })} />
              <label className="input-group form-wide">
                Description
                <textarea value={bookForm.description} onChange={event => setBookForm({ ...bookForm, description: event.target.value })} rows="3" />
              </label>
            </div>
            <div className="button-row">
              <button type="submit" className="login-submit-btn">{editingId ? 'Save changes' : 'Add book'}</button>
              {editingId && (
                <button type="button" className="secondary-btn" onClick={() => { setEditingId(null); setBookForm(EMPTY_BOOK); setCoverFile(null); }}>
                  Cancel edit
                </button>
              )}
            </div>
            {editingId && (
              <div className="cover-upload">
                {bookForm.cover_image && <img src={bookForm.cover_image} alt={`Current cover for ${bookForm.title}`} />}
                <label className="input-group">
                  Upload cover image (PNG or JPEG, max 5 MB)
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={event => setCoverFile(event.target.files[0] || null)}
                  />
                </label>
              </div>
            )}
          </form>

          <section className="panel">
            <div className="section-heading">
              <div><h3>Catalogue</h3><p>{books.length} titles</p></div>
              <button className="secondary-btn" onClick={() => loadData(false)}>Refresh</button>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Copies</th><th>Location</th><th>Actions</th></tr></thead>
                <tbody>
                  {books.map(book => (
                    <tr key={book.id}>
                      <td>{book.title}<small>{book.isbn || 'No ISBN'}</small></td>
                      <td>{book.author}</td>
                      <td>{book.category_name || 'General'}</td>
                      <td>{book.available_copies} / {book.total_copies}</td>
                      <td>{[book.shelf, book.rack].filter(Boolean).join(' · ') || '—'}</td>
                      <td>
                        <div className="button-row compact-actions">
                          <button className="secondary-btn" onClick={() => handleEditBook(book)}>Edit</button>
                          <button className="danger-btn" disabled={busy} onClick={() => handleDeleteBook(book)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {books.length === 0 && <tr><td colSpan="6">No books in the catalogue.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      )}

      {activeTab === 'categories' && (
        <section className="panel">
          <h3>Manage categories</h3>
          <form className="inline-form" onSubmit={handleAddCategory}>
            <label className="input-group">
              New category name
              <input value={categoryName} onChange={event => setCategoryName(event.target.value)} required />
            </label>
            <button type="submit" className="login-submit-btn">Add category</button>
          </form>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Category</th><th>Books</th><th></th></tr></thead>
              <tbody>
                {categories.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.book_count}</td>
                    <td>
                      {item.book_count === 0 && (
                        <button className="danger-btn" onClick={() => handleDeleteCategory(item.name)}>Delete empty category</button>
                      )}
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && <tr><td colSpan="3">No categories yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'import' && (
        <section className="admin-two-column">
          <ImportPanel
            title="Bulk import books"
            description="CSV columns: title, author, isbn, category, publisher, year, total_copies, shelf, rack."
            sample="title,author,isbn,category,publisher,year,total_copies,shelf,rack%0AThe Example,An Author,9780000000000,General,Publisher,2024,2,A1,R1"
            message={importMessages.books}
            file={importFiles.books}
            onFile={file => setImportFiles({ ...importFiles, books: file })}
            onSubmit={event => handleImport(event, 'books')}
          />
          <ImportPanel
            title="Bulk import students"
            description="CSV columns: name, email, roll_number. The roll number is the initial password."
            sample="name,email,roll_number%0ASample Student,student%40college.edu,ROLL001"
            message={importMessages.students}
            file={importFiles.students}
            onFile={file => setImportFiles({ ...importFiles, students: file })}
            onSubmit={event => handleImport(event, 'students')}
          />
        </section>
      )}

      {activeTab === 'students' && (
        <section>
          <div className="panel">
            <div className="section-heading">
              <div><h3>Registered students</h3><p>{students.length} accounts</p></div>
              <button className="secondary-btn" onClick={() => loadData(false)}>Refresh</button>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Name</th><th>Roll number</th><th>Email</th><th>Active loans</th><th>Actions</th></tr></thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td>{student.name}</td><td>{student.roll_number}</td><td>{student.email}</td>
                      <td>{student.active_loans}</td>
                      <td><button className="danger-btn" onClick={() => handleStudentDelete(student)}>Delete student</button></td>
                    </tr>
                  ))}
                  {students.length === 0 && <tr><td colSpan="5">No students registered.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <form className="panel" onSubmit={handlePasswordReset}>
            <h3>Reset student password</h3>
            <p className="muted-copy">Use this if a student can no longer access their account.</p>
            <div className="form-grid">
              <Field label="Roll number" value={resetForm.roll_number} onChange={value => setResetForm({ ...resetForm, roll_number: value })} required />
              <Field label="New password (at least 6 characters)" type="password" value={resetForm.password} onChange={value => setResetForm({ ...resetForm, password: value })} required minLength="6" />
            </div>
            <button className="login-submit-btn" type="submit">Reset password</button>
          </form>
        </section>
      )}

      {activeTab === 'notifications' && (
        <section className="panel">
          <h3>Email notifications</h3>
          <p className="muted-copy">Preview loans due soon or overdue, then send configured email reminders.</p>
          <div className="inline-form">
            <label className="input-group">
              Look-ahead days
              <input type="number" min="0" max="30" value={days} onChange={event => setDays(event.target.value)} />
            </label>
            <button className="secondary-btn" onClick={loadReminders}>Preview reminders</button>
            <button className="login-submit-btn" onClick={handleSendEmails} disabled={busy || reminders.length === 0}>
              {busy ? 'Sending…' : 'Send reminder emails'}
            </button>
          </div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Student</th><th>Roll number</th><th>Email</th><th>Book</th><th>Due</th></tr></thead>
              <tbody>
                {reminders.map((item, index) => (
                  <tr key={`${item.roll_number}-${item.title}-${index}`}>
                    <td>{item.name}</td><td>{item.roll_number}</td><td>{item.email}</td>
                    <td>{item.title}</td><td>{String(item.due_date).slice(0, 10)}</td>
                  </tr>
                ))}
                {reminders.length === 0 && <tr><td colSpan="5">No books need reminders for this period.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'circulation' && (
        <section className="panel">
          <div className="section-heading">
            <div><h3>Return or renew books</h3><p>{activeLoans.length} active loan(s)</p></div>
            <button className="secondary-btn" onClick={() => loadData(false)}>Refresh</button>
          </div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Student</th><th>Book</th><th>Borrowed</th><th>Due</th><th>Renewals</th><th>Fine owed</th><th>Fine collected?</th><th>Actions</th></tr></thead>
              <tbody>
                {activeLoans.map(loan => (
                  <ActiveLoanRow key={loan.id} loan={loan} onReturn={handleReturn} onRenew={handleRenew} />
                ))}
                {activeLoans.length === 0 && <tr><td colSpan="8">No active loans.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'reservations' && (
        <section className="panel">
          <div className="section-heading">
            <div><h3>Pending reservations</h3><p>{reservations.length} waiting</p></div>
            <button className="secondary-btn" onClick={() => loadData(false)}>Refresh</button>
          </div>
          <DataTable
            columns={['Student', 'Roll number', 'Book', 'Reserved']}
            rows={reservations.map(item => [
              item.name,
              item.roll_number,
              item.title,
              String(item.reserve_date).slice(0, 10),
            ])}
          />
        </section>
      )}

      {activeTab === 'analytics' && analytics && (
        <section>
          <div className="stats-grid">
            <Stat label="Book titles" value={analytics.collection.total_titles} />
            <Stat label="Total copies" value={analytics.collection.total_copies} />
            <Stat label="Available copies" value={analytics.collection.available_copies} kind="info" />
            <Stat label="Availability" value={`${analytics.collection.percent_available}%`} kind="warning" />
            <Stat label="Overdue loans" value={analytics.overdue.length} kind="danger" />
            <Stat label="Fines owed" value={`₹${analytics.overdue_fines}`} kind="warning" />
          </div>
          <div className="admin-two-column">
            <MetricList title="Copies by category" rows={analytics.categories.map(item => ({
              label: item.category_name,
              value: item.total_copies,
              detail: `${item.available_copies} available`,
            }))} />
            <MetricList title="Top authors" rows={analytics.authors.map(item => ({
              label: item.author,
              value: item.copies,
              detail: `${item.titles} titles`,
            }))} />
            <MetricList title="Most borrowed books" rows={analytics.most_borrowed.map(item => ({
              label: item.title,
              value: item.times_borrowed,
              detail: item.author,
            }))} />
            <MetricList title="Low availability" rows={analytics.low_stock.map(item => ({
              label: item.title,
              value: item.available_copies,
              detail: `${item.category_name || 'General'} · Shelf ${item.shelf || '—'} · Rack ${item.rack || '—'}`,
            }))} />
          </div>
          <section className="panel">
            <h3>Overdue loans and fines</h3>
            <DataTable
              columns={['Student', 'Roll number', 'Book', 'Due date', 'Days late', 'Fine']}
              rows={analytics.overdue.map(item => [
                item.name,
                item.roll_number,
                item.title,
                String(item.due_date).slice(0, 10),
                item.days_overdue,
                `₹${item.fine}`,
              ])}
            />
          </section>
        </section>
      )}

      {activeTab === 'records' && (
        <section className="panel">
          <div className="section-heading">
            <div><h3>Borrowing records</h3><p>Full borrowing, return, and fine history.</p></div>
            <div className="button-row">
              <button className="secondary-btn" onClick={() => handleDownload('borrows')}>Download records CSV</button>
              <button className="secondary-btn" onClick={() => handleDownload('inventory')}>Inventory CSV</button>
              <button className="secondary-btn" onClick={() => handleDownload('students')}>Students CSV</button>
              <button className="secondary-btn" onClick={() => handleDownload('fines')}>Fine report CSV</button>
            </div>
          </div>
          <DataTable
            columns={['Student', 'Roll number', 'Book', 'Borrowed', 'Due', 'Returned', 'Status', 'Fine']}
            rows={records.map(item => [
              item.name,
              item.roll_number,
              item.title,
              String(item.borrow_date).slice(0, 10),
              String(item.due_date).slice(0, 10),
              item.return_date ? String(item.return_date).slice(0, 10) : '—',
              item.status,
              item.fine_amount > 0
                ? `₹${item.fine_amount} (${item.fine_paid ? 'paid' : 'unpaid'})`
                : '—',
            ])}
          />
        </section>
      )}

      {activeTab === 'activity' && (
        <section className="panel">
          <div className="section-heading">
            <div><h3>Activity log</h3><p>Latest borrow, return, and renew events.</p></div>
            <button className="secondary-btn" onClick={() => loadData(false)}>Refresh</button>
          </div>
          <DataTable
            columns={['When', 'Action', 'Details']}
            rows={activity.map(item => [
              item.created_at,
              item.action,
              item.details,
            ])}
          />
        </section>
      )}
    </main>
  );
}

function Field({ label, value, onChange, type = 'text', ...props }) {
  return (
    <label className="input-group">
      {label}
      <input type={type} value={value ?? ''} onChange={event => onChange(event.target.value)} {...props} />
    </label>
  );
}

function Stat({ label, value, kind = '' }) {
  return (
    <article className={`stat-card ${kind}`}>
      <h3>{label}</h3>
      <p className="stat-number">{value ?? 0}</p>
    </article>
  );
}

function ImportPanel({ title, description, sample, message, file, onFile, onSubmit }) {
  return (
    <form className="panel" onSubmit={onSubmit}>
      <h3>{title}</h3>
      <p className="muted-copy">{description}</p>
      <a
        className="text-button sample-link"
        href={`data:text/csv;charset=utf-8,${sample}`}
        download={`libfind_${title.toLowerCase().replace(/\s+/g, '_')}_sample.csv`}
      >
        Download sample CSV
      </a>
      <div className="input-group">
        <label htmlFor={`file-${title}`}>Choose CSV file</label>
        <input
          id={`file-${title}`}
          type="file"
          accept=".csv,text/csv"
          onChange={event => onFile(event.target.files[0] || null)}
          required
        />
      </div>
      <button className="login-submit-btn" type="submit" disabled={!file}>Upload and import</button>
      {message && <p className="import-message" role="status">{message}</p>}
    </form>
  );
}

function ActiveLoanRow({ loan, onReturn, onRenew }) {
  const [finePaid, setFinePaid] = useState(false);
  return (
    <tr>
      <td>{loan.name}<small>{loan.roll_number}</small></td>
      <td>{loan.title}</td>
      <td>{String(loan.borrow_date).slice(0, 10)}</td>
      <td>{String(loan.due_date).slice(0, 10)}</td>
      <td>{loan.renewals || 0} / 2</td>
      <td>{loan.fine > 0 ? `₹${loan.fine} (${loan.days_late} days late)` : '—'}</td>
      <td>
        {loan.fine > 0 && (
          <input
            aria-label={`Fine paid for ${loan.title}`}
            type="checkbox"
            checked={finePaid}
            onChange={event => setFinePaid(event.target.checked)}
          />
        )}
      </td>
      <td>
        <div className="button-row compact-actions">
          <button type="button" className="secondary-btn" onClick={() => onRenew(loan)}>Renew</button>
          <button type="button" className="login-submit-btn" onClick={() => onReturn(loan, finePaid)}>Return</button>
        </div>
      </td>
    </tr>
  );
}

function DataTable({ columns, rows }) {
  return (
    <div className="table-scroll">
      <table>
        <thead><tr>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell === null || cell === undefined || cell === '' ? '—' : cell}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={columns.length}>No records to display.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function MetricList({ title, rows }) {
  const max = Math.max(...rows.map(row => Number(row.value) || 0), 1);
  return (
    <section className="panel">
      <h3>{title}</h3>
      {rows.length === 0 ? <p className="muted-copy">No data available.</p> : (
        <ul className="metric-list">
          {rows.map(row => (
            <li key={row.label}>
              <div className="metric-list-heading">
                <strong>{row.label}</strong><span>{row.value}</span>
              </div>
              <div className="metric-track"><span style={{ width: `${Math.min(Number(row.value) / max * 100, 100)}%` }} /></div>
              <small>{row.detail}</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default AdminDashboard;
