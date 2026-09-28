# System Coverage Matrix

Audit date: 2026-09-28. `COMPLETE` is intentionally rare and requires a working end-to-end workflow, not merely a page.

| Module | Menu | Page | API | DB | RBAC | Workflow | Test | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|
| Authentication/Login/Logout | Yes | Yes | Yes | Yes | Auth boundary | Working | Unit | COMPLETE | A |
| MFA | Indirect | Login only | Verification only | Yes | Auth policy | Enable/disable UI absent | Unit partial | PARTIAL | A |
| Activation PIN | User admin | Login/admin | Issue/use | Yes | Admin issue | Mostly working | Unit | PARTIAL | A |
| Admin dashboard | Yes | Yes | Yes | Yes | Coarse admin | Read only | No focused test | PARTIAL | A |
| Executive dashboard | Shared | Shared | Yes | Yes | Role | Not distinct | No | PARTIAL | B |
| Employee master | Yes | Yes | CRUD/import | Yes | Role + some DLP | CRUD works | Unit partial | PARTIAL | A |
| Employee profile | No | Missing | Missing | User/Employee | Missing | Missing | No | MISSING | B |
| Department | Security submenu | Read page | No dedicated CRUD API | Yes | Coarse | Read only | No | BACKEND_ONLY | B |
| Position master | No | Missing | Missing | Text field only | Missing | Missing | No | MISSING | B |
| Client/CRM | Yes | Yes | No dedicated client CRUD API | Yes | Navigation only | Mostly read | No | PARTIAL | B |
| Site | Yes | Yes | CRUD | Yes | Role | CRUD | No focused test | PARTIAL | A |
| Shift template | Schedule | Schedule | Schedule APIs | Yes | Auth/role | Assignment partial | Unit partial | PARTIAL | A |
| Work schedule | Yes | Yes | Yes | Yes | Auth | Generate/assign/relief | Unit partial | PARTIAL | A |
| Attendance/check-in | Yes | Yes | Yes | Yes | Auth/role | Check-in/out | Unit | COMPLETE | A |
| Attendance correction | Admin attendance | UI review | Approval API | Yes | Role | Correction request absent | No | WORKFLOW_INCOMPLETE | A |
| Leave | Yes | Yes | CRUD/status | Yes | Auth/role | Create/approve/reject/history | Unit | PARTIAL | A |
| Payroll run | Yes | Yes | GET/POST | Yes | Role | Calculate only; review/finalize weak | Unit partial | PARTIAL | A |
| Payroll component | No | Missing | Missing | Yes | Missing | Missing | No | BACKEND_ONLY | A |
| Payroll policy | No | Missing | Missing | Yes | Missing | Missing | No | BACKEND_ONLY | A |
| Payroll period | No | Missing | Missing | Yes | Missing | Missing | No | BACKEND_ONLY | A |
| Payslip | Employee menu | Yes | Payroll API/DB | Yes | Employee session | View/print | Unit partial | PARTIAL | A |
| Employee deployment | Dispatch only | Required route missing | Dispatch read only | Yes | Missing | Approval/transfer absent | No | BACKEND_ONLY | A |
| Import Center | Yes | Analyze UI | Analyze only | ImportJob | Role | 2/9 steps functional | Analyzer tests | PARTIAL | A |
| Reports | Yes | Yes | Daily report | DB/services | Role | View; export incomplete | No | PARTIAL | B |
| Notifications | Settings | Settings | Test only | Notification | Role | Configuration/test partial | No | PARTIAL | B |
| Audit log | Security | Yes | Read API/direct DB | Yes | Admin | Read only | Service unit | PARTIAL | A |
| Role management | Security | Yes | CRUD/clone | Yes | Admin | Working | Unit partial | PARTIAL | A |
| Sessions | Security | Yes | List/revoke | Yes | Auth | Working | Unit partial | PARTIAL | A |
| DLP | Security | Yes | Status/verify/test | Yes/service | Admin | Partial | Unit | PARTIAL | B |
| Operations/work orders | Yes | Yes | Limited | Yes | Navigation/role | Read-oriented | No | PARTIAL | B |
| Automation | Yes | Yes | Missing rule CRUD | Event/approval models | Navigation | Static rules | No | UI_ONLY | C |
| AI governance | Yes | Yes | No complete proposal action API | AI proposal | Navigation | Read-oriented | No | PARTIAL | C |
| Platform health | Yes | Yes | Direct DB | System models | Navigation | Observability partial | No | PARTIAL | B |
| Backup/DR | Yes | Yes | Missing | Missing operational records | Navigation | Mock/display only | No | PLACEHOLDER | A |
| Billing | Settings | Yes | Client-side service call | Payment models indirect | Coarse | Mock/test values | No | UI_MOCK_ONLY | A |
| Support | Yes | Yes | Missing | Missing ticket model | Coarse | Local state only | SLA unit only | UI_ONLY | B |
| Thai/Khmer/Myanmar | Login | Partial | N/A | User.locale | User preference API missing | Browser-local only | i18n unit partial | PARTIAL | B |

## Totals at module level

- Discovered major modules: 37
- COMPLETE: 2
- PARTIAL / workflow incomplete: 24
- MISSING: 2
- BACKEND_ONLY: 4
- UI_ONLY / UI_MOCK_ONLY / PLACEHOLDER: 5
- BROKEN menu routes found by static route audit: 0
