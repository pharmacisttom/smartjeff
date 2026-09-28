# Customer Gap Analysis

| Requirement | Current SmartOP | Status | Gap | Recommendation | Priority | Affected Module |
|---|---|---|---|---|---|---|
| Employee master | Employee model and CRUD exist | PARTIAL | Department relation, employment status and controlled locale need completion | Extend master data and import mapping | High | HR |
| Client master | Client model exists | PARTIAL | Multiple contacts and direct client-to-site relation missing | Add ClientContact and Site.clientId | High | CRM/Site |
| Site master | Site/geofence exists | PARTIAL | Short name, lifecycle status and client relation missing | Extend Site without removing current fields | High | Site |
| Shift management | Templates and assignments exist | PARTIAL | Site/position scope, OT boundaries and cross-midnight flag missing | Extend configurable ShiftTemplate | High | Scheduling |
| Attendance | Check-in/out records and approval exist | PARTIAL | Monthly normalized summary and legacy template mapping missing | Add computed summary API after rules are confirmed | High | Attendance |
| Payroll periods | PayrollRun uses a period string | NOT_SUPPORTED | No explicit start/end lifecycle | Add PayrollPeriod and link runs | High | Payroll |
| Payroll components | Payslip has many fixed columns | PARTIAL | Components/rates are rigid | Add component/policy layer; migrate gradually | High | Payroll |
| Payroll formulas | Existing calculations and legacy formulas differ | NEEDS_CONFIRMATION | Customer rules are not authoritative yet | Configure only after signed rule matrix | Critical | Payroll |
| Payslip | Employee payslip and printing exist | PARTIAL | Dynamic component rows and explicit period entity missing | Preserve current view, add component breakdown | Medium | Payslip |
| Employee deployment | Dispatch/scheduling exists | PARTIAL | Effective-dated site transfer and approval record missing | Add EmployeeDeployment workflow | High | Operations |
| Excel import center | Employee import endpoint exists | PARTIAL | No unified analyze/map/dry-run/confirm job workflow | Build staged ImportJob workflow | Critical | Platform |
| Import idempotency | Some upserts exist | PARTIAL | File/row hash not consistently recorded | Use fileHash, rowHash and business keys | Critical | Import |
| Import audit | General audit exists | PARTIAL | Import event vocabulary and PII-safe metadata policy missing | Add five import audit events with counts only | High | Audit |
| RBAC | Central roles/permissions exist | PARTIAL | PAYROLL role and import permissions require explicit seeding | Add least-privilege import permissions | High | IAM |
| Demo accounts | Six guarded accounts exist | SUPPORTED | PAYROLL demo account is not separately requested in supplied list | Keep six accounts; confirm seventh account need | Low | Demo |
| Password security | Argon2id and environment-only demo password | SUPPORTED | None identified | Retain current guard and rotation scripts | Critical | Security |
| MFA | TOTP/recovery verification exists | PARTIAL | End-user disable and role REQUIRED/OPTIONAL policy not complete | Add policy and audited reset workflow | Medium | Security |
| Activation PIN | Hashed one-time PIN flow exists | SUPPORTED | Operational verification still required on UAT | Execute UAT checklist | High | Security |
| Thai/Khmer/Myanmar | Existing dictionary and switcher support all three | PARTIAL | Several employee routes are missing; persistence is local browser, not User.locale API | Add profile preference endpoint and coverage tests | Medium | i18n |
| Mobile | Employee pages are responsive-first | PARTIAL | Formal viewport regression suite absent | Add Playwright viewport tests | Medium | Employee Portal |
| Environment separation | Demo guards exist | PARTIAL | Customer-test guard and deployment runbook incomplete | Add explicit environment mode checks and private access controls | Critical | DevOps |

## Delivery boundary

The workbook supports structural discovery, but it does not unambiguously define payroll, attendance, leave, tax or social-security policy. Those features remain `NEEDS_CONFIRMATION`; no inferred formula should be promoted to production.
