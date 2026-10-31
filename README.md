# LibFind web portal

React portal for students and librarians, backed by the [LibFind FastAPI service](https://github.com/Naveen-OG01/LibFind).

## Student features

- Search the catalogue by title, author, ISBN, or category.
- Filter by category, publication year, and availability; view shelf and rack locations.
- Register or sign in, borrow available titles, and reserve checked-out titles.
- Review current loans, due dates, overdue fines, and reservations.
- Discover related titles.

## Librarian features

Sign in through the **Librarian portal** to manage books and covers, categories, student accounts, and passwords; import books or students from CSV; process returns and renewals; scan checkouts; review reservations, reminders, analytics, activity, and borrowing history; and export CSV reports.

## Run locally

```powershell
npm install
npm start
```

By default, the portal calls `https://libfind-api.onrender.com`. Set `REACT_APP_API_URL` to use another API URL, then restart the development server or rebuild for production.

Run the frontend tests with `npm test -- --watchAll=false`; create a production build with `npm run build`.

The API must be running and configured with database credentials and librarian login credentials. Email reminders and book-cover uploads also require their respective email and Cloudinary credentials.
