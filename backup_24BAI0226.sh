#!/bin/bash
# WanderBudget AI - Native PostgreSQL Backup & Recovery Script

set -e

CONTAINER_NAME="wanderbudget_pg_24BAI0226"
DB_NAME="wanderbudget_24BAI0226"
DB_USER="postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_FILE="${BACKUP_DIR}/wanderbudget_backup_${TIMESTAMP}.sql"

mkdir -p "${BACKUP_DIR}"

echo "================================================================="
echo " WanderBudget AI - Native PostgreSQL Backup & Restore Utility"
echo " Time: $(date)"
echo "================================================================="

case "$1" in
  backup)
    echo "Creating backup for database '${DB_NAME}' from container '${CONTAINER_NAME}'..."
    docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists > "${BACKUP_FILE}"
    echo "Backup completed successfully!"
    echo "Saved to: ${BACKUP_FILE}"
    ls -lh "${BACKUP_FILE}"
    ;;
  restore)
    if [ -z "$2" ]; then
      echo "Error: Please specify the SQL backup file path to restore."
      echo "Usage: ./backup_24BAI0226.sh restore <backup_file.sql>"
      exit 1
    fi
    RESTORE_FILE="$2"
    if [ ! -f "${RESTORE_FILE}" ]; then
      echo "Error: File '${RESTORE_FILE}' not found."
      exit 1
    fi
    echo "Restoring database '${DB_NAME}' from '${RESTORE_FILE}'..."
    docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" < "${RESTORE_FILE}"
    echo "Database restoration completed successfully!"
    ;;
  *)
    echo "Usage:"
    echo "  ./backup_24BAI0226.sh backup                  # Creates a timestamped .sql backup"
    echo "  ./backup_24BAI0226.sh restore <file.sql>      # Restores database from a .sql backup"
    exit 1
    ;;
esac
