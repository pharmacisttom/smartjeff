#!/bin/bash
# ============================================================
# SmartJeff Enterprise — Automated MySQL Daily Backup Script
# Place in /etc/cron.daily or crontab:
# 0 4 * * * /var/www/smartjeff/scripts/backup-db.sh > /dev/null 2>&1
# ============================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-/var/backups/smartjeff}"
DATE=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

echo "📦 Starting SmartJeff MySQL Backup on $DATE..."

# Check if running in Docker or host
if docker ps --format '{{.Names}}' | grep -q "smartjeff-mysql"; then
  echo "Using Docker container: smartjeff-mysql"
  docker exec smartjeff-mysql mysqldump -u root -p"${MYSQL_ROOT_PASSWORD:-SmartJeffRootPass2026!}" \
    --single-transaction --quick --lock-tables=false smartjeff | gzip > "$BACKUP_DIR/smartjeff_backup_${DATE}.sql.gz"
else
  echo "Using host mysqldump"
  mysqldump -u smartjeff -p"${MYSQL_PASSWORD}" --single-transaction --quick --lock-tables=false smartjeff | gzip > "$BACKUP_DIR/smartjeff_backup_${DATE}.sql.gz"
fi

BACKUP_SIZE=$(du -h "$BACKUP_DIR/smartjeff_backup_${DATE}.sql.gz" | cut -f1)
echo "✅ Backup completed: $BACKUP_DIR/smartjeff_backup_${DATE}.sql.gz (Size: $BACKUP_SIZE)"

# Cleanup backups older than RETENTION_DAYS
echo "🧹 Cleaning up archives older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "smartjeff_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "🎉 Backup maintenance completed successfully!"
