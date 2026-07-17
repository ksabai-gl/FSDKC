import { useCallback, useEffect, useRef, useState } from 'react';
import { api, buildAuthHeaders, getApiBase } from '../api/client';
import type { TestEvent } from '../types';

interface StartResponse {
  session_id: string;
  message: string;
}

export function useRealtimeTest(module: 'discovery' | 'connect') {
  const [events, setEvents] = useState<TestEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const connectStream = useCallback(async (resourceId: number, sessionId: string) => {
    cleanup();
    setEvents([]);
    setIsRunning(true);
    setProgress(0);

    const path = module === 'discovery'
      ? `/discovery/jobs/${resourceId}/stream`
      : `/connect/monitors/${resourceId}/stream`;

    const controller = new AbortController();
    abortRef.current = controller;

    const headers = buildAuthHeaders({ Accept: 'text/event-stream' });

    try {
      const res = await fetch(`${getApiBase()}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ session_id: sessionId }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Stream failed: HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.split('\n').find((l) => l.startsWith('data: '));
          if (!line) continue;

          const doc = JSON.parse(line.slice(6)) as TestEvent;
          setEvents((prev) => [...prev, doc]);

          const evt = doc.event;
          if (evt?.progress != null) setProgress(evt.progress);

          if (evt?.type === 'complete') {
            setIsRunning(false);
            setProgress(100);
            cleanup();
            return;
          }
        }
      }

      setIsRunning(false);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setIsRunning(false);
      }
      cleanup();
    }
  }, [module, cleanup]);

  const startDiscovery = useCallback(async (jobId: number) => {
    const res = await api.post<StartResponse>(`/discovery/jobs/${jobId}/start`, {});
    await connectStream(jobId, res.session_id);
    return res;
  }, [connectStream]);

  const startConnectCheck = useCallback(async (monitorId: number) => {
    const res = await api.post<StartResponse>(`/connect/monitors/${monitorId}/run-check`, {});
    await connectStream(monitorId, res.session_id);
    return res;
  }, [connectStream]);

  const reset = useCallback(() => {
    cleanup();
    setEvents([]);
    setIsRunning(false);
    setProgress(0);
  }, [cleanup]);

  return {
    events,
    isRunning,
    progress,
    startDiscovery,
    startConnectCheck,
    reset,
  };
}
