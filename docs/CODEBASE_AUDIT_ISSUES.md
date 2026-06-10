# Klearcom Codebase Audit Issues

Audit checklist for backend, frontend, security, and testing quality gates.  
**Status key:** `PRESENT` = already in codebase · `INTRODUCED` = added for audit exercise

---

## Backend

### 1. Business logic inside controllers (not in services)

| Status | File | Lines | Details |
|--------|------|-------|---------|
| PRESENT | `backend/app/Http/Controllers/Api/DashboardController.php` | 12–36 | KPI aggregation (IVR availability %, reachability averages, alert counts) computed directly in controller via Eloquent queries |
| PRESENT | `backend/app/Http/Controllers/Api/DiscoveryController.php` | 87–101 | `buildTree()` tree-building algorithm lives in controller |
| PRESENT | `backend/app/Http/Controllers/Api/ConnectController.php` | 57–84 | Reachability % and alert status calculated inline in `checks()` |
| INTRODUCED | `backend/app/Http/Controllers/Api/LegacyReportController.php` | 18–74 | Full carrier summary report: filtering, DB queries, success-rate math, and response mapping all in controller |
| PRESENT | `dev-api/src/server.js` | 58–80, 173–181 | Dashboard KPI logic and monitor check aggregation duplicated in Express route handlers (no service layer) |

**Expected fix:** Extract to `DashboardService`, `DiscoveryService`, `ConnectService`; controllers should only validate input and return responses.

---

### 2. Unsafe legacy `extract()` pattern

| Status | File | Lines | Details |
|--------|------|-------|---------|
| INTRODUCED | `backend/app/Legacy/LegacyDataMapper.php` | 12, 22 | `extract($row, EXTR_SKIP)` and `extract($context)` — variable scope pollution, hard to trace, security risk if user input keys collide |
| INTRODUCED | `backend/app/Http/Controllers/Api/LegacyReportController.php` | 21 | `extract($filters)` on raw `$request->all()` — request params injected as local variables |

**Note:** AGENTS.md says to avoid `extract()` but code still uses it in Legacy modules.

---

### 3. Missing Controller → Service → Repository pattern

| Status | File | Details |
|--------|------|---------|
| PRESENT | `backend/app/Http/Controllers/Api/*.php` | Controllers call Eloquent models directly (`DiscoveryJob::`, `ConnectMonitor::`) — no Repository layer |
| PRESENT | `backend/app/` | No `app/Repositories/` directory exists |
| PARTIAL | `backend/app/Services/` | `MongoService` and `RealTimeTestService` exist but are not used consistently; CRUD still bypasses services |

**Expected fix:** Add `DiscoveryJobRepository`, `ConnectMonitorRepository`; controllers → services → repositories → models.

---

### 4. Duplicate code blocks

| Status | Files | Details |
|--------|-------|---------|
| PRESENT | `DiscoveryController.php` L87–101 ↔ `LegacyReportController.php` L77–91 | Identical `buildTree()` recursive implementation copy-pasted |
| PRESENT | `ConnectController.php` L65–74 ↔ `RealTimeTestService.php` L117–125 ↔ `dev-api/src/realtime.js` L143–151 | Same reachability success-rate formula duplicated 3× |
| PRESENT | `DiscoveryController.php` L48–52 ↔ `ConnectController.php` L50–54 | Identical Mongo transcript + diagnostics fetch/response pattern |
| PRESENT | `dev-api/src/server.js` L58–79 ↔ `DashboardController.php` L12–36 | Dashboard KPI calculation duplicated between Node and Laravel |
| PRESENT | `dev-api/src/store.js` `buildTree()` ↔ `DiscoveryController.php` | Same tree builder in JS and PHP |
| PRESENT | `frontend/src/pages/DiscoveryPage.tsx` ↔ `ConnectPage.tsx` | Duplicated: form card layout, `handleStart`/`handleRunCheck` + query invalidation, transcripts panel, table row selection styling, loading empty states |

---

## Frontend

### 5. API integration and routing not centralized

| Status | File | Details |
|--------|------|---------|
| PRESENT | `frontend/src/pages/DiscoveryPage.tsx` | API paths hardcoded: `/discovery/jobs`, `/mongodb/transcripts?module=discovery&reference_id=` |
| PRESENT | `frontend/src/pages/ConnectPage.tsx` | Same pattern with `/connect/monitors`, `/connect/monitors/${id}/checks` |
| PRESENT | `frontend/src/hooks/useRealtimeTest.ts` | Stream paths built inline L29–31 |
| PRESENT | `frontend/src/App.tsx` | Routes defined inline; no `routes.ts` config |
| PRESENT | `frontend/src/api/client.ts` | Single generic client only — no module-specific API modules (`discoveryApi`, `connectApi`) |

**Expected fix:** `frontend/src/api/endpoints.ts`, `frontend/src/routes/index.tsx`, per-module API hooks.

---

### 6. Oversized components and duplicated logic

| Status | File | Lines | Details |
|--------|------|-------|---------|
| PRESENT | `frontend/src/pages/DiscoveryPage.tsx` | 176 | Form + live feed + jobs table + tree + transcripts in one component |
| PRESENT | `frontend/src/pages/ConnectPage.tsx` | 222 | Same monolithic structure as Discovery |
| INTRODUCED | `frontend/src/pages/LegacyDashboardWidget.tsx` | 68 | Fetches KPIs, jobs, and monitors in one widget; duplicates dashboard concerns |
| PRESENT | `frontend/src/pages/LegacyDashboardWidget.tsx` | 47 | `throw new Error(error)` — errors propagate uncaught |

---

### 7. Missing Error Boundaries

| Status | File | Details |
|--------|------|---------|
| PRESENT | `frontend/src/main.tsx` | No `<ErrorBoundary>` wrapping `<App />` |
| PRESENT | `frontend/src/App.tsx` | Route-level error boundaries absent |
| PRESENT | `frontend/src/pages/LegacyDashboardWidget.tsx` | L47 throws on fetch failure with no boundary to catch it |

**Expected fix:** Add `components/ErrorBoundary.tsx` and wrap routes in `App.tsx`.

---

### 8. Missing lifecycle cleanup

| Status | File | Details |
|--------|------|---------|
| INTRODUCED | `frontend/src/components/LegacyMonitorPoller.jsx` | L22–33 | `setInterval` in `componentDidMount` with **no** `componentWillUnmount` — memory leak on unmount |
| PARTIAL | `frontend/src/hooks/useRealtimeTest.ts` | L16–21 | EventSource cleanup exists in hook, but pages never call `reset()` on unmount |
| PRESENT | `frontend/src/pages/DiscoveryPage.tsx` | — | No `useEffect` cleanup when leaving page during active SSE stream |

---

## Security & Reliability

### 9. Vulnerabilities and hardening gaps

| Status | File | Details |
|--------|------|---------|
| PRESENT | `dev-api/src/server.js` | L17 | `cors()` with default — allows all origins (`*`) |
| PRESENT | `backend/config/cors.php` | L6 | `'allowed_origins' => ['*']` |
| PRESENT | Entire API surface | No authentication or authorization on any endpoint |
| INFO | `npm audit` (dev-api, frontend) | 0 critical/high at time of audit — dependency tree clean |

---

### 10. API validation gaps

| Status | File | Details |
|--------|------|---------|
| PRESENT | `dev-api/src/server.js` | L88–102 | `POST /api/discovery/jobs` — no schema validation; accepts missing/invalid fields |
| PRESENT | `dev-api/src/server.js` | L147–159 | `POST /api/connect/monitors` — no validation |
| INTRODUCED | `dev-api/src/server.js` | `POST /api/connect/monitors/bulk-import` | Accepts arbitrary JSON array; no field validation, size limits, or sanitization |
| PRESENT | `backend/app/Http/Controllers/Api/LegacyReportController.php` | L18–21 | `extract($request->all())` — unvalidated filter injection |
| PARTIAL | `backend/app/Http/Controllers/Api/DiscoveryController.php` | L28–33 | Laravel validation on `store()` only — other actions lack Form Request classes |

---

### 11. No rate limiting

| Status | File | Details |
|--------|------|---------|
| PRESENT | `dev-api/src/server.js` | No rate-limit middleware on any route |
| PRESENT | `backend/routes/api.php` | No `throttle` middleware applied |
| PRESENT | `backend/bootstrap/app.php` | No global rate limiter configured |

**Risk:** `POST .../start`, `POST .../run-check`, and `bulk-import` can be abused for DoS.

---

## Testing & Quality Gates

### 12. Tests not deterministic, isolated, or fast

| Status | File | Details |
|--------|------|---------|
| PRESENT | `backend/tests/Unit/HealthTest.php` | L9–14 | Asserts hardcoded array — does not test application code |
| INTRODUCED | `backend/tests/Unit/ReachabilityCalculationTest.php` | L10–16 | Uses `random_int()` — **non-deterministic**, may flake |
| PRESENT | All backend tests | No database mocking, no MongoDB isolation, no service-layer tests |

---

### 13. Missing business-critical logic coverage

| Status | Area | Details |
|--------|------|---------|
| MISSING | `RealTimeTestService` | No tests for IVR step simulation or reachability calculation |
| MISSING | `MongoService` | No tests for transcript/event storage |
| MISSING | `LegacyDataMapper` | No tests (extract behavior untested) |
| MISSING | `dev-api/src/realtime.js` | No tests for discovery/connect test runners |
| MISSING | KPI calculation | `DashboardController` math untested |

---

### 14. Frontend testing gaps

| Status | Details |
|--------|---------|
| MISSING | No `*.test.ts` / `*.test.tsx` files in `frontend/src/` |
| MISSING | No tests for `useRealtimeTest` hook (SSE connect/disconnect, progress) |
| MISSING | No tests for `uiStore` Zustand state |
| MISSING | No rendering tests for `DiscoveryPage`, `ConnectPage`, `LiveTestFeed` |
| MISSING | No error-handling tests for API failure paths |

---

## Quick reference — files to review first

```
backend/app/Legacy/LegacyDataMapper.php          ← extract()
backend/app/Http/Controllers/Api/LegacyReportController.php
backend/app/Http/Controllers/Api/DashboardController.php
backend/app/Http/Controllers/Api/ConnectController.php
backend/app/Http/Controllers/Api/DiscoveryController.php
dev-api/src/server.js
frontend/src/pages/DiscoveryPage.tsx
frontend/src/pages/ConnectPage.tsx
frontend/src/components/LegacyMonitorPoller.jsx
frontend/src/pages/LegacyDashboardWidget.tsx
backend/tests/Unit/HealthTest.php
backend/tests/Unit/ReachabilityCalculationTest.php
```

---

## Suggested remediation priority

1. **Critical:** Remove `extract()`, add API validation + rate limiting on dev-api
2. **High:** Extract business logic to services; add Error Boundaries
3. **High:** Add deterministic tests for reachability KPI and realtime services
4. **Medium:** Centralize frontend API/routes; split oversized page components
5. **Medium:** Deduplicate `buildTree()` and reachability calculation into shared utilities
