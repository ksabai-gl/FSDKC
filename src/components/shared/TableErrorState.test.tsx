import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableErrorState } from './TableErrorState';

describe('TableErrorState', () => {
  it('renders the label and an alert role', () => {
    render(
      <table>
        <tbody>
          <TableErrorState label="Failed to load discovery jobs" onRetry={() => {}} />
        </tbody>
      </table>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to load discovery jobs')).toBeInTheDocument();
  });

  it('renders optional detail text when provided', () => {
    render(
      <table>
        <tbody>
          <TableErrorState label="Failed" detail="Network timeout" onRetry={() => {}} />
        </tbody>
      </table>
    );
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
  });

  it('does not render detail when omitted', () => {
    render(
      <table>
        <tbody>
          <TableErrorState label="Failed" onRetry={() => {}} />
        </tbody>
      </table>
    );
    expect(screen.queryByText(/network/i)).not.toBeInTheDocument();
  });

  it('invokes onRetry when the Retry button is clicked', () => {
    const onRetry = vi.fn();
    render(
      <table>
        <tbody>
          <TableErrorState label="Failed" onRetry={onRetry} />
        </tbody>
      </table>
    );
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});