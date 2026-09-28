# SmartOP Demo Accounts

All identities and operational records in demo mode are synthetic.

All demo accounts use the password configured by `DEMO_DEFAULT_PASSWORD`.

| Role | Email | Employee code | Purpose |
|---|---|---|---|
| ADMIN | admin@demo.smartop.local | — | Administration, RBAC, security, audit and settings |
| EXECUTIVE | executive@demo.smartop.local | — | KPI, executive dashboard and reports |
| HR | hr@demo.smartop.local | — | Employees, attendance, leave and payroll |
| COORDINATOR | coordinator@demo.smartop.local | — | Site coordination and workforce planning |
| SITE_SUPERVISOR | supervisor@demo.smartop.local | — | Site staff, approvals and daily operations |
| EMPLOYEE | employee@demo.smartop.local | EMP-DEMO-001 | Employee self-service |

Create the synthetic data with `npm run demo:seed`, then safely provision or refresh only the six accounts with `npm run demo:users`. Passwords alone can be rotated with `npm run demo:passwords`.

All commands require `DEMO_MODE=true`, `DEMO_SEED_ALLOWED=true`, and a database name ending with `_demo`.
