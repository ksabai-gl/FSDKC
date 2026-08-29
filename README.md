# Klearcom Monolithic Platform

AI-powered Voice, Telecom, IVR, and Toll-Free Number testing platform — monolithic reference implementation covering **Discovery** and **Connect** modules.

## Architecture (per Klearcom technical landscape)

| Layer | Technology |
|-------|------------|
| Backend | PHP 8.3+, Laravel 12 |
| Frontend | React 19.2, TypeScript, Vite |
| Relational DB | MariaDB 11 (AWS RDS pattern) |
| Document DB | MongoDB (Atlas pattern) |
| State | TanStack React Query + Zustand |
| Infra | Docker (EC2/CodeDeploy pattern), AWS S3-ready |
| CI | GitHub Actions |

Schema is applied via manual SQL init (`docker/mariadb/init.sql`) — matching Klearcom's manual migration practice.

## Quick Start (local — no Docker required)

**One command (frontend + backend):**
```bash
npm run install:all   # first time only
npm run dev
```

Or run separately:
```bash
cd dev-api && npm install && npm run dev    # API on :8080
cd frontend && npm install && npm run dev   # UI on :5173
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Dev API | http://localhost:8080/api |
| MongoDB health | http://localhost:8080/api/mongodb/status |

Copy `dev-api/.env.example` → `dev-api/.env` and set your Atlas credentials:

```
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxx.mongodb.net/
MONGODB_DB_NAME=multi_agent_app
```

Seed data: `npm run seed --prefix dev-api` (or `npm run seed:force --prefix dev-api` to re-seed).

Without `.env`, the API falls back to in-memory MongoDB.

### Full stack with Docker

**First time setup:**
```bash
# Copy environment template and set credentials
cp .env.docker.example .env

# Edit .env and set secure passwords for:
# - DB_PASSWORD
# - MYSQL_ROOT_PASSWORD

# Start the stack
docker compose up --build
```

**Environment variables:**
| Variable | Required | Description |
|----------|----------|-------------|
| `DB_PASSWORD` | Yes | MariaDB user password |
| `MYSQL_ROOT_PASSWORD` | Yes | MariaDB root password |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated list of allowed origins |
| `APP_ENV` | No | Environment (local/production) |
| `APP_DEBUG` | No | Debug mode (true/false) |

Uses Laravel 12 + MariaDB 11 + MongoDB 7 with seed data.

## API Endpoints

### Authentication
All endpoints except `/api/health`, `/api/mongodb/status`, and `/api/auth/login` require authentication.

**Login:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@klearcom.local", "password": "password"}'
```

Response:
```json
{
  "user": { "id": 1, "name": "Ops Admin", "email": "admin@klearcom.local" },
  "token": "1|abcdef...",
  "token_type": "Bearer"
}
```

**Use the token in subsequent requests:**
```bash
curl http://localhost:8080/api/dashboard/kpis \
  -H "Authorization: Bearer 1|abcdef..."
```

### Public Endpoints
- `GET /api/health` — Platform health check
- `GET /api/mongodb/status` — MongoDB connection status
- `POST /api/auth/login` — Authenticate and get token

### Protected Endpoints (require `Authorization: Bearer <token>`)

#### Auth Management
- `POST /api/auth/logout` — Revoke current token
- `GET /api/auth/user` — Get current user
- `GET /api/auth/tokens` — List user tokens
- `DELETE /api/auth/tokens/{id}` — Revoke specific token

#### Dashboard
- `GET /api/dashboard/kpis` — Platform KPIs

#### Discovery (IVR mapping)
- `GET /api/discovery/jobs`
- `POST /api/discovery/jobs`
- `GET /api/discovery/jobs/{id}`
- `GET /api/discovery/jobs/{id}/tree`
- `POST /api/discovery/jobs/{id}/start`

#### Connect (TFN monitoring)
- `GET /api/connect/monitors`
- `POST /api/connect/monitors`
- `GET /api/connect/monitors/{id}`
- `GET /api/connect/monitors/{id}/checks`
- `POST /api/connect/monitors/{id}/run-check`

## Modules

- **Discovery** — IVR traversal, DTMF recognition, call flow tree mapping
- **Connect** — Toll-free reachability, carrier route testing, geographic validation

Both modules include `AGENTS.md` files for AI-assisted development.

## Project Structure

```
mon/
├── backend/          # Laravel 12 API
│   └── app/Modules/  # Discovery, Connect
├── frontend/         # React 19 SPA
├── docker/           # MariaDB, MongoDB, PHP, Nginx
└── .github/workflows/
```
