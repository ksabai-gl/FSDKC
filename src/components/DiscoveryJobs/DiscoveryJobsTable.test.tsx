import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiscoveryJobsTable } from './DiscoveryJobsTable';
import * as hookModule from '../../hooks/useDiscoveryJobsQuery';

vi.mock('../../hooks/useDiscoveryJobsQuery', () => ({
  useDiscoveryJobsQuery: vi.fn(),
}));

vi.mock('./DiscoveryJobRow', () => ({
  DiscoveryJobRow: ({ job }: { job: { id: string; name?: string } }) => (
    <tr data-testid="job-row">
      <td>{job.name ?? job.id}</td>
    </tr>
  ),
}));

function renderWithMock(mockReturn: any) {
  (hookModule.useDiscoveryJobsQuery as unknown as vi.Mock).mockReturnValue(mockReturn);
  return render(<DiscoveryJobsTable />);
}

describe('DiscoveryJobsTable (SCRUM-91 fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Bug fix test: the core SCRUM-91 scenario ---
  it('renders an error state (not an empty table) when jobsQuery.isError is true', () => {
    const refetch = vi.fn();
    renderWithMock({
      isLoading: false,
      isError: true,
      data: undefined,
      error: new Error('Network request failed'),
      refetch,
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load discovery jobs/i)).toBeInTheDocument();
    expect(screen.getByText(/Network request failed/i)).toBeInTheDocument();
    expect(screen.queryByTestId('job-row')).not.toBeInTheDocument();
  });

  it('calls refetch when Retry is clicked in the error state', () => {
    const refetch = vi.fn();
    renderWithMock({
      isLoading: false,
      isError: true,
      data: undefined,
      error: new Error('boom'),
      refetch,
    });

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('omits error detail when error is not an Error instance', () => {
    renderWithMock({
      isLoading: false,
      isError: true,
      data: undefined,
      error: 'some-string-error',
      refetch: vi.fn(),
    });

    expect(screen.getByText(/Failed to load discovery jobs/i)).toBeInTheDocument();
    expect(screen.queryByText(/some-string-error/i)).not.toBeInTheDocument();
  });

  // --- Regression tests: loading state still works ---
  it('renders a loading state while jobsQuery.isLoading is true', () => {
    renderWithMock({
      isLoading: true,
      isError: false,
      data: undefined,
      error: undefined,
      refetch: vi.fn(),
    });

    expect(screen.getByText(/Loading discovery jobs/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // --- Regression tests: successful data render still works ---
  it('renders job rows when the query succeeds with data', () => {
    renderWithMock({
      isLoading: false,
      isError: false,
      data: [
        { id: 'job-1', name: 'Job One' },
        { id: 'job-2', name: 'Job Two' },
      ],
      error: undefined,
      refetch: vi.fn(),
    });

    const rows = screen.getAllByTestId('job-row');
    expect(rows).toHaveLength(2);
    expect(screen.getByText('Job One')).toBeInTheDocument();
    expect(screen.getByText('Job Two')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // --- Regression / edge case: genuinely empty successful response ---
  it('renders the empty-row message when the query succeeds with an empty array', () => {
    renderWithMock({
      isLoading: false,
      isError: false,
      data: [],
      error: undefined,
      refetch: vi.fn(),
    });

    expect(screen.getByText(/No discovery jobs found\./i)).toBeInTheDocument();
    expect(screen.queryByTestId('job-row')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // --- Edge case: data undefined but not flagged as error/loading (defensive) ---
  it('falls back to an empty list without crashing when data is undefined and not loading/erroring', () => {
    renderWithMock({
      isLoading: false,
      isError: false,
      data: undefined,
      error: undefined,
      refetch: vi.fn(),
    });

    expect(screen.getByText(/No discovery jobs found\./i)).toBeInTheDocument();
  });
});