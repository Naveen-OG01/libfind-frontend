import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { apiRequest } from './api';

jest.mock('react-router-dom', () => {
  const mockReact = require('react');
  return {
    Link: ({ to, children, ...props }) => mockReact.createElement('a', { href: to, ...props }, children),
    Route: ({ path, element }) => (path === '/' ? element : null),
    Routes: ({ children }) => mockReact.createElement(mockReact.Fragment, null, children),
    useNavigate: () => jest.fn(),
  };
});

jest.mock('./api', () => ({
  apiRequest: jest.fn(),
}));

const book = {
  id: 1,
  title: 'The Example Book',
  author: 'A. Writer',
  category_name: 'Fiction',
  available_copies: 2,
  total_copies: 3,
};

beforeEach(() => {
  localStorage.clear();
  apiRequest.mockImplementation(path => {
    if (path === '/api/categories') return Promise.resolve(['Fiction']);
    return Promise.resolve([book]);
  });
});

test('renders the searchable library catalogue', async () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /discover your next read/i })).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: 'The Example Book' })).toBeInTheDocument();
  expect(screen.getByText('2 available')).toBeInTheDocument();
});

test('submits the selected catalogue filters to the API', async () => {
  render(<App />);

  await screen.findByRole('heading', { name: 'The Example Book' });
  fireEvent.change(screen.getByLabelText('Search terms'), {
    target: { value: 'writer' },
  });
  fireEvent.change(screen.getByLabelText('Search in'), {
    target: { value: 'author' },
  });
  fireEvent.change(screen.getByLabelText('Availability'), {
    target: { value: 'available' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Search books' }));

  await waitFor(() => {
    expect(apiRequest).toHaveBeenCalledWith(
      '/api/books/search?q=writer&field=author&availability=available',
      {},
      null
    );
  });
});
