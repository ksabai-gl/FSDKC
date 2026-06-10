# Connect Module — AI Agent Guide

## Purpose
Toll-Free Number (TFN) monitoring and reachability validation across carriers and geographies.

## Capabilities
- Reachability validation
- Carrier route testing
- Geographic accessibility validation
- International calling verification

## API Endpoints
- `GET /api/connect/monitors` — List TFN monitors
- `POST /api/connect/monitors` — Create monitor
- `GET /api/connect/monitors/{id}` — Monitor detail
- `GET /api/connect/monitors/{id}/checks` — Check history
- `POST /api/connect/monitors/{id}/run-check` — Run reachability check

## Data Stores
- **MariaDB**: `connect_monitors`, `connect_check_results`
- **MongoDB**: `transcripts` collection (module: `connect`)

## KPIs
- Number Reachability %
- Carrier Failure Rate
- Regional Failure Rate
