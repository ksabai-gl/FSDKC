import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRealtimeTest } from '../useRealtimeTest';
import { server } from '../../../test/setup';
import { http, HttpResponse } from 'msw';

class MockEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 0;
  url: string;
  private closed = false;

  static instances: MockEventSource[] = [];

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
    this.readyState = 1;
  }

  close() {
    this.closed = true;
    this.readyState = 2;
  }

  simulateMessage(data: unknown) {
    if (this.onmessage && !this.closed) {
      this.onmessage({ data: JSON.stringify(data) } as MessageEvent);
    }
  }

  simulateError() {
    if (this.onerror && !this.closed) {
      this.onerror();
    }
  }

  static clear() {
    MockEventSource.instances = [];
  }
}

describe('useRealtimeTest hook', () => {
  beforeEach(() => {
    MockEventSource.clear();
    vi.stubGlobal('EventSource', MockEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('initial state', () => {
    it('starts with empty events', () => {
      const { result } = renderHook(() => useRealtimeTest('discovery'));
      expect(result.current.events).toEqual([]);
    });

    it('starts with isRunning false', () => {
      const { result } = renderHook(() => useRealtimeTest('discovery'));
      expect(result.current.isRunning).toBe(false);
    });

    it('starts with progress 0', () => {
      const { result } = renderHook(() => useRealtimeTest('discovery'));
      expect(result.current.progress).toBe(0);
    });
  });

  describe('startDiscovery', () => {
    it('calls the start endpoint and creates EventSource', async () => {
      server.use(
        http.post('*/api/discovery/jobs/1/start', () => {
          return HttpResponse.json({ session_id: 'sess-123', message: 'Started' });
        })
      );

      const { result } = renderHook(() => useRealtimeTest('discovery'));

      await act(async () => {
        await result.current.startDiscovery(1);
      });

      expect(result.current.isRunning).toBe(true);
      expect(MockEventSource.instances.length).toBe(1);
      expect(MockEventSource.instances[0].url).toContain('/discovery/jobs/1/stream');
      expect(MockEventSource.instances[0].url).toContain('session_id=sess-123');
    });

    it('accumulates events from EventSource messages', async () => {
      server.use(
        http.post('*/api/discovery/jobs/1/start', () => {
          return HttpResponse.json({ session_id: 'sess-123', message: 'Started' });
        })
      );

      const { result } = renderHook(() => useRealtimeTest('discovery'));

      await act(async () => {
        await result.current.startDiscovery(1);
      });

      const source = MockEventSource.instances[0];

      act(() => {
        source.simulateMessage({
          _id: 'evt1',
          event: { type: 'step', message: 'Call initiated', progress: 10 },
        });
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0].event?.message).toBe('Call initiated');
      expect(result.current.progress).toBe(10);
    });

    it('updates progress from event payload', async () => {
      server.use(
        http.post('*/api/discovery/jobs/1/start', () => {
          return HttpResponse.json({ session_id: 'sess-123', message: 'Started' });
        })
      );

      const { result } = renderHook(() => useRealtimeTest('discovery'));

      await act(async () => {
        await result.current.startDiscovery(1);
      });

      const source = MockEventSource.instances[0];

      act(() => {
        source.simulateMessage({ event: { progress: 50 } });
      });

      expect(result.current.progress).toBe(50);
    });

    it('sets isRunning false and progress 100 on complete event', async () => {
      server.use(
        http.post('*/api/discovery/jobs/1/start', () => {
          return HttpResponse.json({ session_id: 'sess-123', message: 'Started' });
        })
      );

      const { result } = renderHook(() => useRealtimeTest('discovery'));

      await act(async () => {
        await result.current.startDiscovery(1);
      });

      const source = MockEventSource.instances[0];

      act(() => {
        source.simulateMessage({ event: { type: 'complete', progress: 100 } });
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.progress).toBe(100);
    });
  });

  describe('startConnectCheck', () => {
    it('calls the connect run-check endpoint', async () => {
      server.use(
        http.post('*/api/connect/monitors/5/run-check', () => {
          return HttpResponse.json({ session_id: 'connect-sess', message: 'Started' });
        })
      );

      const { result } = renderHook(() => useRealtimeTest('connect'));

      await act(async () => {
        await result.current.startConnectCheck(5);
      });

      expect(MockEventSource.instances[0].url).toContain('/connect/monitors/5/stream');
    });
  });

  describe('error handling', () => {
    it('sets isRunning false on EventSource error', async () => {
      server.use(
        http.post('*/api/discovery/jobs/1/start', () => {
          return HttpResponse.json({ session_id: 'sess-123', message: 'Started' });
        })
      );

      const { result } = renderHook(() => useRealtimeTest('discovery'));

      await act(async () => {
        await result.current.startDiscovery(1);
      });

      expect(result.current.isRunning).toBe(true);

      const source = MockEventSource.instances[0];
      act(() => {
        source.simulateError();
      });

      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears events and state', async () => {
      server.use(
        http.post('*/api/discovery/jobs/1/start', () => {
          return HttpResponse.json({ session_id: 'sess-123', message: 'Started' });
        })
      );

      const { result } = renderHook(() => useRealtimeTest('discovery'));

      await act(async () => {
        await result.current.startDiscovery(1);
      });

      const source = MockEventSource.instances[0];
      act(() => {
        source.simulateMessage({ event: { progress: 50 } });
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.progress).toBe(50);

      act(() => {
        result.current.reset();
      });

      expect(result.current.events).toEqual([]);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.progress).toBe(0);
    });
  });

  describe('cleanup on unmount', () => {
    it('closes EventSource when component unmounts', async () => {
      server.use(
        http.post('*/api/discovery/jobs/1/start', () => {
          return HttpResponse.json({ session_id: 'sess-123', message: 'Started' });
        })
      );

      const { result, unmount } = renderHook(() => useRealtimeTest('discovery'));

      await act(async () => {
        await result.current.startDiscovery(1);
      });

      const source = MockEventSource.instances[0];
      expect(source.readyState).toBe(1);

      unmount();

      expect(source.readyState).toBe(2);
    });
  });
});
