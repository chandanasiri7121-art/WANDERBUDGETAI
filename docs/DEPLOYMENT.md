# Deployment & Operations Guide: WanderBudget AI

**Course:** BCSE302P Database Systems Lab  
`24BAI0226`  
**Slot:** L25+L26 | **Faculty In-Charge:** Faculty In-Charge  

---

## 1. Cloud Deployment Architecture

WanderBudget AI is engineered for seamless cloud hosting across modern free-tier developer platforms:
* **Frontend Web Application:** Vercel / Netlify (Production static build generated via `npm run build` with Vite)
* **Backend REST API:** Render / Railway / Koyeb (Dockerized Node.js 20 container)
* **Cloud Database:** Supabase PostgreSQL / Railway PostgreSQL (Managed PostgreSQL 16)

### Render configuration

Deploy the frontend as a Render Static Site using `frontend` as its root directory
and `npm run build` as its build command. Deploy the backend as a Render Docker Web
Service using the repository `backend/Dockerfile`. Render supplies `PORT`; the API
binds to `0.0.0.0` and exposes `GET /api/health` for health checks.

Configure backend secrets in Render's environment settings, never in source files:
`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `HUGGINGFACE_API_TOKEN`, and any
other enabled provider credentials. `HF_TOKEN` remains a local backwards-compatible
alias, but new Render deployments must use `HUGGINGFACE_API_TOKEN`. Set
`FRONTEND_ORIGINS` to the exact static-site HTTPS origin. Gemini configuration is
environment-managed in production; `/api/system/save-gemini-key` is disabled there.

---

## 2. Docker & Containerization (`docker-compose.yml`)

The repository includes a **local PostgreSQL development** Compose configuration:
```yaml
version: '3.8'

services:
  wanderbudget_postgres_24BAI0226:
    image: postgres:16-alpine
    container_name: wanderbudget_pg_24BAI0226
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-local-development-only}
      POSTGRES_DB: wanderbudget_24BAI0226
    ports:
      - "5432:5432"
    volumes:
      - pgdata_24BAI0226:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d wanderbudget_24BAI0226"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata_24BAI0226:
    name: pgdata_skillgap_24BAI0226
```

`backend/Dockerfile` builds only the API service. The frontend is a separate
static Vite build. Do not put `.env` files or database credentials in either
image; configure them using the hosting provider's secret store.

The Compose PostgreSQL service is for local development and CI-like testing,
not a managed-production database. Set a non-default `POSTGRES_PASSWORD` in
an untracked root `.env` before sharing the environment.

## 2.1 Database-object deployment procedure

Prisma manages the application tables. The stored function, three views, and
budget-alert trigger are defined in `backend/sql/wanderbudget_db_features_24BAI0226.sql` and must be applied explicitly after the Prisma schema.

1. Back up the target database and verify its host/database name with the deployment owner.
2. Use a **disposable or approved staging database first**. Never run this command against Supabase or production without separate approval.
3. Set `DATABASE_URL` only in the command environment, then run:

```bash
cd backend
npx prisma generate
npx prisma db push
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/wanderbudget_db_features_24BAI0226.sql
```

4. Verify objects before starting the application:

```sql
SELECT to_regprocedure('sp_calculate_trip_budget(integer,integer,character varying,integer)');
SELECT to_regclass('v_trip_budget_summary');
SELECT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_check_budget_overrun' AND NOT tgisinternal);
```

The SQL uses `CREATE OR REPLACE` for functions/views and recreates the named
trigger. It is repeatable, but it is still a schema-changing operation and
requires a backup plus explicit approval for a non-disposable database.

---

## 3. Custom Domain Configuration (Bonus +1 Mark)

To map a custom domain (e.g., `wanderbudget.duckdns.org` or `wanderbudget.dev`):
1. **DNS Record Setup**:
   * Type: `CNAME` or `A` record
   * Host / Name: `wanderbudget` (or `@`)
   * Value: Points to Vercel CNAME (`cname.vercel-dns.com`) or Railway deployment IP.
2. **SSL / TLS Encryption**:
   * Automatic provisioning of Let's Encrypt Wildcard TLS certificates via HTTP-01 challenge.
3. **Environment Sync**:
   * Set `VITE_API_BASE_URL` in the frontend environment pointing to the secure backend origin.
   * Set `FRONTEND_ORIGINS` in the backend environment to the exact comma-separated frontend HTTPS origins (for example `https://app.example.com`).

---

## 4. Continuous Integration & Continuous Delivery (CI/CD) (Bonus +1 Mark)

Configured via GitHub Actions in `.github/workflows/ci_cd_24BAI0226.yml`:
1. On each pull request and commit to `main` and `dev`:
   * Spins up an ephemeral PostgreSQL 16 service container.
   * Runs `prisma generate`, applies the Prisma schema, and validates the stored function, views, and trigger only in that isolated service.
   * Compiles the React production bundle (`npm run build`).
   * Runs all offline regression suites with `set -euo pipefail`; a failing test fails the workflow.

---

## 5. Local Execution Guide

To run the entire system locally:
```bash
# 1. Start PostgreSQL Database
docker-compose up -d

# 2. Push Database Schema & Seed Data
cd backend
npx prisma generate
npx prisma db push
node prisma/seed_wanderbudget_24BAI0226.js
cd ..

# 3. Launch Both Servers Simultaneously
chmod +x start_app_24BAI0226.sh
./start_app_24BAI0226.sh
```

Frontend is accessible at `http://localhost:5173`  
Backend API is accessible at `http://localhost:5001`
