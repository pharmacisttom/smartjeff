#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
test -f .env || { echo 'Create a private .env from .env.production.example first'; exit 1; }
mode="${1:-pm2}"
case "$mode" in
  pm2)
    command -v pm2 >/dev/null
    npm ci
    npx prisma generate
    npm run lint
    npm run typecheck
    npm test
    npm run build
    npx prisma migrate deploy
    mkdir -p logs
    pm2 startOrReload ecosystem.config.js --env production --update-env
    pm2 save
    curl --fail --retry 10 --retry-delay 2 --retry-connrefused http://127.0.0.1:3000/api/ping
    ;;
  docker)
    docker compose -f docker-compose.prod.yml build app migrate
    docker compose -f docker-compose.prod.yml up -d --wait mysql redis
    docker compose -f docker-compose.prod.yml run --rm migrate
    docker compose -f docker-compose.prod.yml up -d --wait app nginx
    ;;
  *) echo 'Usage: scripts/deploy.sh [pm2|docker]'; exit 1 ;;
esac
echo 'Deployment commands completed. Verify HTTPS and authenticated workflows.'
