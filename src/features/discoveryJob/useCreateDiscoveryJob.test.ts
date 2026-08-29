import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateDiscoveryJob } from './useCreateDiscoveryJob';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
  return { Wrapper, queryClient, invalidateSpy };
}

describe('useCreateDiscoveryJob', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('BUG FIX: surfaces a user-visible error message when the create request fails (SCRUM-90)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Target is required' }),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateDiscoveryJob(), { wrapper: Wrapper });

    act(() => {
      result.current.submit({ name: 'job1', target: '' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.submitError).toBe('Target is required');
  });

  it('EDGE CASE: falls back to a generic message when the failed response body is not JSON', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json');
      },
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateDiscoveryJob(), { wrapper: Wrapper });

    act(() => {
      result.current.submit({ name: 'job1', target: 'host' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.submitError).toBe('Failed to create discovery job (status 500)');
  });

  it('EDGE CASE: falls back to generic message when thrown value is not an Error instance', async () => {
    (global.fetch as any).mockImplementation(() => {
      // simulate a thrown non-Error (e.g. network layer rejecting with a plain string)
      return Promise.reject('network down');
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateDiscoveryJob(), { wrapper: Wrapper });

    act(() => {
      result.current.submit({ name: 'job1', target: 'host' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.submitError).toBe('Failed to create discovery job. Please try again.');
  });

  it('REGRESSION: successful create still invalidates the discoveryJobs query and calls onSuccess', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: '123' }),
    });

    const { Wrapper, invalidateSpy } = createWrapper();
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCreateDiscoveryJob(onSuccess), { wrapper: Wrapper });

    act(() => {
      result.current.submit({ name: 'job1', target: 'host' });
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['discoveryJobs'] });
    expect(result.current.isError).toBe(false);
    expect(result.current.submitError).toBeNull();
  });

  it('REGRESSION: submitError resets to null when a new submit attempt is made after a prior failure', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'first failure' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: '456' }),
      });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateDiscoveryJob(), { wrapper: Wrapper });

    act(() => {
      result.current.submit({ name: 'job1', target: '' });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.submitError).toBe('first failure');

    act(() => {
      result.current.submit({ name: 'job1', target: 'host' });
    });

    // error state is cleared immediately on new submit (before response resolves)
    expect(result.current.submitError).toBeNull();

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.isError).toBe(false);
    expect(result.current.submitError).toBeNull();
  });
});
