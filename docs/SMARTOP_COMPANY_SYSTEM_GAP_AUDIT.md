# SmartOP — ผลสแกนระบบที่ต้องทำเพิ่มเพื่อส่งมอบบริษัทครบวงจร

วันที่ 22 พฤศจิกายน 2026 · Source baseline `2d19540878ed6ff947ae87ac97e24c481c078467`

## 1. ขอบเขตและวิธีตรวจ

ตรวจ schema/API/services/current source และรายงานใน repository เทียบกับไฟล์พนักงานและใบเบิกวัสดุที่ผู้ใช้แนบ รวม implementation plan ที่ให้มา เป็น static/source และ workbook-structure audit ไม่ใช่การรับรอง production, database introspection, legal compliance หรือ UAT ใหม่

ใช้ `scripts/audit-company-workbooks.py` อ่าน ZIP/XML ของ XLSX แบบ read-only สแกนทุก worksheet โดยไม่แก้ไฟล์ ไม่ดึง external links ไม่คำนวณสูตรใหม่ และไม่พิมพ์/เก็บรายชื่อ เลขบัตร บัญชีธนาคาร เงินเดือนรายคน ค่าเซลล์ หรือ raw formulas ลงรายงาน Summary ที่ละเอียดอยู่ใน ignored `tmp/company-workbook-structure.json`; มีเฉพาะ role/range/counts

รายงานเดิม `CUSTOMER_EXCEL_ANALYSIS.md` อ้าง workbook อีกชื่อ/เวอร์ชัน และบางช่วงข้อมูลต่างจากไฟล์แนบปัจจุบัน จึงไม่ใช้จำนวนแถวเก่าเป็นจำนวนพนักงาน/ลูกค้า ไม่ถือคำว่า FULL_CRUD/READY ในรายงาน demo เก่าเป็นหลักฐานว่า workflow production ครบ

## 2. หลักฐานจากไฟล์บริษัทปัจจุบัน

| Source | ผลตรวจโครงสร้าง | ความหมายสำหรับระบบ |
| --- | --- | --- |
| Workbook พนักงาน | 12 worksheets, 1,082 formula cells; มี external-link parts | ต้องแยก HR/attendance/payroll/customer/billing/invoice/dispatch; ตรวจสูตรที่อ้างไฟล์อื่นก่อนนำเข้า |
| Employee master | sheet 1, A1:S155, 153 formula cells | ช่วง worksheet ไม่ใช่จำนวนพนักงานที่ยืนยันแล้ว; ต้อง validate business keys |
| Access/staff reference | sheet 2, A2:K15 | permission/approval ต้อง normalize ไม่ย้ายเป็นสิทธิ์จากชื่อ worksheet |
| Site/code reference | sheet 3, A1:I40 | master aliases/customer-site mapping ต้องทบทวน |
| Shift reference | sheet 4, A2:H49 | เวลาและ OT ต่างกันตามไซต์/กลุ่มงาน |
| Payroll | sheet 5, A1:AG159, 872 formula cells | ต้องมี signed payroll rule matrix; cached totals อย่างเดียวไม่พอ |
| Attendance / payslip | sheets 6/7, A1:AH34 และ A1:P24 | layout รายงานไม่ใช่ตาราง transaction พร้อม import |
| Customer | sheet 8, A2:K47 | เวอร์ชันนี้กว้าง/ยาวกว่ารายงานเดิม; customer/contact/billing profile ต้องสแกนและ map ใหม่ |
| Billing / invoice | sheets 9/10, A1:O44 และ A1:S55 | มีตัวอย่างเอกสารจริง ต้องมี numbering/lifecycle/AR ไม่ใช่ print อย่างเดียว |
| Other document / deployment | sheets 11/12, A1:K50 และ A1:AD38 | sheet 11 ยังต้องยืนยันชนิดเอกสาร; dispatch มี output template ที่ต้องเชื่อม employee assignment |
| Workbook วัสดุ | 38 worksheets, 9,511 formula cells; ไม่มี external-link parts ที่ตรวจพบ | 3 requisition templates, 1 price master, 1 summary, 33 site-specific/other forms; ไม่ใช่ 33 sites ที่ยืนยันแล้วโดยอัตโนมัติ |
| Material price master | sheet 4, A1:Z62; 53 priced descriptions มี code และ 12 priced descriptions ไม่มี code ตามวิธีนับที่ระบุใน scanner | 12 รายการเป็น candidate ที่ต้องตรวจ variant/mapping ไม่สรุปว่าเป็น 12 SKU ใหม่แน่นอน |
| Consumption summary | sheet 5, A1:G40, 170 formula cells | รายงานรายไซต์/หมวด/เดือนต้อง reconcile กับ transaction และ source expense snapshot |

ไม่พบ cached error tokens ที่รองรับในทั้งสองไฟล์ แต่ไม่ได้ recalculate จึงไม่ใช่ผลยืนยันว่าสูตรและ business rules ถูกต้องหรือข้อมูลเป็นปัจจุบัน

## 3. Findings สำคัญที่ยืนยันจาก source

1. **Payroll ยังเป็น production blocker:** `src/server/services/payroll.service.ts` อ่าน attendance ที่ approved โดยไม่จำกัดวันที่ตาม period ใน query, มี workedDays fallback 26, OT hours = 20 และคำนวณภาษีด้วย 1% ตายตัว ต้องเปลี่ยนเป็นข้อมูลจริง/กฎอนุมัติ ไม่ควรเชื่อมยอดนี้เข้า ภ.ง.ด.1/GL ทันที
2. **ยังไม่มีบัญชีคู่/ภาษีใน schema:** ไม่พบ ChartOfAccount, AccountingPeriod, JournalEntry/Line, GeneralLedger หรือ tax-return/register models ใน 102-model source ปัจจุบัน
3. **P3 เป็น internal service ที่ทดสอบแล้ว:** มี WAC/stock posting/scoped authorization และ transaction tests แต่ยังไม่มี document approval/create/receive UI/API ครบ และยังไม่ post GL หรือยื่นภาษี
4. **การจัดซื้อ/การเงินยังเป็น schema/read foundation หลายส่วน:** พบ Supplier/PR/RFQ/PO/GR/Invoice/Receipt/Payment models แต่ไม่พบ dedicated full mutation/approval/payment matching endpoints ใน API tree ที่ตรวจ ไม่ถือว่ามีหน้าแล้วจบงาน
5. **Backup มี script แต่หน้าไม่ใช่หลักฐาน:** `scripts/backup-db.sh` มี dump/gzip validation และเก็บ triggers/routines ขณะที่หน้า backups ใช้ hard-coded SUCCESS/verified rows; ยังไม่มี restore evidence ที่ตรวจในรอบนี้
6. **Import มี analyze แต่ไม่ครบ migration:** มี analyze endpoint/ImportJob และ employee import path แต่ยังไม่พบครบ unified map/validate/preview/confirm/transaction/report pipeline ทุกประเภท
7. **รายงาน readiness ขัดกัน:** `crud-coverage-matrix.md` ระบุบางโมดูล FULL_CRUD แต่รายงาน audit อีกฉบับระบุ PARTIAL และ current source ไม่ยืนยันครบ ให้ยึด command/workflow tests ที่ current release มากกว่าป้ายสถานะ

## 4. Matrix 48 ประเด็นที่ต้องติดตาม

Status: PARTIAL = มีบางส่วน; NOT_FOUND = ยังไม่พบส่วนที่ระบุใน source ที่ตรวจ; INTERNAL_TESTED = backend ภายในมีหลักฐานทดสอบก่อนหน้าแต่ยังไม่ใช่ E2E ลูกค้า; DEMO_ONLY = สถานะแสดงผลจำลอง; NOT_VERIFIED = ยังไม่มีหลักฐาน operational; CONDITIONAL = ต้องยืนยันความจำเป็นกับบริษัท

| ID | ระบบ/ช่องว่าง | หลักฐานปัจจุบัน | Status | ความสำคัญ / งานที่ต้องทำ |
| --- | --- | --- | --- | --- |
| G01 | บริษัท/สาขา/ทะเบียน VAT | Organization มี taxId แต่ไม่มี branch/tax profile version | NOT_FOUND | HIGH: master และ effective dates ก่อนภาษีจริง |
| G02 | ลูกค้า/ผู้ขาย/ผู้ติดต่อ/ธนาคารคู่ค้า | Client/Supplier/ClientContact; dedicated full CRUD/verification ยังไม่ยืนยัน | PARTIAL | HIGH: scoped masters, duplicate review และ approved bank changes |
| G03 | activation/reset/password policy production | local login/Argon2id/PIN/session มี; one-time email activation/reset endpoints ยังไม่พบ | PARTIAL | CRITICAL: ปิด P0 gaps ก่อนลูกค้า production |
| G04 | สิทธิ์รายบริษัท/ไซต์/ฟิลด์ | RBAC มี; legacy role fallback ยังอยู่ใน central authorization; inventory ใหม่แยก strict guard | PARTIAL | CRITICAL: inventory guard ไม่ทำให้ทุกโมดูลปลอดภัยอัตโนมัติ |
| G05 | ประวัติ/ข้อมูลลับพนักงาน | Employee CRUD และ serializers มี; field-level/privacy review ยังไม่ครบ | PARTIAL | HIGH: identity/bank/effective assignment/privacy tests |
| G06 | รับเข้า/พ้นสภาพ/คืนทรัพย์สินพนักงาน | employee master มี; onboarding/offboarding checklist ยังไม่ครบ | PARTIAL | HIGH: คืนชุด/เครื่องมือ/revoke/access/final payroll; recruitment เป็น optional extension |
| G07 | เอกสารแรงงานต่างชาติ/อายุเอกสาร | nationality reference มี; ยังไม่มีหลักฐาน requirement งานอนุญาตจริง | CONDITIONAL | MEDIUM: เปิดเมื่อมีลูกจ้าง/เอกสารที่ต้องติดตามจริง |
| G08 | สัญญาลูกค้าและกำลังคนตามสัญญา | Contract/Project/WorkOrder schema; ขาด approved service-rate/headcount schedule | PARTIAL | HIGH: demand vs deployed vs billable manpower |
| G09 | กะ/ตาราง/OT/หยุด/ลา | Shift/Attendance/Leave APIs มี; policy reconciliation/E2E ยังไม่ยืนยัน | PARTIAL | HIGH: rules ตามไซต์และข้ามเที่ยงคืน |
| G10 | ขอแก้เวลาและอนุมัติ | attendance approval มี; correction request/version/evidence ยังไม่ครบ | PARTIAL | HIGH: ป้องกันแก้เวลาหลัง payroll/billing freeze |
| G11 | Payroll จาก period จริง | service มี hard-coded values และ query attendance ไม่ bound period | PARTIAL | CRITICAL: เปลี่ยน calculation ก่อนใช้จ่ายเงินจริง |
| G12 | Payroll review/finalize/tax/SSO | policy/period models; maker/checker/tax YTD/SSO exports ยังไม่ครบ | PARTIAL | CRITICAL: ภาษี/ประกันสังคมและยอดจ่ายตรงกัน |
| G13 | Payslip ที่อนุมัติและเผยแพร่ | template/page มี; publication lifecycle/evidence ต้องเพิ่ม | PARTIAL | HIGH: privacy และ final version |
| G14 | ใบส่งตัว/ย้ายไซต์/ผู้รับรอง | EmployeeDeployment model; dispatch GET อ่านข้อมูล | PARTIAL | HIGH: effective date approval/generated document |
| G15 | CRM/เสนอราคา/สัญญาและต่ออายุ | models/pages มี; version/approval/renewal workflow ยังไม่ครบ | PARTIAL | HIGH: approved commercial terms ก่อนวางบิล |
| G16 | คำสั่งซื้อจากลูกค้า | ไม่พบ CustomerSalesOrder | NOT_FOUND | HIGH: แยกจาก PO ผู้ขาย |
| G17 | ตรวจรับบริการลูกค้า/ข้อร้องเรียน/SLA | ไม่มีครบ approved service evidence → billing/dispute chain | NOT_FOUND | HIGH: source ของรายได้และการหักขาดกำลังคน |
| G18 | คำนวณค่าบริการรายสัญญา/ไซต์ | Excel มีตัวอย่าง; BillingCalculation/Rate versions ไม่พบ | NOT_FOUND | HIGH: fixed/headcount/OT/holiday/deductions |
| G19 | Invoice/TaxInvoice/credit/debit lifecycle | Invoice schema เดิม; tax document/number sequence/credit engine ไม่ครบ | PARTIAL | HIGH: ไม่รวมความหมายเอกสารทั้งหมดเป็น invoice เดียว |
| G20 | วางบิลลูกค้า/รับวางบิล | ตัวอย่าง billing note ในไฟล์; normalized BillingNote workflow ยังไม่พบ | NOT_FOUND | HIGH: วางบิลไม่สร้างลูกหนี้ซ้ำ |
| G21 | AR รับบางส่วน/หลายใบ/WHT ถูกหัก | Receipt ผูก invoiceId เดียว | PARTIAL | HIGH: allocations/unallocated/aging/certificates |
| G22 | PR/RFQ/เปรียบเทียบราคา/PO | purchasing schema/read pages มี; full approval/send/change-order ยังไม่ครบ | PARTIAL | HIGH: ใช้ legacy names ต่ออย่างปลอดภัย |
| G23 | จัดจ้าง/BOQ/milestone/retention | service acceptance/contract progression ยังไม่ครบ | NOT_FOUND | HIGH: งานจ้างไม่เพิ่ม stock |
| G24 | ตรวจรับสินค้า/QC/รับบางส่วน/ปฏิเสธ | GoodsReceipt accepted lines มี; inspection aggregate/evidence ไม่พบ | PARTIAL | HIGH: pending custody ไม่ใช่ available stock |
| G25 | ใบตรวจรับงานบริการ | ServiceAcceptance ยังไม่พบ | NOT_FOUND | HIGH: PO-service → acceptance → AP |
| G26 | หน้าข้อมูลวัสดุ/คลัง/UOM/variant | P3 models มี; master CRUD/scoped UI ยังไม่ครบ | PARTIAL | HIGH: clean SKU mapping ก่อน import |
| G27 | รับจ่าย/ต้นทุน/โอน/คืนภายใน | inventory-posting.service + valuation + isolated tests | INTERNAL_TESTED | HIGH: ต่อ document workflows/API/UI/GL, ไม่เขียน ledger ซ้ำ |
| G28 | จองของ/transit/คืนผู้ขาย/lot/expiry | ยังไม่พบครบ workflow; supplier return ต่างจาก internal return | PARTIAL | HIGH/MEDIUM: เปิด lot/expiry ตาม product scope |
| G29 | ตรวจ invoice ผู้ขาย/three-way match/รับวางบิล | SupplierInvoice schema; match/billing submission ไม่ครบ | PARTIAL | HIGH: กัน invoice/qty/payment ซ้ำ |
| G30 | เสนอจ่าย/ธนาคาร/statement reconcile | Payment/CashLedger schema; bank confirmation/allocation ไม่ครบ | PARTIAL | CRITICAL: ปล่อยเงินจริงต้อง verified beneficiary/evidence |
| G31 | เงินทดรอง/เบิกค่าใช้จ่าย/เงินสดย่อย | ยังไม่พบ complete aggregates | NOT_FOUND | HIGH: cost/tax/source receipts/clear advances |
| G32 | ผังบัญชี/Journal/GL/ปิดงวด/งบ | models/services ยังไม่พบ | NOT_FOUND | CRITICAL: แกนบัญชีก่อนอ้างงบครบระบบ |
| G33 | สินทรัพย์/ค่าเสื่อม/จำหน่าย | Asset/Assignment/Maintenance มี; depreciation-to-GL ไม่ครบ | PARTIAL | MEDIUM: capitalization and tax/book differences |
| G34 | VAT/WHT registers และ rule versions | ไม่พบ tax engine/register models | NOT_FOUND | CRITICAL: ใช้ข้อมูลจริงและ evidence ไม่อิง rate ตายตัว |
| G35 | จัดทำแบบ/ยื่น/ชำระ/หลักฐาน/เพิ่มเติม | ไม่พบ tax-return/connector/evidence lifecycle | NOT_FOUND | CRITICAL: exported ไม่เท่ากับ accepted/paid |
| G36 | CIT/foreign payment/stamp obligations | ยังไม่มี; ขอบเขตขึ้นกับบริษัท/ธุรกรรม | CONDITIONAL | HIGH: assessment + approved computations/adapters |
| G37 | ประกันสังคม/DBD/งานยื่นหน่วยงานอื่น | ยังไม่มี verified adapters ใน source ที่ตรวจ | NOT_FOUND | HIGH: แยกจาก RD และตรวจ format/version จริง |
| G38 | งบประมาณ/commitment/กำไรไซต์ | Budget/ProjectCost schema; PR→PO→AP→actual bridge ไม่ครบ | PARTIAL | HIGH: ห้ามนับ cost ที่ GR/AP/จ่ายซ้ำ |
| G39 | Fleet/QHSE/Training/maintenance | models/read pages และบาง operational APIs มี | PARTIAL | MEDIUM: เลือก use cases ที่บริษัทใช้; approval/evidence/cost link |
| G40 | Customer support/ticket/service quality | support local state ตาม source/report; no complete ticket persistence | DEMO_ONLY | MEDIUM: ticket→inspection→CAPA→billing dispute |
| G41 | Controlled imports ทั้งบริษัท | analyze + employee import มี; unified staged pipeline ยังไม่ครบ | PARTIAL | CRITICAL: ข้อมูลจริงเข้าระบบต้อง preview/confirm/audit |
| G42 | เอกสาร/เลขที่/version/signature/archive | Document/Audit มี; fiscal sequence/signed delivery/evidence ไม่ครบ | PARTIAL | HIGH: immutable issued files/source hashes |
| G43 | worker/แจ้งเตือน/providers/monitoring | EventOutbox มี; durable worker/operational delivery proof ยังไม่พบ | PARTIAL | HIGH: pending event ไม่ใช่ส่ง/ลงบัญชีสำเร็จ |
| G44 | Backup/restore/DR | backup-db.sh มี; backups UI hard-coded; restore drill ไม่ได้ตรวจ | NOT_VERIFIED | CRITICAL: ต้องซ้อมคืน DB+documents/triggers และเก็บหลักฐานจริง |
| G45 | ข้อมูลส่วนบุคคล/retention/สิทธิ์ export | DLP/masking บางส่วนมี; purpose/retention/export audit ไม่ครบ | PARTIAL | HIGH: จำกัด HR/payroll/tax/bank fields และ legal hold |
| G46 | UAT/E2E/load/CI/release ownership | integration/unit tests มี; full customer browser/operational evidence ไม่ครบ | NOT_VERIFIED | CRITICAL: signed acceptance และ known rollback |
| G47 | พอร์ทัลพนักงาน/offline/ภาษา/บัญชีตนเอง | check-in/history/leave/payslip และภาษา/offline foundation มี | PARTIAL | MEDIUM: publication/locale/security profile/real-device tests |
| G48 | Legacy database baseline | progress ล่าสุดบันทึก migration history/schema drift; รอบนี้ไม่ต่อ production DB | NOT_VERIFIED | CRITICAL: restore authorized clone, compare/reconcile; ห้าม blind migrate/resolve |

## 5. Gap-to-delivery traceability

ตารางนี้ระบุเจ้าของงานสำหรับช่องว่างทุกข้อ ไม่ได้แปลว่าทุกงานเป็น mandatory go-live scope โดยเฉพาะ conditional/optional modules

| Gap | Delivery tickets |
| --- | --- |
| G01 | ERP-005 |
| G02 | ERP-006 |
| G03 | ERP-003 |
| G04 | ERP-003, ERP-007 |
| G05 | ERP-006, ERP-036, ERP-044 |
| G06 | ERP-041 |
| G07 | ERP-041 |
| G08 | ERP-021, ERP-041 |
| G09 | ERP-004, ERP-041 |
| G10 | ERP-041 |
| G11 | ERP-004 |
| G12 | ERP-004, ERP-034 |
| G13 | ERP-004, ERP-042 |
| G14 | ERP-041 |
| G15 | ERP-021 |
| G16 | ERP-021 |
| G17 | ERP-022, ERP-037 |
| G18 | ERP-022 |
| G19 | ERP-008, ERP-023 |
| G20 | ERP-024 |
| G21 | ERP-024 |
| G22 | ERP-015, ERP-016, ERP-017 |
| G23 | ERP-017, ERP-018 |
| G24 | ERP-018 |
| G25 | ERP-018 |
| G26 | ERP-011 |
| G27 | ERP-012, ERP-014 |
| G28 | ERP-013 |
| G29 | ERP-019, ERP-020 |
| G30 | ERP-025 |
| G31 | ERP-035 |
| G32 | ERP-009, ERP-010 |
| G33 | ERP-010, ERP-035 |
| G34 | ERP-026, ERP-027 |
| G35 | ERP-028, ERP-029, ERP-030, ERP-031, ERP-032 |
| G36 | ERP-033 |
| G37 | ERP-010, ERP-034 |
| G38 | ERP-015, ERP-038 |
| G39 | ERP-043 |
| G40 | ERP-037 |
| G41 | ERP-036 |
| G42 | ERP-008 |
| G43 | ERP-039 |
| G44 | ERP-002 |
| G45 | ERP-044 |
| G46 | ERP-040 |
| G47 | ERP-042 |
| G48 | ERP-001 |

## 6. ระบบพ่วงที่ควรเพิ่มโดยผูกกับเหตุการณ์จริง

- **สัญญา/กำลังคน/ตรวจรับลูกค้า**: ใช้ข้อมูลไซต์ กะ และการลงเวลาเป็นหลักฐาน billing และ SLA แทนสรุปยอดจาก spreadsheet โดยไม่มี review
- **เงินทดรอง/expense/petty cash**: ลดการลงค่าใช้จ่ายแทรกใน payroll หรือ cash ledger โดยไม่มีเอกสารและผู้อนุมัติ
- **ทรัพย์สิน/ชุด/PPE/สารเคมี**: รับเข้า–เบิก–ยืมคืน–คืนเมื่อพ้นสภาพ–บำรุงรักษา; lot/expiry/SDS เปิดตามสินค้าที่จำเป็น
- **เอกสารพนักงานและอายุใบอนุญาต**: conditional จากประเภทแรงงาน/งาน ไม่สรุป obligation จาก nationality lookup เพียงอย่างเดียว
- **ติดตามหนังสือรับรองหักภาษีจากลูกค้า**: เชื่อม collection task กับ tax credit และลูกหนี้ โดยเงินสดและ WHT credit ไม่ถูกรับซ้ำ
- **การเปลี่ยนบัญชีธนาคารผู้รับเงิน**: approval/version/verification และ snapshot ผูก payment approval ทั้ง payroll และ supplier
- **ประกันสังคม/รายงานงบ DBD**: แยก authority/channel จากสรรพากร; เป็น adjacent compliance ที่ต้องออกแบบร่วมกับ payroll/GL
- **ข้อร้องเรียน/ตรวจคุณภาพ/CAPA/หักค่าบริการ**: ลูกค้าแจ้งปัญหา → ตรวจหลักฐาน → corrective action → approved commercial adjustment ไม่ลด invoice ด้วย local UI state

Recruitment portal, vendor/customer self-service portal, OCR/AI และ advanced forecasting เป็น optional หลัง core workflow ผ่าน ไม่ถือว่ามีชื่อ feature แล้วต้องสร้างทุกอย่างก่อนใช้งาน

## 7. ลำดับที่แนะนำ

1. ปิด production blockers: baseline/backup-restore/security และ payroll ที่ใช้ค่าจำลอง
2. Company/branch/tax/party masters + COA/period/sequence + approved rule matrices
3. ใช้ P3 service เดิมต่อ inventory workflows และ PR→PO→goods/service acceptance→AP
4. Customer contract→service evidence→billing→invoice/tax invoice→AR และ supplier billing→payment/bank/WHT
5. GL integration + VAT/WHT return/payment/evidence + payroll/SSO และ CIT/stamp/foreign ตาม applicability
6. End-to-end reconciliation/restore/staging/UAT/training และเปิด production เป็น release ที่อนุมัติ

ดู [backlog รายงานพร้อมเกณฑ์ Done](SMARTOP_ERP_DELIVERY_BACKLOG.md) ผู้รับผิดชอบบริษัทต้องยืนยัน payroll/billing rules, SKU variants, tax registrations/obligations, approval limits, external credentials และชนิดเอกสาร sheet 11 ที่ยังไม่จัดประเภท ก่อนย้ายข้อมูลจริง

## 8. ข้อจำกัดและสิ่งที่ยังไม่ทำ

ไม่ได้อ่าน/เปิดเผยข้อมูลรายบุคคล ไม่ recalculation สูตร Excel ไม่ตรวจใบกำกับภาษีรายฉบับ ไม่ยื่น/จ่าย/ส่งข้อความภายนอก ไม่รัน import หรือ migration กับฐานเดิม และไม่ได้เพิ่มหน้าจอ/บัญชี/ภาษีจริงในรอบออกแบบนี้ ผล source scan ใช้ระบุ backlog ไม่ใช่ certification ว่าระบบทั้งหมดพร้อมใช้งาน
