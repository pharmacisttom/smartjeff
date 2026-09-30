# SmartOP Demo Accounts

All identities and operational records in demo mode are synthetic.

All demo accounts use the password configured by `DEMO_DEFAULT_PASSWORD`.

| Role | Email | System RBAC Role | Purpose |
|---|---|---|---|
| ADMIN | pharmacisttom@gmail.com | SUPER_ADMIN | Administration, RBAC, security, audit and settings |
| EXECUTIVE | executive@j2k.com | EXECUTIVE | KPI, executive dashboard and reports |
| HR | hr@j2k.com | HR_MANAGER | Employees, attendance, leave and payroll |
| COORDINATOR | coordinator@j2k.com | PROJECT_MANAGER | Site coordination and workforce planning |
| SITE_SUPERVISOR | supervisor@j2k.com | SITE_MANAGER / SUPERVISOR | Site staff, approvals and daily operations |
| EMPLOYEE | employee@j2k.com | EMPLOYEE | Employee self-service |

Create the synthetic data with `npm run demo:seed`, then safely provision or refresh only the six accounts with `npm run demo:users`. Passwords alone can be rotated with `npm run demo:passwords`.

All commands require `DEMO_MODE=true`, `DEMO_SEED_ALLOWED=true`, and a database name ending with `_demo`.
