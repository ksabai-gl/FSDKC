// Pipeline run: 20260611T131110_0vf8xp — covers code-gen findings AC-C05/AC-C06 (poller cleanup, functional rewrite).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

const get = vi.fn();
vi.mock('../api/client', () => ({
  api: { get: (...args: unknown[]) => get(...args) },
}));

import LegacyMonitorPoller from './LegacyMonitorPoller';
import { endpoints } from '../api/endpoints';

describe('LegacyMonitorPoller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    get.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the loading state before the first response resolves', () => {
    get.mockReturnValue(new Promise(() => {})); // never resolves
    render(<LegacyMonitorPoller monitorId={1} />);
    expect(screen.getByText('Polling…')).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith(endpoints.connect.checks(1));
  });

  it('renders reachability and calls onUpdate after a successful poll', async () => {
    get.mockResolvedValue({ computed: { reachability_pct: 87 } });
    const onUpdate = vi.fn();

    render(<LegacyMonitorPoller monitorId={2} onUpdate={onUpdate} intervalMs={1000} />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Live: 87%')).toBeInTheDocument();
    expect(onUpdate).toHaveBeenCalledWith(87);
  });

  it('re-polls on each interval tick', async () => {
    get.mockResolvedValue({ computed: { reachability_pct: 90 } });
    render(<LegacyMonitorPoller monitorId={3} intervalMs={1000} />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(get).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(get).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(get).toHaveBeenCalledTimes(3);
  });

  it('shows an error state when the poll rejects', async () => {
    get.mockRejectedValue(new Error('network down'));
    render(<LegacyMonitorPoller monitorId={4} />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Poll error')).toBeInTheDocument();
  });

  it('clears the interval on unmount (no further polls)', async () => {
    get.mockResolvedValue({ computed: { reachability_pct: 100 } });
    const { unmount } = render(<LegacyMonitorPoller monitorId={5} intervalMs={1000} />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(get).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    // No additional calls after teardown.
    expect(get).toHaveBeenCalledTimes(1);
  });
});
