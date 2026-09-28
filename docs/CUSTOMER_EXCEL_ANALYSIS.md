# Customer Excel Analysis — jeffy1.xlsx

## Handling and provenance

- Source role: customer business requirement and legacy structure reference.
- SHA-256: `3aa519716de1127401965baf33d61443ce642c590719c975378b873f465ccefb`.
- The workbook contains personal, contact, banking, attendance and payroll data. It must remain outside Git and must only be processed in the private customer-test environment.
- This report intentionally contains structure and aggregate counts only. No employee row, bank account, citizen ID, phone number, email address or payroll amount is reproduced.

## Workbook inventory

| Sheet | Used range | Structural role | Formula cells | Import readiness |
|---|---:|---|---:|---|
| ประวัติพนักงาน J2K | A1:S155 | Employee master | 153 | PARTIAL — header row 3; full-name splitting and code normalization required |
| Staff_info | A2:K15 | Approval/staff reference | 0 | NEEDS_CONFIRMATION — mixed-width records and no stable header row |
| CODE | A1:I40 | Site, nationality and gender reference lists | 0 | PARTIAL — multiple lookup tables share one sheet |
| เวลา -เข้าออกงาน | A2:H49 | Site working/OT times | 0 | PARTIAL — Excel decimal-time values require explicit conversion |
| เงินเดือน | A1:AG157 | Payroll input/calculation | 872 | NEEDS_CONFIRMATION — formulas and business rates require customer sign-off |
| Attenden () | A1:AH34 | Monthly attendance presentation/template | 0 | NEEDS_CONFIRMATION — calendar-style report, not a normalized transaction table |
| Slip | A1:P24 | Payslip presentation template | 6 | REFERENCE_ONLY — output layout, not an import table |
| Customer | A2:I38 | Client/site/contact master | 1 | PARTIAL — client, site and contact values are combined |
| เอกสารส่งตัว | A1:AD38 | Employee deployment document | 0 | REFERENCE_ONLY — form layout with merged cells |

## Confirmed data mapping

| Workbook source | SmartOP target | Transformation / validation |
|---|---|---|
| Employee `รหัส` | `Employee.code` | Trim, preserve leading zero, required and unique |
| Employee `ชื่อ - นามสกุล` | `Employee.firstName`, `Employee.lastName` | Preview split; user must confirm ambiguous names |
| `ตำแหน่ง` | `Employee.position` | Required text; future Position master mapping |
| `หน่วยงาน` | `Department` / `Employee.departmentId` | Normalize and map by approved department code |
| `วันที่เริ่มงาน` | `Employee.startDate` | Validate Excel date serial or explicit date text |
| `วันเกิด` | `Employee.birthDate` | Sensitive; import only for approved purpose |
| `เพศ`, `สัญชาติ` | Employee fields | Map through CODE lookup; do not infer language |
| Citizen ID / phone / bank fields | Restricted employee fields | Validate, encrypt/mask at presentation, never audit raw values |
| Customer `CODE` | `Client.code` or `Site.code` | Customer must confirm whether the code identifies client, site, or contract location |
| Customer factory abbreviation/name | `Site.shortName`, `Site.name` | Site belongs to a client |
| Customer contact columns | `ClientContact` | Normalize email/phone; allow multiple contacts after review |
| Site time columns | `ShiftTemplate` | Convert only after checking actual Excel cell type/number format |
| Payroll employee code | Employee business key | Must resolve to exactly one employee |
| Payroll income/deduction columns | `PayrollComponent` entries | Configurable components; no rate embedded in UI |
| Deployment document | `EmployeeDeployment` | Effective date, site, position, supervisor, approval and document references |

## Quality findings

- Header rows are not consistent: some start on row 2 or 3 and several sheets are document templates rather than tables.
- The employee and payroll sheets each contain approximately 153 data/formula rows and must be joined by normalized employee code, not row number.
- Employee columns contain mixed string/number types. Codes must always be read as text to retain leading zeroes.
- Employee optional fields have material missingness, especially later columns; required fields must be selected during mapping rather than assumed.
- The Customer sheet has 36 records; contact email and phone are incomplete in several rows.
- Site work/OT columns use numeric Excel time values. Import must inspect cell number format and reject ambiguous decimal values.
- Payroll has 872 formula cells across income and deduction columns. Formula results alone are insufficient evidence of the business rule.
- The attendance and deployment sheets are presentation-oriented and cannot be safely treated as row-per-transaction imports without customer clarification.

## Rules requiring customer confirmation

All items below are `NEEDS_CONFIRMATION` and must be configurable:

- Salary period start/end dates (including whether 21st–20th applies).
- OT eligibility, rounding and rates for OT 1, 1.5, 2 and 3.
- Travel, food, heat, dishwashing, skill, shift, phone, position, housing, coordination and attendance incentive rules.
- Holiday, personal leave, sick leave and annual leave payment rules.
- Social-security base, cap and rounding; tax and percentage-deduction semantics.
- Late/absence deductions and attendance penalty rules.
- Whether Customer CODE is a client code, site code or legacy location code.
- Staff_info approval semantics and intended system role.
- Authoritative attendance source and how the calendar template represents late, absent, leave and OT.
- Payroll approval chain and when a payslip becomes visible to an employee.

## Safe import strategy

1. Upload `.xlsx` to memory/private temporary storage only.
2. Hash the complete file and reject unsupported/encrypted/macro-enabled content.
3. Analyze sheets without importing.
4. Select import type and header row, then map columns explicitly.
5. Validate every row and perform a dry run.
6. Block confirmation when any critical error exists.
7. Confirm with server-side RBAC and re-check the file hash.
8. Upsert by approved business key and row hash.
9. Audit counts and identifiers only; never raw PII.
10. Produce an import report and securely remove temporary content.
