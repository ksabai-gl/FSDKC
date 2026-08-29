import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateDiscoveryJobForm } from './CreateDiscoveryJobForm';

function renderForm(onClose = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(CreateDiscoveryJobForm, { onClose })
    )
  );
  return { onClose };
}

describe('CreateDiscoveryJobForm', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('BUG FIX: renders an inline error alert when the create request fails (SCRUM-90)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ message: 'Invalid target host' }),
    });

    renderForm();

    fireEvent.change(screen.getByLabelText(/job name/i), { target: { value: 'job1' } });
    fireEvent.change(screen.getByLabelText(/target/i), { target: { value: 'bad-host' } });
    fireEvent.click(screen.getByRole('button', { name: /create discovery job/i }));

    const alert = await screen.findByTestId('create-discovery-job-error');
    expect(alert).toHaveTextContent('Invalid target host');
  });

  it('REGRESSION: no error alert is shown before submit or after a successful submit', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: '1' }),
    });

    const { onClose } = renderForm();

    expect(screen.queryByTestId('create-discovery-job-error')).toBeNull();

    fireEvent.change(screen.getByLabelText(/job name/i), { target: { value: 'job1' } });
    fireEvent.change(screen.getByLabelText(/target/i), { target: { value: 'host' } });
    fireEvent.click(screen.getByRole('button', { name: /create discovery job/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId('create-discovery-job-error')).toBeNull();
  });

  it('EDGE CASE: submit and cancel buttons are disabled while the mutation is pending', async () => {
    let resolveFetch: (value: any) => void;
    (global.fetch as any).mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve; })
    );

    renderForm();

    fireEvent.change(screen.getByLabelText(/job name/i), { target: { value: 'job1' } });
    fireEvent.change(screen.getByLabelText(/target/i), { target: { value: 'host' } });
    fireEvent.click(screen.getByRole('button', { name: /create discovery job/i }));

    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

    resolveFetch!({ ok: true, status: 200, json: async () => ({ id: '1' }) });
    await waitFor(() => expect(screen.getByRole('button', { name: /create discovery job/i })).not.toBeDisabled());
  });

  it('EDGE CASE: a prior error message is cleared once a resubmit succeeds', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ message: 'first failure' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: '2' }) });

    renderForm();

    fireEvent.change(screen.getByLabelText(/job name/i), { target: { value: 'job1' } });
    fireEvent.change(screen.getByLabelText(/target/i), { target: { value: 'host' } });
    fireEvent.click(screen.getByRole('button', { name: /create discovery job/i }));

    await screen.findByTestId('create-discovery-job-error');

    fireEvent.click(screen.getByRole('button', { name: /create discovery job/i }));

    await waitFor(() => expect(screen.queryByTestId('create-discovery-job-error')).toBeNull());
  });
});
