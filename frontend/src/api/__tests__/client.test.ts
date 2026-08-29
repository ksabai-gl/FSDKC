import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, getStreamUrl } from '../client';
import { server } from '../../../test/setup';
import { http, HttpResponse } from 'msw';

describe('API client', () => {
  describe('getStreamUrl', () => {
    const originalEnv = import.meta.env.VITE_API_URL;

    afterEach(() => {
      if (originalEnv) {
        vi.stubEnv('VITE_API_URL', originalEnv);
      }
    });

    it('constructs stream URL with leading slash', () => {
      const url = getStreamUrl('/discovery/jobs/1/stream');
      expect(url).toContain('/api/discovery/jobs/1/stream');
    });

    it('constructs stream URL without leading slash', () => {
      const url = getStreamUrl('connect/monitors/1/stream');
      expect(url).toContain('/api/connect/monitors/1/stream');
    });

    it('removes trailing /api from base URL', () => {
      const url = getStreamUrl('/test');
      expect(url).not.toMatch(/\/api\/api\//);
    });
  });

  describe('api.get', () => {
    it('makes GET request and returns JSON', async () => {
      server.use(
        http.get('*/api/test-endpoint', () => {
          return HttpResponse.json({ data: 'test-value' });
        })
      );

      const result = await api.get<{ data: string }>('/test-endpoint');
      expect(result.data).toBe('test-value');
    });

    it('throws error on non-ok response', async () => {
      server.use(
        http.get('*/api/test-endpoint', () => {
          return new HttpResponse('Not Found', { status: 404 });
        })
      );

      await expect(api.get('/test-endpoint')).rejects.toThrow('Not Found');
    });

    it('throws HTTP status error when body is empty', async () => {
      server.use(
        http.get('*/api/test-endpoint', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await expect(api.get('/test-endpoint')).rejects.toThrow('HTTP 500');
    });
  });

  describe('api.post', () => {
    it('makes POST request with JSON body', async () => {
      let receivedBody: unknown;

      server.use(
        http.post('*/api/test-endpoint', async ({ request }) => {
          receivedBody = await request.json();
          return HttpResponse.json({ success: true });
        })
      );

      const result = await api.post<{ success: boolean }>('/test-endpoint', {
        name: 'Test',
        value: 123,
      });

      expect(result.success).toBe(true);
      expect(receivedBody).toEqual({ name: 'Test', value: 123 });
    });

    it('throws error on validation failure', async () => {
      server.use(
        http.post('*/api/test-endpoint', () => {
          return HttpResponse.json(
            { errors: { name: ['Name is required'] } },
            { status: 422 }
          );
        })
      );

      await expect(
        api.post('/test-endpoint', {})
      ).rejects.toThrow();
    });

    it('sends correct Content-Type header', async () => {
      let contentType: string | null = null;

      server.use(
        http.post('*/api/test-endpoint', ({ request }) => {
          contentType = request.headers.get('Content-Type');
          return HttpResponse.json({ ok: true });
        })
      );

      await api.post('/test-endpoint', { data: 'test' });
      expect(contentType).toBe('application/json');
    });

    it('sends Accept header', async () => {
      let acceptHeader: string | null = null;

      server.use(
        http.post('*/api/test-endpoint', ({ request }) => {
          acceptHeader = request.headers.get('Accept');
          return HttpResponse.json({ ok: true });
        })
      );

      await api.post('/test-endpoint', {});
      expect(acceptHeader).toBe('application/json');
    });
  });

  describe('error handling', () => {
    it('preserves error message from response body', async () => {
      server.use(
        http.get('*/api/test-endpoint', () => {
          return new HttpResponse('Custom error message', { status: 400 });
        })
      );

      await expect(api.get('/test-endpoint')).rejects.toThrow('Custom error message');
    });

    it('handles network errors', async () => {
      server.use(
        http.get('*/api/test-endpoint', () => {
          return HttpResponse.error();
        })
      );

      await expect(api.get('/test-endpoint')).rejects.toThrow();
    });
  });
});
