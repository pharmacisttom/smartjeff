#!/bin/bash
# ============================================================
# SmartJeff Enterprise — VPS 1-Click Deployment & Update Script
# Usage: ./scripts/deploy.sh [docker | pm2]
# ============================================================

set -e

DEPLOY_MODE=${1:-docker}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=========================================================="
echo "🚀 Starting SmartJeff Production Deployment on VPS..."
echo "Mode: $DEPLOY_MODE | Directory: $PROJECT_DIR"
echo "=========================================================="

cd "$PROJECT_DIR"

# 1. Check for .env file
if [ ! -f .env ]; then
  echo "⚠️ .env file not found! Copying from .env.production.example..."
  cp .env.production.example .env
  echo "❗ Please edit .env with your real production secrets before running again!"
  exit 1
fi

if [ "$DEPLOY_MODE" = "docker" ]; then
  echo "🐳 Deploying with Docker Compose..."
  
  # Ensure Docker and Compose are installed
  if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first: curl -fsSL https://get.docker.com | sh"
    exit 1
  fi

  # Pull latest images and rebuild
  docker compose -f docker-compose.prod.yml down --remove-orphans || true
  docker compose -f docker-compose.prod.yml build --no-cache
  docker compose -f docker-compose.prod.yml up -d

  echo "⏳ Waiting for MySQL to be healthy..."
  sleep 15

  # Run database migrations and seeds inside container
  echo "📦 Running Prisma migrations inside container..."
  docker compose -f docker-compose.prod.yml exec -T app npx prisma db push --skip-generate
  echo "🌱 Seeding 152 employees, 36 sites, and J2K roles..."
  docker compose -f docker-compose.prod.yml exec -T app npx tsx prisma/seed.ts || true

  echo "✅ Docker deployment completed successfully!"
  docker compose -f docker-compose.prod.yml ps

elif [ "$DEPLOY_MODE" = "pm2" ]; then
  echo "⚡ Deploying with PM2 & Local Node.js..."

  # Install production dependencies
  echo "📦 Installing npm dependencies..."
  npm ci

  # Generate Prisma Client
  echo "🔧 Generating Prisma Client..."
  npx prisma generate

  # Push/migrate database schema
  echo "🗄️ Updating MySQL schema..."
  npx prisma db push

  # Seed database if requested
  echo "🌱 Ensuring J2K master data is seeded..."
  npx tsx prisma/seed.ts || true

  # Build Next.js
  echo "🏗️ Building Next.js production bundle..."
  npm run build

  # Start or reload PM2
  if command -v pm2 &> /dev/null; then
    echo "🔄 Reloading PM2 processes..."
    mkdir -p logs
    pm2 startOrReload ecosystem.config.js --env production
    pm2 save
    pm2 status
  else
    echo "⚠️ PM2 not found. Install via: npm install -g pm2"
    echo "Starting Next.js with npm run start..."
    npm run start
  fi

  echo "✅ PM2 deployment completed successfully!"

else
  echo "❌ Unknown deploy mode: $DEPLOY_MODE. Use 'docker' or 'pm2'."
  exit 1
fi

echo "=========================================================="
echo "🎉 SmartJeff is now LIVE and running on your VPS!"
echo "Check health: http://localhost:3000/api/security/dlp/status"
echo "=========================================================="
