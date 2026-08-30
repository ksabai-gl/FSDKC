import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CreateDiscoveryJobForm } from './CreateDiscoveryJobForm';
import type { DiscoveryJobFormValues } from './types';

describe('CreateDiscoveryJobForm', () => {
  const mockOnSubmit: jest.MockedFunction<
    (values: DiscoveryJobFormValues) => Promise<void>
  > = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockReset();
  });

  it('renders the form fields', () => {
    render(<CreateDiscoveryJobForm onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText(/job name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('submits the form with valid values', async () => {
    mockOnSubmit.mockResolvedValueOnce();
    render(<CreateDiscoveryJobForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText(/job name/i), {
      target: { value: 'Job A' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() =>
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Job A' })
      )
    );
  });

  it('shows a validation error when the job name is empty', async () => {
    render(<CreateDiscoveryJobForm onSubmit={mockOnSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    expect(await screen.findByText(/job name is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows a validation error when the job name is whitespace only', async () => {
    render(<CreateDiscoveryJobForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText(/job name/i), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    expect(await screen.findByText(/job name is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows an error message when submission fails', async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error('Network error'));
    render(<CreateDiscoveryJobForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText(/job name/i), {
      target: { value: 'Job A' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/network error/i);
  });

  it('shows a generic error message when a non-Error rejection reason is thrown', async () => {
    mockOnSubmit.mockRejectedValueOnce('unexpected failure');
    render(<CreateDiscoveryJobForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText(/job name/i), {
      target: { value: 'Job A' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('clears a previous submission error on retry success', async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error('Network error'));
    mockOnSubmit.mockResolvedValueOnce();

    render(<CreateDiscoveryJobForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText(/job name/i), {
      target: { value: 'Job A' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/network error/i);

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await screen.findByText(/job created/i).catch(() => undefined);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('disables the submit button while the request is pending to prevent double submit', async () => {
    let resolveFn: () => void;
    mockOnSubmit.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveFn = resolve;
        })
    );

    render(<CreateDiscoveryJobForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText(/job name/i), {
      target: { value: 'Job A' },
    });
    const button = screen.getByRole('button', { name: /create/i });
    fireEvent.click(button);

    expect(button).toBeDisabled();

    resolveFn!();
    await waitFor(() => expect(button).not.toBeDisabled());
  });
});
