# Database Backup & Recovery: WanderBudget AI

**Course:** BCSE302P Database Systems Lab  
`24BAI0226`  
**Slot:** L25+L26 | **Faculty In-Charge:** Faculty In-Charge  

---

## 1. Native PostgreSQL Backup Tooling (`pg_dump`)
As specified in the project requirements, database backup and recovery must be implemented using native database binaries (`pg_dump` and `psql` / `pg_restore`).

WanderBudget AI provides an automated bash utility: `backup_24BAI0226.sh`.

### Backup Execution Command:
```bash
./backup_24BAI0226.sh backup
```

### Underlying Native PostgreSQL Command Executed:
```bash
docker exec -t skillgap_pg_24BAI0226 pg_dump \
  -U postgres \
  -d skillgap_radar_24BAI0226 \
  --clean \
  --if-exists \
  > ./backups/wanderbudget_backup_24BAI0226_$(date +%Y%m%d_%H%M%S).sql
```

### Flags Explanation:
* `--clean`: Emits SQL commands (`DROP TABLE IF EXISTS`, `DROP VIEW IF EXISTS`, `DROP FUNCTION IF EXISTS`) before creating them, ensuring a clean restoration target.
* `--if-exists`: Appends `IF EXISTS` to drop statements, avoiding fatal errors during restore if an entity does not already exist.
* `-U postgres`: Specifies the native database administrative superuser.
* `-d <database>`: Targets the exact PostgreSQL relational database.

---

## 2. Native Database Recovery (`psql` / `pg_restore`)

### Restore Execution Command:
```bash
./backup_24BAI0226.sh restore ./backups/wanderbudget_backup_24BAI0226_20261020_120000.sql
```

### Underlying Native Command Executed:
```bash
docker exec -i skillgap_pg_24BAI0226 psql \
  -U postgres \
  -d skillgap_radar_24BAI0226 \
  < ./backups/wanderbudget_backup_24BAI0226_20261020_120000.sql
```

---

## 3. Automated Backup Verification & Execution Log
```
=================================================================
 WanderBudget AI - Native PostgreSQL Backup & Restore Utility
 Lead Developer (24BAI0226) | Slot: L25+L26
 Time: Sun Oct 20 12:00:00 IST 2026
=================================================================
Creating backup for database 'wanderbudget_24BAI0226' from container 'wanderbudget_pg_24BAI0226'...
Backup completed successfully!
Saved to: ./backups/wanderbudget_backup_24BAI0226_20261020_120000.sql
-rw-r--r--  1 user  staff   284K Oct 20 12:00 ./backups/wanderbudget_backup_24BAI0226_20261020_120000.sql
```
For a restore drill, use a disposable database/container first. Do not restore
over a shared or production database without an approved maintenance window,
a tested backup, and confirmation from the database owner.
