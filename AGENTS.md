# Klearcom Monolith — AI Agent Guide

## Platform
Voice observability + telecom QA platform. This monolith implements two product modules:

1. **Discovery** — IVR discovery, DTMF recognition, call flow mapping
2. **Connect** — Toll-free number monitoring, carrier reachability

## Stack
- Backend: Laravel 12, PHP 8.3+ (`backend/`)
- Frontend: React 19.2, TanStack Query, Zustand (`frontend/`)
- MariaDB 11 + MongoDB (transcripts/diagnostics)

## Module AGENTS.md
- `backend/app/Modules/Discovery/AGENTS.md`
- `backend/app/Modules/Connect/AGENTS.md`
- `frontend/src/modules/Discovery/AGENTS.md`
- `frontend/src/modules/Connect/AGENTS.md`

## Conventions
- No `extract()` in PHP — use explicit destructuring
- Functional React components only (no class components)
- Schema via manual SQL (`docker/mariadb/init.sql`), not Laravel migrations
