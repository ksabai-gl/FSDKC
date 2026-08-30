import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCreateDiscoveryJob } from './useCreateDiscoveryJob';
import * as discoveryJobApi from './discoveryJobApi';

jest.mock('./discoveryJobApi');

const mockedApi = discoveryJobApi as jest.Mocked<typeof discoveryJobApi>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useCreateDiscoveryJob', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a discovery job successfully', async () => {
    mockedApi.createDiscoveryJob.mockResolvedValueOnce({ id: 'job-1' } as any);

    const { result } = renderHook(() => useCreateDiscoveryJob(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ name: 'test-job' } as any);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);
    expect(mockedApi.createDiscoveryJob).toHaveBeenCalledTimes(1);
  });

  it('surfaces an error when the create request fails', async () => {
    mockedApi.createDiscoveryJob.mockRejectedValueOnce(new Error('network error'));

    const { result } = renderHook(() => useCreateDiscoveryJob(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ name: 'test-job' } as any);
      } catch {
        // expected rejection, assertions below verify surfaced error state
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('network error');
  });

  it('surfaces an error for validation failures from the API', async () => {
    mockedApi.createDiscoveryJob.mockRejectedValueOnce(new Error('invalid payload'));

    const { result } = renderHook(() => useCreateDiscoveryJob(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ name: '' } as any);
      } catch {
        // expected rejection, assertions below verify surfaced error state
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('invalid payload');
  });

  it('surfaces an error when the server times out', async () => {
    mockedApi.createDiscoveryJob.mockRejectedValueOnce(new Error('timeout'));

    const { result } = renderHook(() => useCreateDiscoveryJob(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ name: 'test-job' } as any);
      } catch {
        // expected rejection, assertions below verify surfaced error state
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('timeout');
  });

  it('surfaces an error when the server returns a 500', async () => {
    mockedApi.createDiscoveryJob.mockRejectedValueOnce(new Error('internal server error'));

    const { result } = renderHook(() => useCreateDiscoveryJob(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ name: 'test-job' } as any);
      } catch {
        // expected rejection, assertions below verify surfaced error state
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('internal server error');
    expect(mockedApi.createDiscoveryJob).toHaveBeenCalledTimes(1);
  });
});
