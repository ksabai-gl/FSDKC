# Discovery Module — AI Agent Guide

## Purpose
Automated IVR discovery and mapping. Documents call flows, detects undocumented IVR changes.

## Capabilities
- IVR traversal
- DTMF recognition
- Speech menu discovery
- Call transfer validation
- Multi-language transcription (stored in MongoDB)

## API Endpoints
- `GET /api/discovery/jobs` — List discovery jobs
- `POST /api/discovery/jobs` — Create new discovery job
- `GET /api/discovery/jobs/{id}` — Job detail with nodes
- `GET /api/discovery/jobs/{id}/tree` — IVR tree view
- `POST /api/discovery/jobs/{id}/start` — Start IVR traversal

## Data Stores
- **MariaDB**: `discovery_jobs`, `discovery_nodes`
- **MongoDB**: `transcripts` collection (module: `discovery`)

## Conventions
- Avoid `extract()` — use explicit variable assignment
- Business logic lives in controllers/services, not DB triggers
