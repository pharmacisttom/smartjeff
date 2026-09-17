#!/usr/bin/env bash
# ==============================================================================
# SmartJeff Platform Health Diagnostics Script
# Used for PM2 monitoring, Cron health validation, and deployment gates
# ==============================================================================
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "[DIAGNOSTICS] Probing SmartJeff Liveness (/api/health/live)..."
LIVENESS=$(curl -sf "${BASE_URL}/api/health/live" || echo "FAILED")
if [ "${LIVENESS}" == "FAILED" ]; then
  echo "[CRITICAL] Liveness probe FAILED! Process may be hung or crashed."
  exit 1
fi
echo "[OK] Liveness responsive: ${LIVENESS}"

echo "[DIAGNOSTICS] Probing SmartJeff Readiness (/api/health/ready)..."
READINESS=$(curl -sf "${BASE_URL}/api/health/ready" || echo "FAILED")
if [ "${READINESS}" == "FAILED" ]; then
  echo "[CRITICAL] Readiness probe FAILED! Critical dependencies unreachable."
  exit 1
fi
echo "[OK] Readiness passed: ${READINESS}"

echo "[DIAGNOSTICS] Checking App Version (/api/version)..."
curl -s "${BASE_URL}/api/version" || true
echo ""

echo "[SUCCESS] All platform health gates operational."
