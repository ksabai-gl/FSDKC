import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DiscoveryJobsTable from '../DiscoveryJobsTable';

describe('DiscoveryJobsTable (SCRUM-91)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders an error state (not an empty table) when the API request fails with 401', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({}),
    });

    render(<DiscoveryJobsTable />);

    await waitFor(() => {
      expect(screen.getByText(/discovery jobs could not be loaded/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/no jobs found/i)).not.toBeInTheDocument();
  });

  it('renders an error state when the fetch itself throws (network error)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));

    render(<DiscoveryJobsTable />);

    await waitFor(() => {
      expect(screen.getByText(/discovery jobs could not be loaded/i)).toBeInTheDocument();
    });
  });

  it('renders the empty state only on a genuinely successful empty response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve([]),
    });

    render(<DiscoveryJobsTable />);

    await waitFor(() => {
      expect(screen.getByText(/no jobs found/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/could not be loaded/i)).not.toBeInTheDocument();
  });

  it('renders job rows on a successful non-empty response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve([{ id: '1', name: 'job-1' }]),
    });

    render(<DiscoveryJobsTable />);

    await waitFor(() => {
      expect(screen.queryByText(/no jobs found/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/could not be loaded/i)).not.toBeInTheDocument();
    });
  });
});
"
      }
    }
  ]
}