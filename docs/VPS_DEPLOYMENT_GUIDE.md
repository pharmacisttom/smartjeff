# VPS deployment

See [README](../README.md) for fresh demo installation and [DATABASE](DATABASE.md) for migration and recovery.

Requirements: Node 20.17+ (use a supported patched Node release), MySQL 8 / MariaDB 10.11+, Nginx, PM2, TLS certificate. Run as an application user. Never deploy the demo seed to an existing business database.

Before replacing an existing release:

1. Rotate every credential previously embedded in source or deployment examples. Invalidate existing sessions by rotating AUTH_SECRET. Never paste credentials into issue reports or shell history.
2. Back up the database to encrypted storage outside the checkout and rehearse restore.
3. Check `npx prisma migrate status`. An installation previously created with `db push` can differ from migration history. Reconcile it on a restored isolated copy before deploying. Do not blindly baseline or rerun SQL against production.
4. Review the new additive migration. Existing migration files remain unchanged. Do not use `migrate reset`, `db push --accept-data-loss`, or seed in production.

```sh
git clone https://github.com/pharmacisttom/smartjeff.git
cd smartjeff
cp .env.production.example .env
chmod 600 .env
# Edit .env privately: DATABASE_URL, AUTH_SECRET, ENCRYPTION_KEY, APP_URL.
# Set NODE_ENV=production and DEMO_SEED_ALLOWED=false.
npm ci
npx prisma generate
npx prisma migrate deploy
npm run create-admin
npm run lint
npm run typecheck
npm test
npm run build
mkdir -p logs
pm2 start ecosystem.config.js --env production
pm2 save
curl --fail http://127.0.0.1:3000/api/ping
```

The admin creation command prompts for a new password and hashes it with Argon2id. It never prints the password. Existing MFA is preserved. Rotate other account passwords via an approved administrative process before re-enabling their access.

Nginx must terminate TLS, overwrite X-Forwarded-For with the client address, and rate-limit `/api/auth/login`. Keep the Node port private (localhost). For PM2 use `127.0.0.1:3000` as the upstream instead of the Docker hostname `app`. Adapt certificate paths and server_name to the actual domain. Run `nginx -t` before reload.

The Docker configuration requires private MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD, REDIS_PASSWORD, AUTH_SECRET and ENCRYPTION_KEY. Configure certificate files first, then run `bash scripts/deploy.sh docker`. The separate migrate service contains the pinned Prisma CLI; the runtime image does not download tools. Docker deployment does not seed or stop the old stack before build.

Turnstile is optional: configure both NEXT_PUBLIC_TURNSTILE_SITE_KEY at build time and TURNSTILE_SECRET_KEY at runtime. Requests must pass verification whenever the server key is set. Login also enforces per-process throttling and the proxy limit.

After deployment verify HTTPS login, MFA, logout/session revocation, employee access isolation, dashboard, attendance, leave and payroll. Keep the prior release for rollback; do not automatically reverse a migration or restore a backup over live data.
