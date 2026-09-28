# Placeholder, Static and Non-persistent Features

Static audit date: 2026-09-28. Input placeholders in form fields are not classified as feature placeholders.

| Feature / page | Evidence | Classification | Risk |
|---|---|---|---|
| Platform backups `/admin/platform/backups` | Hard-coded backup history, storage targets and success states; manual snapshot button has no persistence path | UI_MOCK_ONLY | Critical: may imply backups exist when they are not verified |
| Automation rules `/admin/automation/rules` | `RULES` is a source-code array; no rule CRUD API | UI_ONLY | High: displayed rules are not an executable rule engine |
| AI policies `/admin/ai/policies` | `POLICIES` source-code array | UI_ONLY | High: policy display is not persisted/enforced configuration |
| Analytics catalog `/admin/analytics/catalog` | `DATA_MODELS` source-code array | UI_ONLY | Medium: catalog does not discover schema/lineage |
| Billing settings `/admin/settings/billing` and `/settings/billing` | Plans/invoices held in React state, test payment token, PDF action only displays success modal | UI_MOCK_ONLY | Critical if exposed as real billing |
| Support `/admin/support` and `/support` | Tickets are initialized in React state and replies only mutate local state | NO_PERSISTENCE | High |
| Automation/AI child pages | Several read DB counters, but configuration/action workflows are absent | PARTIAL | High |
| Platform DR page | Presentation/runbook UI exists; no verified restore operation or drill record API | PLACEHOLDER | Critical |
| Import Center after Analyze | Workflow rail displays Map, Validate, Dry Run, Confirm, Import and Report, but only Analyze API exists | WORKFLOW_INCOMPLETE | Critical |
| Compliance document generator | Source explicitly labels government document generator as a stub | STUB | Medium |

## False positives excluded

- Form `placeholder=` attributes are normal input hints.
- Demo-mode integration mocks are intentional and guarded by `DEMO_MODE`; they are not production implementations.
- Enterprise pages that query Prisma directly are not called placeholders solely because they share layout components, but remain PARTIAL when mutations/workflows/tests are missing.
