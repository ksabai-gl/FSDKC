---
agent: test-generation-reactphp
cli: Cursor Agent CLI
llm: claude-4.5-opus-high
run_id: 20260611T171838_hlqk4c
generated_at: 2026-06-11T11:48:38.662Z
---

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const ENDPOINTS = {
  HEALTH: '/api/health',
  MONGODB_STATUS: '/api/mongodb/status',
  DASHBOARD_KPIS: '/api/dashboard/kpis',
  DISCOVERY_JOBS: '/api/discovery/jobs',
  CONNECT_MONITORS: '/api/connect/monitors',
  LEGACY_CARRIERS: '/api/legacy/reports/carriers',
} as const;

export const QUERY_KEYS = {
  DASHBOARD: ['dashboard', 'kpis'],
  DISCOVERY_JOBS: ['discovery', 'jobs'],
  CONNECT_MONITORS: ['connect', 'monitors'],
  MONGODB_STATUS: ['mongodb', 'status'],
} as const;

export const mockKpis = {
  availability: {
    ivr_availability_pct: 85.5,
    number_reachability_pct: 92.3,
    call_success_rate_pct: 94.2,
    transfer_success_rate_pct: 97.8,
  },
  operational: {
    active_discovery_jobs: 3,
    active_connect_monitors: 12,
    open_alerts: 2,
    countries_monitored: 8,
  },
  modules: ['discovery', 'connect'],
};

export const mockDiscoveryJobs = [
  {
    id: 1,
    name: 'Bank IVR - US',
    phone_number: '+18005551234',
    country_code: 'US',
    status: 'completed',
    menu_depth: 3,
    nodes_discovered: 12,
    languages: ['en'],
    started_at: '2026-06-10T10:00:00Z',
    completed_at: '2026-06-10T10:05:00Z',
  },
  {
    id: 2,
    name: 'Telecom IVR - UK',
    phone_number: '+448005556789',
    country_code: 'UK',
    status: 'pending',
    menu_depth: 0,
    nodes_discovered: 0,
    languages: ['en'],
    started_at: null,
    completed_at: null,
  },
];

export const mockConnectMonitors = [
  {
    id: 1,
    name: 'US Sales TFN',
    toll_free_number: '18005559999',
    country_code: 'US',
    carrier: 'Verizon',
    status: 'active',
    reachability_pct: 99.5,
    last_checked_at: '2026-06-11T09:00:00Z',
  },
  {
    id: 2,
    name: 'India Support',
    toll_free_number: '180018001800',
    country_code: 'IN',
    carrier: 'Airtel',
    status: 'alert',
    reachability_pct: 72.5,
    last_checked_at: '2026-06-11T08:30:00Z',
  },
];

export const mockMongoHealth = {
  connected: true,
  mode: 'standalone',
  database: 'klearcom',
  collections: {
    transcripts: 150,
    test_events: 2340,
    diagnostics: 89,
  },
};

export const handlers = [
  http.get('*/api/health', () => {
    return HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  }),

  http.get('*/api/mongodb/status', () => {
    return HttpResponse.json(mockMongoHealth);
  }),

  http.get('*/api/dashboard/kpis', () => {
    return HttpResponse.json(mockKpis);
  }),

  http.get('*/api/discovery/jobs', () => {
    return HttpResponse.json({ data: mockDiscoveryJobs });
  }),

  http.get('*/api/discovery/jobs/:id/tree', ({ params }) => {
    const id = Number(params.id);
    return HttpResponse.json({
      job_id: id,
      job_name: 'Bank IVR',
      tree: [
        {
          id: 1,
          prompt_text: 'Welcome. Press 1 for accounts.',
          dtmf_option: null,
          node_type: 'root',
          depth: 0,
          children: [
            {
              id: 2,
              prompt_text: 'For checking, press 1.',
              dtmf_option: '1',
              node_type: 'menu',
              depth: 1,
              children: [],
            },
          ],
        },
      ],
    });
  }),

  http.post('*/api/discovery/jobs/:id/start', ({ params }) => {
    const id = Number(params.id);
    return HttpResponse.json({
      session_id: 'test-session-' + id,
      message: 'Discovery test started',
    });
  }),

  http.get('*/api/connect/monitors', () => {
    return HttpResponse.json({ data: mockConnectMonitors });
  }),

  http.get('*/api/connect/monitors/:id/checks', ({ params }) => {
    return HttpResponse.json({
      monitor: mockConnectMonitors[0],
      data: [
        {
          id: 1,
          reachable: true,
          latency_ms: 230,
          carrier_route: 'US -> Verizon SIP',
          failure_reason: null,
          checked_at: '2026-06-11T09:00:00Z',
        },
      ],
      computed: { reachability_pct: 99.5, status: 'active' },
    });
  }),

  http.post('*/api/connect/monitors/:id/run-check', ({ params }) => {
    const id = Number(params.id);
    return HttpResponse.json({
      session_id: 'connect-session-' + id,
      message: 'Connect test started',
    });
  }),
];

export const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => {
  server.close();
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
