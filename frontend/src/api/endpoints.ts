/**
 * Central registry of backend API paths.
 *
 * Keeps API paths out of components/hooks so renames happen in one place and
 * there is a single source of truth for the contract with the backend.
 */
export const endpoints = {
  dashboard: {
    kpis: '/dashboard/kpis',
  },
  mongodb: {
    status: '/mongodb/status',
    transcripts: (module: string, referenceId: number | string) =>
      `/mongodb/transcripts?module=${module}&reference_id=${referenceId}`,
  },
  discovery: {
    jobs: '/discovery/jobs',
    job: (id: number | string) => `/discovery/jobs/${id}`,
    tree: (id: number | string) => `/discovery/jobs/${id}/tree`,
    start: (id: number | string) => `/discovery/jobs/${id}/start`,
    stream: (id: number | string, sessionId: string) =>
      `/discovery/jobs/${id}/stream?session_id=${sessionId}`,
  },
  connect: {
    monitors: '/connect/monitors',
    monitor: (id: number | string) => `/connect/monitors/${id}`,
    checks: (id: number | string) => `/connect/monitors/${id}/checks`,
    runCheck: (id: number | string) => `/connect/monitors/${id}/run-check`,
    stream: (id: number | string, sessionId: string) =>
      `/connect/monitors/${id}/stream?session_id=${sessionId}`,
  },
} as const;
