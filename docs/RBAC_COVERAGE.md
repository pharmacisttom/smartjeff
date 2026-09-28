# RBAC Coverage

This is static evidence from navigation permissions, middleware and API guards. Middleware only distinguishes employee-only from management routes; fine-grained navigation permissions are not equivalent to server-side authorization.

Legend: V=view, C=create, E=edit, D=delete, A=approve, X=export, `—`=not evidenced, `P`=partial/role guard only.

| Module | ADMIN | EXECUTIVE | HR | PAYROLL | COORDINATOR | SITE_SUPERVISOR | EMPLOYEE | Finding |
|---|---|---|---|---|---|---|---|---|
| Dashboard | V | V | V | P | P | P | — | Executive has no distinct route-level dashboard policy |
| Employee | VCED | V | VCE | — | V | V | own | APIs mostly use broad role checks; field-level DLP varies |
| Attendance | VCEA | V | VEA | — | V | VEA | own create/view | Correction workflow incomplete |
| Leave | VEA | V | VEA | — | V | VEA | own create/view | API allows broad status changes; approval authority not consistently checked |
| Payroll | VCA | V/A | VA | VCA | — | — | own payslip | PAYROLL role not represented consistently in existing role seed/routing |
| Site | VCED | V | V | — | V | V | V | Site mutation limited to admin in API |
| Shift/Schedule | VCE | V | V | — | VCE | VE | V | Uses role checks rather than granular permission service |
| Import Center | V/C | — | V/C | V/C | — | — | — | Analyze only; navigation permission is `employee.create`, API uses roles |
| Security/RBAC | full | — | partial | — | — | — | — | Stronger API coverage than most modules |
| Audit | V | V in reports | partial | — | — | — | — | Audit reads are admin-centric |
| Enterprise modules | P | P | P | P | P | P | — | Many server components query DB directly; route middleware is coarse |

## Missing or inconsistent controls

1. `PAYROLL` and `SITE_SUPERVISOR` are required roles but are not consistently present in central role definitions, default routing and every API allow-list.
2. Navigation hides items using permissions, while many APIs authorize with legacy role strings. These two policy systems can drift.
3. Most `/admin/enterprise/*` server pages rely on the broad `/admin` middleware boundary, not a per-page permission check.
4. Many mutation APIs do not record audit events.
5. Export, delete and approval actions do not consistently require sensitivity/approval-authority checks.
6. Tests cover authorization services and selected routes, not a full role × action matrix.
