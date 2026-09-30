# SmartOP Standard Demo Accounts Documentation

Single Source of Truth: `src/config/demo-accounts.ts`

| Key | Primary Email | Alternate Email | Database Role Code | Scope Type | Landing Route | Description | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **ADMIN** | `admin@j2k.com` | `pharmacisttom@gmail.com` | `SUPER_ADMIN` | `GLOBAL` | `/admin/dashboard` | บริหารระบบ ผู้ใช้ สิทธิ์ Security และ Settings | `READY` |
| **EXECUTIVE** | `executive@j2k.com` | - | `EXECUTIVE` | `GLOBAL` | `/admin/dashboard` | Dashboard, KPI, Analytics, Reports | `READY` |
| **HR** | `hr@j2k.com` | - | `HR_MANAGER` | `GLOBAL` | `/admin/dashboard` | Employee, Attendance, Leave, Payroll, Import | `READY` |
| **COORDINATOR** | `coordinator@j2k.com` | - | `PROJECT_MANAGER` | `PROJECT` | `/admin/dashboard` | Operations, Workforce Planning, Sites, Map, Assignment | `READY` |
| **SUPERVISOR** | `supervisor@j2k.com` | - | `SUPERVISOR` / `SITE_MANAGER` | `SITE` | `/operations` | Team, Attendance, Approval, Work Orders, Incident | `READY` |
| **EMPLOYEE** | `employee@j2k.com` | - | `EMPLOYEE` | `OWN` | `/check-in` | My Dashboard, Check-in, Leave, Expense, Profile | `READY` |

## Security Policy Requirements
- Password MUST be supplied via environment variable `DEMO_PASSWORD`.
- Password MUST meet policy (>= 12 chars, upper, lower, digit, special character).
- Password MUST NEVER be printed in console output or committed to source control.
