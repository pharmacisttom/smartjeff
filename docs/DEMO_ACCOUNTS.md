# SmartOP Demo Accounts

All identities and operational records in demo mode are synthetic. The password is configured only through `DEMO_DEFAULT_PASSWORD`; it is never stored in this document or committed to Git.

| Role | Email | Employee code | Purpose |
|---|---|---|---|
| ADMIN | admin@demo.smartop.local | — | Administration, RBAC, security, audit and settings |
| EXECUTIVE | executive@demo.smartop.local | — | KPI, executive dashboard and reports |
| HR | hr@demo.smartop.local | — | Employees, attendance, leave and payroll |
| COORDINATOR | coordinator@demo.smartop.local | — | Site coordination and workforce planning |
| SITE_SUPERVISOR | supervisor@demo.smartop.local | — | Site staff, approvals and daily operations |
| EMPLOYEE | employee@demo.smartop.local | EMP-DEMO-001 | Employee self-service |

Provision with `npm run demo:seed` only when `DEMO_MODE=true`, `DEMO_SEED_ALLOWED=true`, and the database name ends with `_demo`.
