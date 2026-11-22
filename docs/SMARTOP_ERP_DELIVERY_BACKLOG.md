# SmartOP — แผนส่งมอบ ERP / Tax / Finance และ backlog พร้อมเกณฑ์ Done

วันที่ 22 พฤศจิกายน 2026 · แผนที่ขยายตามคำขอล่าสุด · ยังไม่ใช่ completed implementation

อ่าน [Blueprint](SMARTOP_INTEGRATED_ERP_BLUEPRINT.md), [Tax design](SMARTOP_TAX_FILING_DESIGN.md), [Data model](SMARTOP_ERP_INTEGRATION_DATA_MODEL.md) และ [Gap audit 48 ประเด็น](SMARTOP_COMPANY_SYSTEM_GAP_AUDIT.md) ก่อนเลือก ticket

## 1. ขอบเขตการเดินงาน

คง phase P0–P8 ของแผนเดิมสำหรับ traceability แต่ใช้ delivery streams A0–A7 ด้านล่างเพื่อจัด dependency ของงานทั้งบริษัท คำขอใหม่ขยาย scope บัญชี/ภาษี/จัดซื้อจัดจ้าง/การเงินอย่างชัดเจน ไม่ทำทุกโมดูลพร้อมกันหรือรับรอง production จากเอกสารออกแบบ

| Stream | เชื่อม phase เดิม | Deliverable / gate |
| --- | --- | --- |
| A0 Production blockers | P0/P2/P8 | baseline clone, restore proof, auth/scope gaps และ payroll non-demo calculation ผ่านก่อนใช้จ่าย/ยื่นจริง |
| A1 Shared masters & GL | P0/P1/P6 | company/branch/VAT profiles, counterparties, approval rules, numbering, COA/period/balanced manual journal + tests |
| A2 Inventory workflows | P3 | ต่อ P3 services เดิมเป็น document workflow/API/UI, reservations/receiving/acknowledgement, reconciliation |
| A3 Procure to Pay | P4/P6 | PR/RFQ/PO/service contracts, inspection/acceptance, invoice match, vendor billing, AP |
| A4 Order to Cash & Treasury | P5/P6 | customer order/service evidence/billing, invoice/credit/receipt allocations, payment/bank workflow |
| A5 Tax & Remittance | P2/P5/P6 | tax events/registers, VAT/WHT/certificates, approved returns, assisted filing/evidence/payment, conditional CIT/foreign/stamp |
| A6 Adjacent company operations | P1/P2/P7 | payroll/SSO, assets/expense/advances, SLA/tickets/maintenance, site profitability ตาม launch scope |
| A7 UAT / Release | P8 | provider/staging/browser/load/security/restore tests, reconciliation, training, signed go-live |

A1 journal engine และ A5 rule/data contracts วางก่อนต่อ automatic posting จาก A2–A4; ไม่รอให้สร้างเอกสารธุรกิจทั้งหมดเสร็จแล้วค่อยคิดเรื่องบัญชี/ภาษี

## 2. Backlog พร้อมส่งเข้าระบบงาน

| Ticket | งาน | Dependency | Acceptance / Done | เจ้าของตรวจรับ |
| --- | --- | --- | --- | --- |
| ERP-001 | ตรวจ baseline DB บน authorized clone | backup/access | schema/types/FKs/defaults/data migration effects เทียบได้; ไม่ blind resolve | Tech + Ops |
| ERP-002 | Backup/restore/monitoring จริง | ERP-001 | restore DB+documents+triggers สำเร็จ มี checksum/เวลา/ผู้ตรวจ; UI ไม่แสดง mock verified | Ops + Owner |
| ERP-003 | ปิด IAM/session/scope activation/reset gaps | baseline | active/expired/revoked/cross-org/field tests; office/site login regression ผ่าน | Security + QA |
| ERP-004 | แก้ payroll demo calculation | approved HR rules | period-bounded attendance, actual OT, Decimal, YTD tax/SSO versioned; sample reconciliation | HR + Accounting |
| ERP-005 | ข้อมูลบริษัท/สาขา/ทะเบียนภาษี | ERP-003 | เลือก VAT status/effective dates/evidence; branch identity; profile changeไม่แก้ใบเก่า | Tax + Owner |
| ERP-006 | Client/Supplier/Employee tax and bank masters | ERP-005 | identity/branch/effective history, masked fields, dual-approved beneficiary change | Finance + HR |
| ERP-007 | Approval/SoD/delegation engine | ERP-003/005 | amount/context authority, creator!=approver, snapshot/version bound, audit | Owner + Security |
| ERP-008 | Document sequence/storage/version | ERP-005 | concurrent number allocation, void history, private immutable artifacts, authorized download | Accounting + QA |
| ERP-009 | COA/year/period/mappings | ERP-005 | reviewed chart, reporting map, nonoverlap periods/account validity and close controls | Accounting |
| ERP-010 | Journal/GL/reversal/report engine | ERP-007/009 | balanced posting/immutable posted/closed-period rejection/source dedupe; trial balance | Accounting + QA |
| ERP-011 | SKU/UOM/warehouse/legacy mapping CRUD | ERP-003/005 | preview SKU variants; leading zeros; UOM/effective conversions; scoped Thai UI | Warehouse |
| ERP-012 | Requisition lifecycle/acknowledgement | ERP-007/011 | create/submit/review/approve/partial issue/receive/cancel, no double stock decrement | Site + Warehouse |
| ERP-013 | Stock reservations/count/transit/returns | ERP-012 | available vs on-hand, stale count, partial transit receive, supplier/internal return distinctions | Warehouse |
| ERP-014 | Stock→GL / landed-cost bridge | ERP-010/013 | consume inventory.posted once; qty/value/GL reconcile; consumed cost allocation | Warehouse + Accounting |
| ERP-015 | PR demand/budget approval | ERP-007/011 | linked demand allocation, duplicate request guard, authorized emergency route | Procurement |
| ERP-016 | RFQ/quote/evaluation | ERP-015 | quotes versioned, comparison/evidence, vendor selection approved by policy | Procurement + Owner |
| ERP-017 | PO / Work contract / change order | ERP-007/008/016 | approved revision, lines classify goods/service, milestones/retention/send log | Procurement |
| ERP-018 | Inbound inspection / service acceptance | ERP-017/012 | partial accept/reject; approved goods→GR; services→acceptance, no phantom stock | Inspector + Site |
| ERP-019 | Supplier invoice / matching / AP | ERP-010/018 | duplicate invoice guard, PO/GR/service match, overbilling exceptions, approved AP | AP + Accounting |
| ERP-020 | Vendor billing / payment request | ERP-019/007 | billing evidence, due schedule, multi-invoice partial allocation/advances/retention | Finance |
| ERP-021 | Customer order / contract rates / SLA | ERP-006/007 | approved customer order and effective commercial pricing | Sales + Operations |
| ERP-022 | Service evidence → billing calculation | ERP-004/021 | approved headcount/OT/holiday/deduction sources; client period and payroll period independent | Operations + Billing |
| ERP-023 | Invoice / tax document / credit-debit | ERP-008/010/022 + tax contract | no unapproved issue; immutable snapshot, concurrent numbers, capped credit/reversal | Billing + Tax |
| ERP-024 | Customer billing / collections / AR | ERP-023 | billing acknowledgement, multiple/partial receipts, unallocated cash, aging, WHT certificate follow-up | AR + Finance |
| ERP-025 | Bank/payments/statements/reconcile | ERP-006/020/024 | maker/checker/releaser, transaction results, timeout UNKNOWN, no duplicate release, split-match | Finance + QA |
| ERP-026 | Tax rules/points/events/registers | ERP-005/006/010 | approved effective rules, no ambiguous fallback, recoverable/nonrecoverable VAT, WHT/CIT classifications | Tax + Accounting |
| ERP-027 | WHT certificate issuing/receiving | ERP-025/026 | domestic/foreign/form selection review, partial/gross-up cases, original/replacement/e-WHT dedupe | Tax |
| ERP-028 | VAT/WHT return snapshot/reconciliation | ERP-026/027 | source provenance, branch/group totals, locked approved versions, credit/claim exceptions | Tax + Approver |
| ERP-029 | Tax calendar/due-date engine | ERP-005/026 | form/channel/fiscal/holiday/extension evidence, original/effective dates, alerts | Tax |
| ERP-030 | Assisted export/filing/evidence | ERP-028/029 | official-format validation, user submission evidence, accepted/payment states distinct, amendment trace | Tax + QA |
| ERP-031 | RD/provider API/e-WHT/e-Tax/e-Stamp | ERP-030 + approved credentials | per-form capability, sandbox proof, timeout polling, callback verification/deduplication | Integrations + Tax |
| ERP-032 | Tax payment and GL reconcile | ERP-025/028 | official liability/payin, payment evidence, no double liability/payment posting | Tax + Treasury |
| ERP-033 | CIT/foreign/stamp computation | ERP-010/026/032 | approved applicability, schedules/treaty/instrument evidence, form/version adapters | Tax + Accountant |
| ERP-034 | Payroll/SSO/year-end adjacent filings | ERP-004/010/025/026 | net-pay/bank/WHT/SSO liabilities reconcile; authority-specific evidence | HR + Accounting |
| ERP-035 | Expense/advances/petty cash/assets | ERP-007/010/025 | authorized claims/clearance, asset cost/depreciation/reversal/book-tax differences | Finance |
| ERP-036 | Controlled master/history imports | ERP-001/005/011 | parse/map/validate/preview/error/confirm/transaction/audit; external links and file hashes handled | Data + Owner |
| ERP-037 | Customer tickets/quality/doc expiry | ERP-021/022 | persistent service issue→inspection/CAPA→approved adjustment; conditional compliance evidence | Operations |
| ERP-038 | Reports/site cost/profit/budget | posted source integrations | no double counting at GR/AP/payment; statement mappings and cross-scope negative tests | Management + Accounting |
| ERP-039 | Workers/inbox/provider observability | all integration contracts | durable claims/retry/DLQ/alert/replay; persisted event not shown as delivered | Ops + Tech |
| ERP-040 | Integrated UAT / migration rehearsal / release | required launch tickets | signed scenarios, restore/rollback, release gates and trained owners | Owner + QA + Ops |
| ERP-041 | Workforce lifecycle/assignment/shift/correction/deployment | ERP-003/006/007 | effective assignments, joining/leaving checklist, correction before payroll freeze, dispatch evidence; foreign-document tracking when applicable | HR + Operations |
| ERP-042 | Employee self-service/mobile/offline/language | ERP-003/004/041 | published payslip privacy, profile/locale/security actions, offline conflict/idempotent sync and real-device tests | HR + QA |
| ERP-043 | Fleet/QHSE/training/maintenance workflows | approved company scope + ERP-007/010 | selected use cases persist/approve/evidence/cost-link; existing read models are not DONE | Operations |
| ERP-044 | Data protection/retention/export controls | ERP-003/006/008 | classified fields, masked views, purpose/consent where applicable, audited export, retention/legal hold and deletion controls | Security + Owner |

รายการนี้เป็น 44 delivery tickets/epics ที่มีขนาดต่างกัน ต้องแตก implementation tasks หลัง business review; ไม่ใช้จำนวน ticket ประมาณระยะเวลาโครงการโดยตรง

## 3. API contracts ที่เสนอ — ยังไม่สร้าง route

ทุก read ใช้ organization/branch/resource scope ใน DB ก่อน count/page; ทุก command validate runtime schema, session DB state, permission, SoD, expectedVersion และ idempotency key; server-derived actor/approver เท่านั้น

| API family | Commands / queries |
| --- | --- |
| /api/erp/organizations/:orgId/branches | list/create/update effective master; tax profile create/review/approve versions |
| /api/procurement/requisitions | create/edit draft/submit/review/approve/reject/cancel; demand/budget preview |
| /api/procurement/rfqs, quotations, orders | supplier request, quotation revision/evaluation, approved PO/send/change-order |
| /api/receiving/deliveries, inspections, service-acceptances | custody/inspection/approve/post/reject/return with evidence |
| /api/inventory/requisitions, transfers, counts | scoped document commands invoking existing posting services; acknowledgement separate |
| /api/finance/supplier-invoices, vendor-billings | match/exception/review/post and billing submission |
| /api/sales/orders, billing-calculations, invoices | approved source pricing, review/issue/credit/debit and delivery |
| /api/finance/receipts, payments, bank-statements | allocation/approval/release/result/reconcile; external release explicit privileged command |
| /api/accounting/accounts, periods, journals, reports | scoped master, draft/review/approve/post/reverse/close; date-bounded GL/trial balance |
| /api/tax/rules, registers, certificates | rule versions and approved classifications; safe evidence/download/export |
| /api/tax/returns/:id | validate/review/approve/export/create submission attempt/import official evidence/reconcile/amend |
| /api/integrations/.../events | authenticated provider inbox; verify signature/identity/deduplicate before applying |

HTTP errors: 401 session, 403 forbidden, non-leaking 404 scoped resource, 409 version/idempotency/period conflict, 422 business validation; unexpected error sanitized and logged with requestId มี pagination limits/cursor และ Decimal strings ใน response

## 4. Permission / SoD matrix

| Work | ตัวอย่างสิทธิ์แยก | ข้อกำหนด |
| --- | --- | --- |
| Masters | company.read/manage, tax.profile.read/manage/approve, supplier.bank.manage/approve | maker/checker สำหรับ changes ที่กระทบ fiscal/payment facts |
| Purchase | procurement.pr.create/approve, rfq.manage, po.approve/send | creator != final approver; approval on exact revision/amount |
| Receiving | receiving.record/inspect/approve/post, service.accept/approve | หลักฐานผู้ตรวจรับ; inspect role กับ final authority ตาม policy |
| Inventory | inventory.receive/issue/transfer/return/adjust, requisition.approve | คง strict P3 scoped grants; central warehouse ไม่ได้มาจาก arbitrary site grant |
| Finance | ap.post, ar.allocate, payment.prepare/approve/release/reconcile | preparer != final approver; verified beneficiary snapshot; release/reconcile roles แยก |
| Accounting | accounting.journal.prepare/review/approve/post/reverse, period.close/reopen | preparer != poster, period guard; reopening requires evidence |
| Tax | tax.read/prepare/review/approve/export/submit/payment.reconcile/rules.approve | preparer != final approver; company/group scope; submission/payment independently authorized |
| Sensitive export | employee.tax.read, payroll.export, tax.pii.export, audit.read | field masking, export purpose/audit, private evidence links |

Scope permissions ของ P3 ไม่ถูกยกเป็นทั้งองค์กรสำหรับบัญชี/ภาษีโดยอัตโนมัติ การยื่นรวมสาขาต้องมีสิทธิ์ต่อ filing group ทั้งชุด ไม่ใช้สิทธิ์ไซต์เดียวเพื่ออ่านข้อมูลสาขาอื่น

## 5. Integrated UAT scenarios

| Case | Expected invariant |
| --- | --- |
| U01 VAT registration effective date | ก่อน/หลังวันที่มีผลใช้ profile ต่างกัน; ใบเก่าคง snapshots; inappropriate branch override ถูกปฏิเสธ |
| U02 goods purchase | test fixture: 10 units × 100, recoverable VAT 70; GR stock value 1,000/GRNI; AP 1,070; payment does not debit inventory/expense again |
| U03 partial QC/reject/vendor return | accepted stock ≤ delivered; rejected not available; accepted supplier return links stock/AP/tax correction without pretending internal RETURN |
| U04 service subcontract | acceptance/GRNI or expense policy → AP → retention/WHT/payment; no inventory generated for service |
| U05 billing service | fixed/headcount/OT/holiday/deduction from approved contract + attendance; customer billing and payroll rules differ intentionally |
| U06 customer receipt with WHT | assumed approved test rule: AR 10,700 cleared by bank 10,400 + WHT credit 300; no phantom bank receipt |
| U07 supplier payment with WHT | assumed approved test rule: AP 10,700 cleared by bank 10,400 + WHT payable 300; remittance clears WHT once |
| U08 stock issue/transfer/landed cost | ledger qty/value matches balances and GL; consumed vs remaining stock cost split correct; concurrent issue cannot overspend |
| U09 VAT return | eligible input/output/credit adjustments agree register↔return↔GL; nonclaimable VAT not used as tax credit |
| U10 return amendment | accepted original snapshot immutable; additional version has correct form-specific amounts and no duplicate inclusion/payment |
| U11 external submit timeout | unknown result reconciled by same request ref; no blind second filing; invalid/duplicate/out-of-order provider events handled |
| U12 payment | partial/failed/timeout/duplicate bank response; confirmed amount and payin identity match; no premature PAID |
| U13 periods and reversal | closed period rejects ordinary posting; reversal/forward correction retains original GL source and correct net balance |
| U14 payroll | actual period attendance/OT, no fallback 20 hours/1% tax; employee YTD/SSO/net bank totals reconcile |
| U15 security | cross-company/branch/field deny, actor spoofing, creator approves own document, expired delegation/session, CSRF mutation cases |
| U16 import | revised workbook ranges/external links/ambiguous names/SKU variants previewed; critical errors block confirm; retry doesn't duplicate |
| U17 restore/cutover | restore DB+private documents+trigger protections; control totals and operational rollback pass on staging |
| U18 reports | AR/AP/stock/GL/tax/cash/site profit trace to source; GR/AP/payment do not count the same cost three times |

ตัวเลขใน UAT เป็น synthetic fixtures เพื่อพิสูจน์ระบบ ไม่ใช่อัตราภาษีที่รับรองว่าใช้กับทุกธุรกรรมบริษัท

## 6. Release gates และสิ่งที่ไม่อ้างว่าเสร็จแล้ว

implementation release ต้องผ่าน prisma validate/generate/migrate status, typecheck, unit/domain, integration บน isolated DB, route check, production build และ Playwright workflow tests ที่ตรง scope พร้อม staging engine/provider validation และ approved business reconciliation

งานออกแบบ/สแกนรอบนี้ไม่เปลี่ยน application/schema/migrations จึงตรวจเฉพาะ source evidence, scanner output/privacy, Markdown links/fences, ticket traceability และ git diff; ไม่ใช้ผล tests ของ commit ก่อนหน้าเป็น PASS ใหม่ในรอบนี้

ยังต้องมีข้อมูลบริษัทที่ยืนยันได้, restored baseline, approved tax/payroll/billing rules, private provider registrations และ UAT owners ก่อนเปิด production ไม่ใส่ credentials/source workbooks/dumps ลง Git ไม่ auto merge/deploy/ยื่น/จ่ายจากเอกสารแผน

## 7. Definition of Done ต่อ ticket

Source evidence + business acceptance + schema/backfill/rollback + command/state/SoD/scope + audit/idempotency + negative/concurrency tests + Thai UX/error states + release evidence ต้องครบตามชนิดงาน Label DONE แปลว่า use case ที่ระบุทำงานได้ตามเกณฑ์ ไม่ใช่มี model/page หรือผ่าน build อย่างเดียว

Product owner บริษัทกำหนด launch scope; Warehouse/Procurement/Operations/HR/Finance/Accountant/Tax specialist ลงนามตามงานของตน Tech/QA/Ops รับผิดชอบหลักฐานเทคนิคและการกู้คืน กำหนด effort/date หลังแยก ticket และทบทวนข้อมูลจริง ไม่ตั้งวัน go-live จากจำนวนเมนู
