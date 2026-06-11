// Pipeline run: 20260611T131110_0vf8xp — covers code-gen finding AC-C01 (endpoint registry).
import { describe, it, expect } from 'vitest';
import { endpoints } from './endpoints';

describe('endpoints registry', () => {
  it('exposes static dashboard + mongodb paths', () => {
    expect(endpoints.dashboard.kpis).toBe('/dashboard/kpis');
    expect(endpoints.mongodb.status).toBe('/mongodb/status');
  });

  it('builds mongodb transcript query strings', () => {
    expect(endpoints.mongodb.transcripts('discovery', 42)).toBe(
      '/mongodb/transcripts?module=discovery&reference_id=42'
    );
  });

  it('builds discovery resource paths from ids', () => {
    expect(endpoints.discovery.jobs).toBe('/discovery/jobs');
    expect(endpoints.discovery.job(7)).toBe('/discovery/jobs/7');
    expect(endpoints.discovery.tree(7)).toBe('/discovery/jobs/7/tree');
    expect(endpoints.discovery.start(7)).toBe('/discovery/jobs/7/start');
    expect(endpoints.discovery.stream(7, 'sess-1')).toBe(
      '/discovery/jobs/7/stream?session_id=sess-1'
    );
  });

  it('builds connect resource paths from ids', () => {
    expect(endpoints.connect.monitors).toBe('/connect/monitors');
    expect(endpoints.connect.monitor(3)).toBe('/connect/monitors/3');
    expect(endpoints.connect.checks(3)).toBe('/connect/monitors/3/checks');
    expect(endpoints.connect.runCheck(3)).toBe('/connect/monitors/3/run-check');
    expect(endpoints.connect.stream(3, 'sess-9')).toBe(
      '/connect/monitors/3/stream?session_id=sess-9'
    );
  });

  it('accepts string ids as well as numbers', () => {
    expect(endpoints.connect.monitor('abc')).toBe('/connect/monitors/abc');
  });
});
