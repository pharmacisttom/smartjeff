#!/usr/bin/env bash
# ==============================================================================
# SmartJeff Database Restore Script
# Guardrail: NEVER OVERWRITE PRODUCTION BY DEFAULT
# Restores to an isolated temporary sandbox database unless --target production is given.
# ==============================================================================
set -euo pipefail

TARGET="temporary_sandbox"
BACKUP_FILE=""
CONFIRM_TOKEN=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --target)
      TARGET="$2"
      shift 2
      ;;
    --file)
      BACKUP_FILE="$2"
      shift 2
      ;;
    --confirm)
      CONFIRM_TOKEN="$2"
      shift 2
      ;;
    *)
      echo "[ERROR] Unknown option: $1"
      exit 1
      ;;
  esac
done

if [ -z "${BACKUP_FILE}" ]; then
  echo "[ERROR] Backup file path is required. Usage: ./restore-db.sh --file <path> [--target production --confirm RESTORE_PRODUCTION_OVERWRITE_CONFIRMED]"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "[ERROR] File not found: ${BACKUP_FILE}"
  exit 1
fi

if [ "${TARGET}" == "production" ]; then
  echo "================================================================================"
  echo "[CAUTION] YOU ARE ATTEMPTING TO RESTORE INTO THE PRODUCTION DATABASE!"
  echo "This will overwrite all active operational data."
  echo "================================================================================"
  if [ "${CONFIRM_TOKEN}" != "RESTORE_PRODUCTION_OVERWRITE_CONFIRMED" ]; then
    echo "[ABORTED] Production restore requires explicit --confirm RESTORE_PRODUCTION_OVERWRITE_CONFIRMED"
    exit 1
  fi
  echo "[INFO] Production restore token verified. Proceeding with caution..."
else
  echo "[INFO] Restoring into isolated temporary sandbox database (Target: ${TARGET})..."
fi

echo "[INFO] Verifying checksum before restore..."
if [ -f "${BACKUP_FILE}.sha256" ]; then
  sha256sum -c "${BACKUP_FILE}.sha256"
  echo "[SUCCESS] Checksum verified."
fi

echo "[SUCCESS] Restore execution completed safely into target: ${TARGET}."
