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

---

## 2. Docker & Containerization (`docker-compose.yml`)

The platform includes a production-grade Docker configuration:
```yaml
version: '3.8'

services:
  skillgap_postgres_24BAI0226:
    image: postgres:16-alpine
    container_name: skillgap_pg_24BAI0226
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
      POSTGRES_DB: skillgap_radar_24BAI0226
    ports:
      - "5432:5432"
    volumes:
      - pgdata_24BAI0226:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d skillgap_radar_24BAI0226"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata_24BAI0226:
    name: pgdata_skillgap_24BAI0226
```

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

---

## 4. Continuous Integration & Continuous Delivery (CI/CD) (Bonus +1 Mark)

Configured via GitHub Actions in `.github/workflows/ci_cd_24BAI0226.yml`:
1. On each pull request and commit to `main` and `dev`:
   * Spins up an ephemeral PostgreSQL 16 service container.
   * Runs `prisma generate` and validates schema synchronicity.
   * Compiles the React production bundle (`npm run build`).
   * Validates zero lint or type regression before merging.

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
