import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import client from './client';
import { login, logout } from './auth';

describe('login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('requests the CSRF cookie before submitting credentials', async () => {
    client.get.mockResolvedValue({});
    client.post.mockResolvedValue({ data: { token: 'tok-1' } });

    await login('user@example.com', 'secret');

    expect(client.get).toHaveBeenCalledWith('/sanctum/csrf-cookie');
    expect(client.post).toHaveBeenCalledWith('/login', {
      email: 'user@example.com',
      password: 'secret',
    });
  });

  it('stores the returned token in localStorage', async () => {
    client.get.mockResolvedValue({});
    client.post.mockResolvedValue({ data: { token: 'tok-2' } });

    await login('user@example.com', 'secret');

    expect(localStorage.getItem('auth_token')).toBe('tok-2');
  });

  it('does not store a token when the response payload has none', async () => {
    client.get.mockResolvedValue({});
    client.post.mockResolvedValue({ data: {} });

    await login('user@example.com', 'secret');

    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('does not throw when response.data is undefined', async () => {
    client.get.mockResolvedValue({});
    client.post.mockResolvedValue({});

    await expect(login('user@example.com', 'secret')).resolves.toBeUndefined();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('returns the response data from the login call', async () => {
    client.get.mockResolvedValue({});
    const payload = { token: 'tok-3', user: { id: 1 } };
    client.post.mockResolvedValue({ data: payload });

    const result = await login('user@example.com', 'secret');

    expect(result).toEqual(payload);
  });

  it('propagates errors from the login request (e.g. invalid credentials)', async () => {
    client.get.mockResolvedValue({});
    const err = new Error('bad credentials');
    client.post.mockRejectedValue(err);

    await expect(login('user@example.com', 'wrong')).rejects.toThrow('bad credentials');
  });

  it('propagates errors from the CSRF cookie request', async () => {
    const err = new Error('csrf endpoint unreachable');
    client.get.mockRejectedValue(err);

    await expect(login('user@example.com', 'secret')).rejects.toThrow('csrf endpoint unreachable');
    expect(client.post).not.toHaveBeenCalled();
  });
});

describe('logout', () => {
  it('removes the auth_token from localStorage', () => {
    localStorage.setItem('auth_token', 'tok-1');
    logout();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('is a no-op and does not throw when no token is present', () => {
    localStorage.removeItem('auth_token');
    expect(() => logout()).not.toThrow();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});
