import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import { apiRequest } from './api';

jest.mock('react-router-dom', () => {
  const mockReact = require('react');
  return {
    Link: ({ to, children, ...props }) => mockReact.createElement('a', { href: to, ...props }, children),
  };
});

jest.mock('./api', () => ({
  apiRequest: jest.fn(),
  downloadReport: jest.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('admin_token', 'test-admin-token');
  apiRequest.mockImplementation(path => {
    if (path === '/api/admin/stats') {
      return Promise.resolve({
        active_loans: 3,
        overdue: 1,
        unpaid_fines: 0,
        reservations: 1,
        students: 5,
      });
    }
    if (path === '/api/admin/analytics') {
      return Promise.resolve({
        collection: {
          total_titles: 4,
          total_copies: 8,
          available_copies: 6,
          percent_available: 75,
        },
        overdue: [],
        overdue_fines: 0,
        categories: [],
        authors: [],
        most_borrowed: [],
        low_stock: [],
      });
    }
    return Promise.resolve([]);
  });
});

test('shows all librarian sections and opens each redesigned workspace', async () => {
  render(<AdminDashboard />);

  const sections = [
    ['Dashboard', 'Library management'],
    ['Books', 'Add a book'],
    ['Categories', 'Manage categories'],
    ['Bulk import', 'Bulk import books'],
    ['Students', 'Registered students'],
    ['Notifications', 'Email notifications'],
    ['Returns / renewals', 'Return or renew books'],
    ['Reservations', 'Pending reservations'],
    ['Analytics', 'Copies by category'],
    ['Records & reports', 'Borrowing records'],
    ['Activity log', 'Activity log'],
  ];

  for (const [tab, heading] of sections) {
    fireEvent.click(screen.getByRole('button', { name: tab }));
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  }
});
