# Readiness audit — 2026-09-27

Status: IN PROGRESS. Deployment and push are gated on verification.

## Initial findings (before changes)

- ERROR: Login and NextAuth accept embedded shared passwords and directory-only identities when the database is unavailable. Session and authorization also trust a generated employee directory. Root cause: development fallback became an authentication path.
- ERROR: Seed deletes business tables and imports a tracked staff spreadsheet. Deployment runs that seed automatically and uses db push. Root cause: demo bootstrap and production deployment are coupled.
- ERROR: Credentials are present in committed setup/test scripts and prior history. Values are intentionally omitted. Remove literals, rotate used credentials, and review repository history before release.
- ERROR: Generated staff directory and tracked jeffy1.xlsx are unsuitable for public distribution. No production data is needed for the replacement demo.
- WARNING: Checkout is master, requested release branch is main. Remote state must be checked before publishing.
- WARNING: package scripts invoke tsx but do not declare it. Password hashing is bcrypt, whereas the requested new demo uses Argon2id.
- WARNING: No README/database installation bundle exists. Migration equivalence and fresh installation need verification.
- PASS: Prisma uses MySQL and versioned SQL migrations; existing migrations will be preserved.
- PASS: Next.js standalone output, strict TypeScript, lint and Vitest scripts exist.
- WARNING: .gitignore does not cover *.sql.bak or backup/, and ignore rules do not untrack previously committed files.

## Checks

Install, audit, lint, TypeScript, Prisma, tests, build, browser and database rehearsal: pending.
No production database has been read or modified. Existing local .env remains private and unchanged.
