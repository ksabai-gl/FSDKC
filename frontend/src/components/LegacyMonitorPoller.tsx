import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { endpoints } from '../api/endpoints';

interface Props {
  monitorId: number;
  onUpdate?: (pct: number) => void;
  intervalMs?: number;
}

/**
 * Polls a monitor's reachability on an interval.
 *
 * Functional component with a cleared interval and a cancelled flag on unmount,
 * so it cannot leak timers or update state after teardown.
 */
export default function LegacyMonitorPoller({ monitorId, onUpdate, intervalMs = 3000 }: Props) {
  const [reachability, setReachability] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const poll = () => {
      api
        .get<{ computed?: { reachability_pct: number } }>(endpoints.connect.checks(monitorId))
        .then((res) => {
          if (cancelled) return;
          const pct = res.computed?.reachability_pct ?? null;
          setReachability(pct);
          setError(null);
          if (pct != null) onUpdate?.(pct);
        })
        .catch((err: Error) => {
          if (!cancelled) setError(err.message);
        });
    };

    poll();
    const intervalId = setInterval(poll, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [monitorId, intervalMs, onUpdate]);

  if (error) return <span className="mongo-status mongo-disconnected">Poll error</span>;
  if (reachability == null) return <span className="mongo-status mongo-loading">Polling…</span>;
  return <span className="mongo-status mongo-connected">Live: {reachability}%</span>;
}
