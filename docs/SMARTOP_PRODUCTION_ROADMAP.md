# SmartOP — แผนพัฒนาจากระบบเดิมสู่ Production

วันที่ 21 พฤศจิกายน 2026 · แผนงานเสนอใหม่ · ยังไม่มี phase ที่รับรองผ่านจากเอกสารนี้

เริ่มอ่านที่ `SMARTOP_PROJECT_ARCHITECTURE.md` และ `SMARTOP_P3_COMPANY_WORKBOOK_MAPPING.md` ใช้ phase naming P0–P8 ตาม implementation plan ที่ผู้ใช้ให้ ไม่เปลี่ยนชื่อ phase ไปตาม backlog เก่า

## 1. วิธีเดินโครงการ

1. ตรวจ baseline และสร้าง backlog จาก source ปัจจุบัน; แยก existing / partial / missing / verified
2. ทำเป็น vertical slice: database → service/rules → permission/scope → API/UI → audit → tests → UAT
3. เปิด PR ขนาด review ได้; ไม่มีการ rewrite โมดูลที่ใช้งานอยู่โดยไม่จำเป็น
4. ใช้ staging ด้วยข้อมูลสังเคราะห์หรือ masked copy ที่ได้รับอนุญาต ทดสอบ migration และ restore ก่อน production
5. gate ผ่านด้วยหลักฐาน commit, command, environment และผลจริง; NOT_RUN/BLOCKED ไม่เท่ากับ PASS
6. deployment เป็นงานแยกหลัง review/UAT และ explicit release authorization; ไม่ merge/deploy อัตโนมัติจากแผนนี้

งาน implementation ที่ผู้ใช้ระบุล่าสุดยังเป็น P3; แผนทั้งระบบนี้ไม่เปิด scope ให้เขียนทุกโมดูลพร้อมกัน P0 gaps ที่กระทบสิทธิ์ P3 ให้ทำเป็น dependency ที่เล็กและทดสอบ regression ส่วน P0 อื่นจัด backlog แยก

## 2. Phase และเกณฑ์ผ่าน

| Phase | Deliverable | Dependency | Exit gate / หลักฐาน |
| --- | --- | --- | --- |
| P0 Foundation | environment/secrets, local email/site auth, activation/reset, password policy, DB sessions, RBAC/scopes, audit, route guards, backup baseline | architecture decisions | security positive/negative cases, revoke/expiry, no cross-scope exposure, restore drill และ runtime smoke ผ่าน |
| P1 Employee & Site | Client/contact/site, employee/assignments, shift, deployment, sensitive fields, master aliases | IAM guards | sample source mapping, duplicate checks, scoped CRUD/import preview และบริษัทตรวจรับ |
| P2 Attendance & Payroll | correction approval, periods, configurable components/policies, payroll review/finalize/publication | P1 + approved rule matrix | attendance/payroll reconciliation ตามตัวอย่างที่ตกลง, SoD และ published payslip privacy ผ่าน |
| P3 Warehouse / Materials | SKU/UOM/category/prices, warehouse/location, ledger/WAC, requisition, transfer, adjustment, site report | P0 scoped access + approved Site/Project masters | stock/value reconcile, concurrent issue, idempotency, creator != approver, source expense comparison และ UAT ผ่าน |
| P4 Procurement | supplier/contact/catalog, PR/RFQ/quote/PO, goods receipt และ matching | P3 receiving contract | approve PO → partial GR → inventory exactly once; reject over-receipt/unauthorized approval |
| P5 Billing / AR | billing profile, invoice lifecycle/sequence, PDF, email log, billing note, credit, receipt allocation/aging | P1 Client/Contract + service evidence | approved sample documents, concurrent numbering, partial/multi-invoice receipts, aging boundary tests |
| P6 Accounting | COA/period/rules, journal/GL, source posting, reversal, AP/payment integration | agreed source contracts from P2–P5 | debit=credit, closed-period rejection, duplicate-post guard, immutable posted journal, trial balance reconciliation |
| P7 Analytics | site/project profitability, payroll/material costs, AR aging, budget variance | reconciled ledgers | reports trace to source, as-of/currency/scope tests; no duplicate counting |
| P8 UAT / Cutover | controlled migration, restore, load/security/UAT, training, release/rollback runbook | required launch modules pass | signed UAT, restore evidence, launch checklist, monitoring/on-call, release approval |

P3 เริ่มก่อน P2 ได้ถ้าข้อมูล master และ access guard ที่ต้องใช้พร้อม แต่ยังห้ามเปิด production เพราะ phase อื่นยังไม่ผ่าน ตรวจ accounting source/event contract ตั้งแต่ P3 เพื่อไม่ต้องแก้ ledger ย้อนหลังเมื่อถึง P6

## 3. Backlog แรกที่ลงมือได้

| ID | งาน | Done เมื่อ |
| --- | --- | --- |
| DEV-001 | เก็บ baseline test/typecheck/build/schema/migration status | log ผูก commit และ environment; ระบุ failure จริง |
| DEV-002 | อ่านมาตรฐานเดิมเมื่อได้รับและเทียบข้อเสนอนี้ | มี decision record ของข้อแตกต่าง; ไม่อ้างเอกสารที่ยังไม่เห็น |
| SEC-001 | shared server page/API session + scoped inventory guard | inactive/revoked/cross-site/role-scope mixing tests ผ่าน |
| OPS-001 | production secrets และ migration release ordering | ไม่มี fallback AUTH_SECRET; app ใช้ migrated schema; failure หยุด release |
| INV-001 | อนุมัติ SKU/UOM/site alias และ valuation policy | mapping preview + decision records; ไม่มีการเดารหัสสินค้าจาก blank cells |
| INV-002 | additive inventory schema และ legacy bridge | migration บน test clone ผ่าน, counts/checksums เทียบก่อนหลัง |
| INV-003 | receipt/issue/return/transfer ledger | atomic stock/value updates + concurrency/idempotency tests ผ่าน |
| INV-004 | requisition + approval + partial issuance | transition matrix และ SoD ทดสอบทุก endpoint |
| INV-005 | stock adjustment approval | audit/reason/reversal และ separate approver บังคับ server |
| INV-006 | Thai UI และ site/category consumption | scoped search/pagination/actions, mobile empty/error states และ E2E |
| IMP-001 | material/site historical import adapter | preview/errors/confirm/hash/idempotent transaction; no production writes before confirm |
| INV-007 | P3 reconciliation/UAT | ตัวอย่างปริมาณ มูลค่า โอน คืน และยอดรายไซต์ที่บริษัทลงนามรับรอง |

## 4. หนึ่ง development ticket ต้องมีอะไร

- ปัญหา/ผู้ใช้/trigger และ expected result
- in scope/out of scope, source reference และ assumption ที่ต้องยืนยัน
- schema/migration/backfill/rollback impact
- permission, resource scope, field protection และ SoD
- state transitions, validation, idempotency/concurrency และ audit events
- UI/API contract พร้อม error codes; input ไม่รับ actor/approver จาก client แบบเชื่อถือได้
- acceptance cases ปกติ/ผิดสิทธิ์/ขอบเขตผิด/ข้อมูลผิด/retry/concurrent request
- test evidence, UAT owner และ release flag

## 5. Git / CI / PR

ใช้ branch ปัจจุบัน `feature/production-erp-foundation` สำหรับงานที่อนุมัติอยู่ หากแยกงานใหม่ใช้ `codex/<module>-<change>` ยกเว้นผู้ใช้กำหนดชื่อ branch อื่น ห้าม force push/main auto merge และห้ามรวม unrelated working tree changes

Logical commits เช่น `feat(inventory): add scoped stock ledger`, `test(inventory): verify concurrent issuance`, `docs: record P3 release evidence` ตรวจ staged diff ว่าไม่มี .env, credentials, dumps หรือ workbook บริษัท

เป้าหมาย CI ที่ยังต้องเพิ่ม/ตรวจ: install จาก lockfile → schema validate/generate → typecheck → unit → integration test DB/migrations → route check → production build → Playwright staging smoke; เฉพาะ deploy job ที่อนุมัติจึงใช้ production secrets

## 6. Quality gates และ environment

คำสั่งสำหรับ implementation release; ตรวจ target DB ก่อนคำสั่งที่เชื่อมต่อ DB ทุกครั้ง ไม่แสดง connection string ใน log

```text
npx prisma validate
npx prisma generate
npx prisma migrate status
npm run typecheck
npm run test
npm run check:routes
npm run build
```

เพิ่ม integration tests ที่ใช้ isolated MySQL test DB และ Playwright เมื่อมี config/spec ที่ทำงานจริง `scripts/demo-smoke-test.ts` ปัจจุบันเป็น static route audit ไม่ใช่ browser test คำสั่ง build ผ่านไม่ได้พิสูจน์ session/provider/DB runtime และ migrate status ไม่ใช่การตรวจ schema drift ทั้งหมด

สำหรับ docs-only change ตรวจ Markdown links, factual source references และ diff; ไม่เรียก production migration หรืออ้างว่า application gates ผ่านใหม่

## 7. Database migration strategy

1. ระบุ DB environment/version, current migration history และ known failed migration ด้วย read-only inspection
2. สำรองและ restore ไป isolated test; เปรียบเทียบ schema จริงกับ migration history ห้ามแก้ applied migration เดิม
3. สร้าง additive tables/nullable columns และ indices/FK หลังตรวจ duplicate/orphan data
4. backfill เป็น batch ที่ resume/idempotent ได้ เก็บ counts และ mapping; ไม่สร้าง opening balance จาก historical issue โดยเดา
5. deploy code ที่อ่านของเดิมและใหม่ได้; เปลี่ยน write path แบบ controlled cutover หลีกเลี่ยง dual write นอก transaction
6. reconcile แล้วค่อย enforce NOT NULL/unique และถอน legacy ใน release ภายหลัง
7. apply reviewed migrations ด้วย `npx prisma migrate deploy` บน staging ก่อน production; ห้าม db push/reset/drop/truncate

rollback ปกติคือคืน application image ที่ compatible กับ additive schema; อย่าลบตารางใหม่เพื่อย้อนระบบ หากเปิดใช้ ledger แล้วห้าม rollback ไป code ที่เขียน stockBalance ตรง ๆ หยุด write path และใช้ audited correction/forward fix ก่อน restore เฉพาะเมื่อมีแผนรับมือธุรกรรมหลัง backup และการอนุมัติ

## 8. Production release / cutover

| ขั้น | สิ่งที่ต้องมี |
| --- | --- |
| ก่อน release | fixed commit/image, reviewed migration, staging evidence, signed business rules/UAT, backup+restore proof, owner/on-call |
| เตรียมระบบ | HTTPS, mandatory secrets, private DB/storage, least-privilege DB users, production demo mode off, log redaction |
| Deploy | migration job สำเร็จก่อน app release, health/readiness แยก, worker version compatible, smoke ด้วยบัญชีจำกัดสิทธิ์ |
| Import/cutover | ตกลงเวลาหยุดแก้ Excel, final approved file hash, validate/preview/confirm/import, counts and balances signed off |
| หลังเปิด | เฝ้าดู error/latency/DB locks/outbox backlog/delivery failure/reconciliation mismatch; เกณฑ์ rollback ระบุใน release ticket |
| Handover | คู่มือผู้ใช้/ผู้ดูแล, user provisioning/revoke, backup schedule/retention, restore runbook และผู้รับผิดชอบ |

ต้องซ้อมบน staging: deploy migration failure, revoked-session denial, worker retry, duplicate submit, unavailable email/storage และ DB recovery ไม่มี mock green status ทดแทนหลักฐาน

## 9. Definition of production-ready

- core workflows ที่อยู่ใน launch scope ทำครบ end-to-end และไม่มี mock success
- authorization/PII/SoD ผ่าน negative tests และ runtime checks
- financial/stock/payroll totals เทียบข้อมูลตัวอย่างที่อนุมัติแล้วผ่าน
- migration/backfill/import/restore/rollback ซ้อมได้จริง
- monitoring/alerts/runbook และเจ้าของการปฏิบัติงานพร้อม
- required gates ผ่านที่ release commit; business owner ลงนาม UAT และอนุมัติ go-live

ยังไม่กำหนดวัน go-live: ต้องจบ baseline, ตัดสิน business rules และประเมินแต่ละ ticket ก่อน ระยะเวลาที่ไม่มีข้อมูล capacity/UAT/provider จะเป็นการคาดเดา
