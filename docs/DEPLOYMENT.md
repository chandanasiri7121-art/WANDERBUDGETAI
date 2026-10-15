# Deployment & Operations Guide: SkillGap Radar

**Student:** Garudaiahgari Sai Siri Chandana | **Register Number:** `24BAI0226`  
**Course:** BCSE302P Database Systems Lab | **Slot:** `L25+L26` | **Faculty:** Dr. V. SIVAKUMAR  

---

## 1. Prerequisites
- Docker & Docker Compose
- Node.js (v18+)
- PostgreSQL 16 Enterprise
- Git

---

## 2. Docker Compose Deployment
The application includes a root `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: skillgap_pg_24BAI0226
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password123
      POSTGRES_DB: skillgap_radar_24BAI0226
    ports:
      - "5432:5432"
    volumes:
      - skillgap_data_24BAI0226:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  skillgap_data_24BAI0226:
    name: skillgap_data_24BAI0226
```

Start the database container:
```bash
docker-compose up -d postgres
```

---

## 3. Local Development Setup

### Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
node prisma/seed_24BAI0226.js
node server_24BAI0226.js
```
The backend starts on `http://localhost:5001`.

### Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:5173`.

---

## 4. Native PostgreSQL Backup & Restoration
Execute the bundled backup script:
```bash
# Timestamped dump
./backup_24BAI0226.sh backup

# Restore
./backup_24BAI0226.sh restore ./backups/skillgap_backup_24BAI0226_YYYYMMDD_HHMMSS.sql
```
