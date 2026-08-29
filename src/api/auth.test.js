import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('src/api/auth.js - Sanctum cookie-session auth', () => {
  let axiosCreateSpy;
  let requestInterceptors;
  let responseInterceptors;
  let mockAxiosGet;

  beforeEach(() => {
    vi.resetModules();
    requestInterceptors = [];
    responseInterceptors = [];
    process.env.REACT_APP_API_URL = 'https://api.example.test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  async function loadModuleWithMockedAxios() {
    mockAxiosGet = vi.fn().mockResolvedValue({ data: 'ok' });

    const instanceInterceptors = {
      request: { use: (fn) => requestInterceptors.push(fn) },
      response: { use: (onFulfilled, onRejected) => responseInterceptors.push({ onFulfilled, onRejected }) },
    };

    const fakeInstance = { interceptors: instanceInterceptors };

    axiosCreateSpy = vi.fn().mockReturnValue(fakeInstance);

    vi.doMock('axios', () => ({
      default: {
        create: axiosCreateSpy,
        get: mockAxiosGet,
      },
    }));

    const mod = await import('./auth.js');
    return { mod, fakeInstance };
  }

  it('BUG FIX: creates the axios instance with withCredentials true and no Authorization/localStorage token logic attached to config', async () => {
    await loadModuleWithMockedAxios();

    expect(axiosCreateSpy).toHaveBeenCalledTimes(1);
    const createConfig = axiosCreateSpy.mock.calls[0][0];
    expect(createConfig.withCredentials).toBe(true);
    expect(createConfig.baseURL).toBe('https://api.example.test');
  });

  it('BUG FIX: does not register a request interceptor that attaches an Authorization Bearer header (removed localStorage token path)', async () => {
    await loadModuleWithMockedAxios();

    // The fixed auth.js must NOT register any request interceptor at all,
    // since the dual-credential (Bearer + cookie) logic was removed.
    expect(requestInterceptors.length).toBe(0);
  });

  it('REGRESSION: ignores any token present in localStorage - no Authorization header is attached even if a stale token exists', async () => {
    const originalLocalStorage = globalThis.localStorage;
    globalThis.localStorage = {
      getItem: vi.fn().mockReturnValue('stale-token-value'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    await loadModuleWithMockedAxios();

    // No request interceptor should exist to read/attach this stale token.
    expect(requestInterceptors.length).toBe(0);

    globalThis.localStorage = originalLocalStorage;
  });

  it('BUG FIX: ensureCsrfCookie() calls the sanctum csrf-cookie endpoint with withCredentials true', async () => {
    const { mod } = await loadModuleWithMockedAxios();

    expect(typeof mod.ensureCsrfCookie).toBe('function');

    await mod.ensureCsrfCookie();

    expect(mockAxiosGet).toHaveBeenCalledTimes(1);
    expect(mockAxiosGet).toHaveBeenCalledWith(
      'https://api.example.test/sanctum/csrf-cookie',
      expect.objectContaining({ withCredentials: true })
    );
  });

  it('REGRESSION: registers exactly one response interceptor for handling API responses', async () => {
    await loadModuleWithMockedAxios();

    expect(responseInterceptors.length).toBe(1);
  });

  it('BUG FIX: response interceptor rejects 401 errors with sessionExpired flag set to true (session expired handling)', async () => {
    await loadModuleWithMockedAxios();

    const { onRejected } = responseInterceptors[0];
    const error = { response: { status: 401 }, message: 'Unauthorized' };

    await expect(onRejected(error)).rejects.toMatchObject({
      sessionExpired: true,
      response: { status: 401 },
    });
  });

  it('EDGE CASE: response interceptor passes through successful responses unchanged', async () => {
    await loadModuleWithMockedAxios();

    const { onFulfilled } = responseInterceptors[0];
    const response = { status: 200, data: { ok: true } };

    expect(onFulfilled(response)).toBe(response);
  });

  it('EDGE CASE: response interceptor rejects non-401 errors without adding sessionExpired flag', async () => {
    await loadModuleWithMockedAxios();

    const { onRejected } = responseInterceptors[0];
    const error = { response: { status: 500 }, message: 'Server Error' };

    await expect(onRejected(error)).rejects.toEqual(error);
    await expect(onRejected(error)).rejects.not.toHaveProperty('sessionExpired');
  });

  it('EDGE CASE: response interceptor rejects network errors with no response object gracefully', async () => {
    await loadModuleWithMockedAxios();

    const { onRejected } = responseInterceptors[0];
    const error = { message: 'Network Error' };

    await expect(onRejected(error)).rejects.toEqual(error);
  });

  it('IMPACT: default export is the configured axios instance usable by API callers', async () => {
    const { mod, fakeInstance } = await loadModuleWithMockedAxios();

    expect(mod.default).toBe(fakeInstance);
  });
});
