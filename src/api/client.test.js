import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', () => {
  const interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  };
  const instance = {
    interceptors,
    get: vi.fn(),
    post: vi.fn(),
  };
  return {
    default: {
      create: vi.fn(() => instance),
    },
  };
});

import axios from 'axios';
import client from './client';

describe('api client setup', () => {
  it('creates axios instance with withCredentials true (Sanctum SPA)', () => {
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ withCredentials: true })
    );
  });

  it('registers a request interceptor', () => {
    expect(client.interceptors.request.use).toHaveBeenCalled();
  });

  it('registers a response interceptor', () => {
    expect(client.interceptors.response.use).toHaveBeenCalled();
  });
});

describe('request interceptor', () => {
  let requestInterceptor;

  beforeEach(() => {
    requestInterceptor = client.interceptors.request.use.mock.calls[0][0];
    localStorage.clear();
  });

  it('attaches Authorization Bearer header when auth_token exists', () => {
    localStorage.setItem('auth_token', 'abc123');
    const config = { headers: {} };
    const result = requestInterceptor(config);
    expect(result.headers.Authorization).toBe('Bearer abc123');
  });

  it('does not attach Authorization header when no token is stored', () => {
    const config = { headers: {} };
    const result = requestInterceptor(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('returns the config object unmodified aside from headers', () => {
    const config = { headers: {}, url: '/api/dashboard/kpis' };
    const result = requestInterceptor(config);
    expect(result.url).toBe('/api/dashboard/kpis');
  });
});

describe('response interceptor', () => {
  let successHandler;
  let errorHandler;

  beforeEach(() => {
    const calls = client.interceptors.response.use.mock.calls[0];
    successHandler = calls[0];
    errorHandler = calls[1];
    delete window.location;
    window.location = { assign: vi.fn() };
    localStorage.clear();
  });

  it('passes through successful responses unchanged', () => {
    const response = { status: 200, data: { ok: true } };
    expect(successHandler(response)).toBe(response);
  });

  it('clears the token and redirects to /login on 401', async () => {
    localStorage.setItem('auth_token', 'stale-token');
    const error = { response: { status: 401 } };

    await expect(errorHandler(error)).rejects.toBe(error);

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(window.location.assign).toHaveBeenCalledWith('/login');
  });

  it('rejects without redirecting on non-401 errors', async () => {
    localStorage.setItem('auth_token', 'keep-me');
    const error = { response: { status: 500 } };

    await expect(errorHandler(error)).rejects.toBe(error);

    expect(localStorage.getItem('auth_token')).toBe('keep-me');
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it('rejects gracefully when the error has no response object (network error)', async () => {
    const error = { message: 'Network Error' };

    await expect(errorHandler(error)).rejects.toBe(error);

    expect(window.location.assign).not.toHaveBeenCalled();
  });
});
