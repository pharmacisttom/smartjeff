# Database and credential release policy

This repository contains synthetic demo data only.

This statement describes the intended sanitized release tree and the fixtures in this directory, not the historical Git objects or private files in a developer checkout. Historical exposure remains a release blocker until reviewed.

- Never commit production dumps, completed employee spreadsheets, uploads, passwords, real account hashes, tokens, .env, private keys or backups.
- SQL here is generated DDL or hand-authored synthetic records. It is never an export from production.
- Demo passwords come from environment variables, are hashed with Argon2id, are not logged, and are not embedded in SQL.
- Seed is forbidden when NODE_ENV=production, requires DEMO_SEED_ALLOWED=true and a database name ending in _demo, refuses unrelated user/employee/site records, and performs upserts in a transaction.
- Old source included shared login passwords, employee-directory fallbacks, staff records and insecure deployment defaults. Removing them from the current tree does not erase history. Rotate any credential ever used, invalidate old sessions and review Git history before public release.
- The private local spreadsheet and SQL dump must stay ignored and untracked. No raw database has been accessed to generate this bundle.
- Never force-push a history rewrite as part of deployment. Arrange historical-data cleanup separately with the repository owner.
