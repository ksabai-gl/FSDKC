/**
 * MBA-49 — AC-D01 frontend Bearer header and SSE token query wiring.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAuthHeaders, getApiToken, getStreamUrl, setApiToken } from './client';

describe('buildAuthHeaders (MBA-49 / AC-D01)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('includes Bearer when session token is set', () => {
    setApiToken('session-token-abc');
    expect(buildAuthHeaders().Authorization).toBe('Bearer session-token-abc');
  });

  it('includes Bearer from VITE_API_TOKEN when session storage is empty', () => {
    vi.stubEnv('VITE_API_TOKEN', 'env-static-token');
    expect(buildAuthHeaders().Authorization).toBe('Bearer env-static-token');
  });

  it('prefers session token over VITE_API_TOKEN', () => {
    vi.stubEnv('VITE_API_TOKEN', 'env-static-token');
    setApiToken('session-wins');
    expect(buildAuthHeaders().Authorization).toBe('Bearer session-wins');
  });

  it('omits Authorization when no token is configured', () => {
    expect(buildAuthHeaders().Authorization).toBeUndefined();
    expect(buildAuthHeaders()).toMatchObject({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  });
});

describe('getApiToken (MBA-49 / AC-D01)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
  });

  it('returns empty string when no token sources exist', () => {
    expect(getApiToken()).toBe('');
  });
});

describe('getStreamUrl (MBA-49 / AC-D01)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubEnv('VITE_API_URL', 'http://localhost:8080/api');
  });

  it('appends access_token query param when token is present', () => {
    setApiToken('sse-token');
    const url = getStreamUrl('/discovery/jobs/1/stream');
    expect(url).toBe(
      'http://localhost:8080/api/discovery/jobs/1/stream?access_token=sse-token'
    );
  });

  it('returns path without access_token when token is absent', () => {
    const url = getStreamUrl('/connect/monitors/2/stream');
    expect(url).toBe('http://localhost:8080/api/connect/monitors/2/stream');
  });
});
