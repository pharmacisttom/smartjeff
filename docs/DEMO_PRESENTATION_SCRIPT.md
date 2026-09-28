# SmartOP Demo Presentation (15–20 minutes)

All screens and figures shown are synthetic demo data.

| Time | Account / route | Demonstration | Talking points | Fallback |
|---|---|---|---|---|
| 0–1 min | `/login` | Introduction and branding | Secure local auth, multilingual UI, no auth bypass | Explain from readiness checklist |
| 1–4 min | EXECUTIVE → `/admin/dashboard` | KPI and workforce overview | 30 staff, 3 sites, attendance and high-level reporting | Use dashboard cards already rendered from demo data |
| 4–7 min | HR → `/admin/employees`, `/admin/attendance`, `/admin/leaves`, `/admin/payroll` | Employee lifecycle and payroll | Synthetic identities and compensation only | Use reports view if a transaction screen is unavailable |
| 7–9 min | COORDINATOR → `/admin/operations/planning` | Workforce/site planning | Cross-site coordination and work orders | Show `/admin/operations` overview |
| 9–11 min | SITE_SUPERVISOR → `/admin/attendance` | Daily approval flow | Site scope and operational control | Show read-only attendance overview |
| 11–13 min | EMPLOYEE → `/check-in`, `/history`, `/leave`, `/payslip` | Self service | Mobile-first check-in, history, leave and payslip | Use 375 px responsive preview |
| 13–16 min | ADMIN → `/admin/security/users` | Activation PIN and optional MFA | One-time PIN, 72-hour expiry, session invalidation and audit | Describe flow without issuing a PIN |
| 16–18 min | ADMIN → `/admin/security/audit` | Audit and RBAC | Explainable permissions and protected audit metadata | Use security overview |
| 18–20 min | Responsive preview | 320–1440 px | Same workflow on mobile and desktop | Use browser device emulation |

## Safe fallback plan

- External notifications and payment calls return labelled `[DEMO]` mock results when `DEMO_MODE=true`.
- If a map provider is unavailable, keep the presentation on site/workforce cards and label the map unavailable; never claim live production data.
- If an API fails, use already-rendered synthetic dashboard information and state that the demo fallback is being shown.
- Never reveal the demo password, PIN, MFA secret, recovery code, database URL or session token.
