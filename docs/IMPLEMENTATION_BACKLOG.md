# Implementation Backlog

## Phase A — Demo blockers

1. Reconcile Prisma P3018 and commit/review the plaintext-password migration; validate on a cloned database before production.
2. Hide or clearly label Backup/DR and Billing mock screens until real services and health evidence exist.
3. Complete Import Center mapping → validation → dry run → confirmation → transaction → report.
4. Add end-to-end smoke tests for login and the six demo roles; fail on console error, 404 or 500.
5. Purge `jeffy1.xlsx` from Git history through a coordinated `git filter-repo` operation.

## Phase B — Core workflow

1. Payroll policy/component/period management and signed rule configuration.
2. Payroll review/approve/finalize and employee payslip publication authorization.
3. Attendance correction request/review/approval.
4. MFA self-service enable, verify, recovery and disable; admin audited reset.
5. Employee deployment/transfer workflow with effective date and approval.
6. Consolidate role strings and permission checks into server-side permission authorization.
7. Add audit events to all security-sensitive mutations.

## Phase C — Customer requirement

1. Employee profile, department and position masters.
2. Client/contact/site CRUD and Excel adapters.
3. Shift and attendance adapters for the confirmed workbook layouts.
4. User.locale persistence and full Thai/Khmer/Myanmar employee-portal coverage.
5. Monthly attendance summary and configurable payroll periods.

## Phase D — Nice to have

1. Replace static Automation rules, AI policies and data catalog with persisted management.
2. Implement Support Ticket persistence and SLA notifications.
3. Reports export/PDF improvements.
4. Consolidate duplicate route-group pages and migrate `next lint` to ESLint CLI.
