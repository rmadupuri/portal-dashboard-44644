# Contributing

Thanks for your interest in the cBioPortal Data Contribution Dashboard. This
document covers how to get the project running, what we expect in a pull
request, and where the tricky parts of the codebase are.

## Getting set up

You need **Node.js 18 or newer**, Docker (for local Keycloak), and access to a
Postgres database.

```bash
git clone https://github.com/cBioPortal/data-contribution-dashboard.git
cd data-contribution-dashboard
```

### 1. Keycloak

Authentication runs against Keycloak 11, which serves under the `/auth` context
path. `keycloak/docker-compose.yml` starts one on port 8081 with the `dashboard`
realm already configured:

```bash
docker compose -f keycloak/docker-compose.yml up -d
```

On first boot it imports `keycloak/realm-dashboard.json`, which contains:

- a public client `dashboard-frontend` (PKCE, redirect URIs for
  `http://localhost:8080/*` and the test server)
- the `super` realm role
- two test users: `curator` / `curator` (has `super`) and
  `contributor` / `contributor` (regular user)

The admin console is at http://localhost:8081/auth/admin (`admin` / `admin`;
override with `KEYCLOAK_ADMIN_USER` / `KEYCLOAK_ADMIN_PASSWORD`). Realm data is
kept in a Docker volume, so changes made in the console survive restarts. To
reset to the imported realm, run
`docker compose -f keycloak/docker-compose.yml down -v`.

Serving the app from a new host? Add `http://<host>/*` to the client's Valid
Redirect URIs, either in the console or in the realm file before first boot.
If you skip this, silent SSO cannot complete and the app will not load.

### 2. Backend

```bash
cd backend
cp .env.example .env     # then fill in your Postgres and Keycloak settings
npm install
npm run dev              # http://localhost:5001
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env     # point VITE_KEYCLOAK_URL at http://localhost:8081/auth
npm install
npm run dev              # http://localhost:8080
```

## Before you open a pull request

Run these locally — all three should pass:

```bash
cd backend  && npm test        # jest
cd frontend && npm run typecheck   # tsc --noEmit, must report zero errors
cd frontend && npm run lint        # eslint
```

Then:

- Keep the pull request focused on one change.
- Explain **why** in the description, not just what — the diff already says what.
- Add a test for any behaviour change in `backend/src/utils/`. Pure functions
  there are cheap to cover and are where the security-relevant rules live.
- Match the surrounding code. Comments in this codebase explain reasoning and
  non-obvious constraints rather than restating the line below them.

## How it fits together

```
frontend/  Vite + React + TypeScript SPA, AG Grid tables, Tailwind
backend/   Express API (ESM), Postgres via `pg`, ClickHouse for analytics
```

Both ship as Docker images built by `.github/workflows/docker_ci.yml` on every
push to `main`, tagged `latest-<component>` and `<short-sha>-<component>`.
Kubernetes manifests live in a separate repository,
`knowledgesystems/knowledgesystems-k8s-deployment`.

## Reporting bugs

Open an issue with what you expected, what happened, and the steps to reproduce.
Console output and the failing request's response body help a great deal.
