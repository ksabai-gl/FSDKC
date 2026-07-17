function readApiBase(): string {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
}

const SESSION_TOKEN_KEY = 'klearcom_api_token';

export function getApiToken(): string {
  if (typeof sessionStorage !== 'undefined') {
    const stored = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (stored) {
      return stored;
    }
  }
  return import.meta.env.VITE_API_TOKEN ?? '';
}

export function setApiToken(token: string): void {
  if (typeof sessionStorage !== 'undefined') {
    if (token) {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }
}

export function getApiBase(): string {
  return readApiBase();
}

export function buildAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extra,
  };
  const token = getApiToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function authHeaders(): Record<string, string> {
  return buildAuthHeaders();
}

export function getStreamUrl(path: string): string {
  const base = readApiBase().replace(/\/api\/?$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const token = getApiToken();
  if (!token) {
    return `${base}/api${normalizedPath}`;
  }
  const separator = normalizedPath.includes('?') ? '&' : '?';
  return `${base}/api${normalizedPath}${separator}access_token=${encodeURIComponent(token)}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${readApiBase()}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options?.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface TokenResponse {
  token: string;
  token_type: string;
}

export async function fetchApiToken(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${readApiBase()}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }

  return res.json() as Promise<TokenResponse>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
};
