# Missing Systems Report

## CRITICAL — Demo or production safety blockers

1. Prisma migration history is not clean: `20261001000000_deprecate_plaintext_password` remains untracked, while production previously reported P3018. Migration deploy cannot be declared safe.
2. Backup and disaster-recovery screens display successful snapshots/controls without a verified backend. This can create a false operational assurance.
3. Billing contains test token/data and client-side simulated invoices. It must not be exposed as production billing.
4. Import workflow stops after Analyze. Mapping, server validation, dry run, confirm, transactional import and report are missing.
5. Payroll policy/component/period models have no management APIs/UI, while payroll rules remain unconfirmed.
6. Customer workbook was removed from HEAD but remains in old Git history; repository history still contains customer data.

## HIGH — Core workflow gaps

- MFA lacks complete self-service enable/disable/recovery management workflow.
- Attendance correction request workflow is missing.
- Payroll review, approval authority enforcement, finalize and immutable payslip publication are incomplete.
- Employee deployment model lacks `/operations/deployment`, API and approval workflow.
- Position and department master CRUD are absent/incomplete.
- PAYROLL/SITE_SUPERVISOR coverage is inconsistent between navigation, roles and API allow-lists.
- Most mutation APIs do not create audit events.
- Enterprise pages often have read-only direct-Prisma views without mutation APIs or workflow tests.

## MEDIUM

- Employee profile, notification center, account security and help routes requested by the customer are absent.
- Client/contact management lacks dedicated CRUD API/UI.
- Reports export is not consistently implemented.
- User locale is stored but employee preference is not synchronized from the browser language switcher.
- Support ticket system is local React state only.
- Automation rules and AI policies/catalog are static arrays.
- No full Playwright system smoke suite was found.

## LOW

- Duplicate route implementations under route groups and `/admin` increase maintenance risk.
- Several files contain mojibake when read in the current console/code path; Unicode rendering requires browser verification.
- `next lint` is deprecated and needs migration to ESLint CLI before Next.js 16.

## Route findings

- Static navigation audit: 113 active menu/application routes, 113 resolved, 0 missing.
- App inventory: 159 page files and 54 API route files.
- Missing requested non-menu routes: `/check-out`, `/attendance`, `/profile`, `/notifications`, `/account/security`, `/help`, `/operations/deployment`.
- HTTP/browser status against the deployed VPS was not verified in this source-only audit; absence of static 404 does not prove absence of runtime 500.
