#!/usr/bin/env bash
set -euo pipefail
umask 077
# MYSQL_DEFAULTS_FILE is a private MySQL option file containing connection credentials.
: "${MYSQL_DEFAULTS_FILE:?Set a private MySQL option file outside the repository}"
: "${MYSQL_DATABASE:?Set the database name}"
: "${BACKUP_DIR:?Set an encrypted backup destination outside the repository}"
test -f "$MYSQL_DEFAULTS_FILE"
mkdir -p "$BACKUP_DIR"
target="$BACKUP_DIR/smartjeff_$(date +%Y%m%d_%H%M%S).sql.gz"
mysqldump --defaults-extra-file="$MYSQL_DEFAULTS_FILE" --single-transaction --quick --routines --triggers "$MYSQL_DATABASE" | gzip > "$target.partial"
gzip -t "$target.partial"
mv "$target.partial" "$target"
echo 'Backup completed; verify recovery periodically. No automatic deletion is performed.'
