"""Generate a source-only data dictionary; never connects to a database."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / 'prisma/schema.prisma').read_text(encoding='utf-8')
models = dict(re.findall(r'^model\s+(\w+)\s*\{\s*\n(.*?)^\}', source, re.M | re.S))
enums = dict(re.findall(r'^enum\s+(\w+)\s*\{\s*\n(.*?)^\}', source, re.M | re.S))
groups = {
    'Identity & Access': 'User DemoAccount MfaRecoveryCode PasswordHistory Role Permission RolePermission UserRoleAssignment ApprovalAuthority UserSession AccessRequest ApiKey',
    'Organization / Employee / Site': 'Organization Department CostCenter Employee Site Client ClientContact EmployeeDeployment',
    'Attendance / Shift / Payroll': 'Attendance Leave ShiftTemplate ShiftAssignment PayrollPeriod PayrollComponent PayrollPolicy PayrollPolicyComponent SitePayrollPolicy PayrollRun PayrollConfig Payslip',
    'CRM / Project / Contract': 'Opportunity Tender CostEstimate Quotation Project ProjectMilestone Contract WorkOrder ProjectCost',
    'Procurement / Inventory / Assets': 'Supplier PurchaseRequisition PRItem RFQ RFQItem PurchaseOrder POItem GoodsReceipt GoodsReceiptItem InventoryItem StockMovement Asset AssetAssignment AssetMaintenance',
    'P3 Inventory Foundation (new migration; not applied to existing DB)': 'MaterialCategory UnitOfMeasure Material MaterialLegacyMapping MaterialUnitConversion MaterialPriceHistory Warehouse WarehouseLocation InventoryBalance InventoryOperation InventoryMovement MaterialRequisition MaterialRequisitionLine MaterialAcknowledgement GoodsReceiptLine StockTransfer StockTransferLine StockAdjustment StockAdjustmentLine',
    'Finance / Billing': 'Invoice InvoiceItem Receipt SupplierInvoice Payment CashLedgerEntry Budget',
    'Fleet': 'Vehicle Trip VehicleMaintenance FuelRecord',
    'QHSE / Training': 'Incident QHSEFinding CAPA Risk PermitToWork TrainingCourse TrainingEnrollment ComplianceRecord',
    'Platform / Audit': 'AuditLog ImportJob Notification WorkflowApproval EventOutbox AIActionProposal Document SystemAlert ChatMessage',
}
assigned = [name for names in groups.values() for name in names.split()]
assert len(assigned) == len(set(assigned)), 'Duplicate group membership'
assert set(assigned) == set(models), f'Unmapped models: {set(models) ^ set(assigned)}'

parsed = {}
relations = []
for name, body in models.items():
    fields, constraints = [], []
    for raw in body.splitlines():
        line = raw.strip()
        if not line or line.startswith('//'):
            continue
        if line.startswith('@@'):
            constraints.append(line)
            continue
        match = re.match(r'(\w+)\s+([\w\[\]?]+)(?:\s+(.*))?$', line)
        assert match, (name, line)
        field, kind, attrs = match.groups()
        base = kind.rstrip('?').removesuffix('[]')
        is_relation = base in models
        fields.append((field, kind, attrs or '', is_relation))
        if is_relation and '@relation' in (attrs or '') and 'fields:' in attrs:
            fk = re.search(r'fields:\s*\[([^]]+)\]', attrs).group(1)
            refs = re.search(r'references:\s*\[([^]]+)\]', attrs).group(1)
            deletion = re.search(r'onDelete:\s*(\w+)', attrs)
            relations.append((name, field, base, fk, refs, deletion.group(1) if deletion else 'not explicit', kind.endswith('?')))
    parsed[name] = (fields, constraints)

def code(value):
    return '`' + value.replace('|', '\\|') + '`' if value else '—'

lines = [
    '# SmartOP — โครงสร้างฐานข้อมูลเดิมทั้งหมด', '',
    'วันที่ 22 พฤศจิกายน 2026 · สร้างจาก `prisma/schema.prisma` ใน working tree', '',
    'ฐานเดิม: `07a6dff2ec021ea1c98da9819c88b6394b6f9f13`; รวม P3 foundation `20261121000000_p3_inventory_foundation` และ payload widening `20261122000000_inventory_posting_payloads`', '',
    f'พบ **{len(models)} models** และ **{len(relations)} explicit foreign-key relations** ใน source schema', '',
    'เอกสารนี้เป็น data dictionary ของ schema ใน repository ไม่ใช่ผล introspect ฐานข้อมูล production จึงยังไม่ยืนยันว่า migration ทุกชุดถูก deploy หรือ schema จริงตรงกัน ไม่มีการอ่านข้อมูลพนักงาน/ธุรกรรมหรือ connection string', '',
    '## วิธีอ่าน', '',
    '- `?` = nullable สำหรับ scalar หรือ optional relation; `[]` = relation collection ไม่ใช่ column ใน MySQL',
    '- `@id` = primary key; `@unique`/`@@unique` = unique; `@@index` = index ที่ประกาศใน source',
    '- `@default(...)` และ `@updatedAt` แสดงตาม Prisma source; cuid/updatedAt อาจจัดการโดย Prisma ไม่ใช่ SQL default/trigger',
    '- `@db.*` คือชนิด native ที่ระบุชัด หากไม่มี เอกสารนี้แสดง Prisma type โดยไม่เดา DDL จริง',
    '- ฟิลด์ลงท้าย Id ที่ไม่มี `@relation(fields:...)` ไม่ถือว่ามี FK; ตรวจในหัวข้อ logical references',
    '- ฟิลด์ status/role/type ที่เป็น String ไม่ได้เป็น database enum แม้ application จะใช้ค่าที่กำหนดไว้; P3 enums แสดงแยกด้านล่าง', '',
    '## สรุปโมดูล', '', '| โมดูล | จำนวน | Models |', '| --- | ---: | --- |',
]
for group, names in groups.items():
    lines.append(f'| {group} | {len(names.split())} | {", ".join(names.split())} |')

lines += ['', '## Enums ที่ประกาศใน schema', '']
for name, body in enums.items():
    values = [line.strip() for line in body.splitlines() if line.strip() and not line.strip().startswith('//')]
    lines += [f'- **{name}**: ' + ', '.join(code(v) for v in values)]

for group, names in groups.items():
    lines += ['', f'## {group}', '']
    for name in names.split():
        fields, constraints = parsed[name]
        lines += [f'### {name}', '', '| ฟิลด์ | Prisma type | ประเภท | Attributes / Default / Relation |', '| --- | --- | --- | --- |']
        for field, kind, attrs, relation in fields:
            lines.append(f'| {code(field)} | {code(kind)} | {"Relation (ไม่ใช่ column)" if relation else "Column"} | {code(attrs)} |')
        lines += ['', '**Model constraints / indexes:**', '']
        lines += [f'- {code(c)}' for c in constraints] if constraints else ['ไม่มี model-level constraint/index เพิ่มเติมใน source; ดู field-level attributes ด้านบน']
        lines += ['']

lines += ['## Foreign keys ที่ประกาศชัดเจน', '', '| ต้นทาง | Relation | FK columns | ปลายทาง | onDelete ใน source |', '| --- | --- | --- | --- | --- |']
for origin, field, target, fk, refs, deletion, optional in relations:
    lines.append(f'| {origin} | {field} | {code(fk)} | {target}.{refs} | {deletion} |')

lines += ['', '## ER diagram แยกโมดูล', '', 'แสดง explicit FK เท่านั้น; cardinality คำนวณจาก nullable และ unique ของ FK ใน source ไม่แสดง generic sourceType/sourceId หรือ join แบบ application-only', '']
for group, names in groups.items():
    members = set(names.split())
    edges = [r for r in relations if r[0] in members]
    if not edges:
        continue
    lines += [f'### {group}', '', '```mermaid', 'erDiagram']
    for origin, field, target, fk, refs, deletion, optional in edges:
        fields, constraints = parsed[origin]
        fk_names = [f.strip() for f in fk.split(',')]
        unique = len(fk_names) == 1 and any(f == fk_names[0] and ('@unique' in a or '@id' in a) for f, k, a, r in fields)
        unique = unique or any(re.match(r'@@(?:unique|id)\(\[' + re.escape(fk) + r'\]', c) for c in constraints)
        parent_card = '|o' if optional else '||'
        child_card = 'o|' if unique else 'o{'
        lines.append(f'    {target} {parent_card}--{child_card} {origin} : "{field}"')
    lines += ['```', '']

lines += ['## Logical references ที่ยังไม่มี FK ประกาศใน field นี้', '', 'รายการนี้เป็นเพียง heuristic จากชื่อ field ไม่ใช่การยืนยัน target table ต้องออกแบบและตรวจ orphan data ก่อนเพิ่ม FK', '', '| Model | Field | Attributes |', '| --- | --- | --- |']
for name, (fields, constraints) in parsed.items():
    actual_fks = {x.strip() for r in relations if r[0] == name for x in r[3].split(',')}
    for field, kind, attrs, relation in fields:
        if not relation and field != 'id' and field.endswith('Id') and field not in actual_fks:
            lines.append(f'| {name} | {code(field)} | {code(attrs)} |')

lines += ['', '## ข้อควรระวังจาก schema เดิม', '',
    '- InventoryItem/StockMovement เดิมยังอยู่และใช้ Float quantities; P3 เพิ่ม Material/InventoryMovement แยก ไม่ได้ย้ายยอดหรือเปิด write path ใหม่อัตโนมัติ',
    '- InvoiceItem ใช้ Float สำหรับ quantity/taxRate และ Receipt ผูก invoiceId เดียว; multi-invoice allocation ต้องออกแบบเพิ่ม',
    '- User.role และ User.permissions เดิมอยู่ร่วมกับ normalized RBAC; ต้องมี migration compatibility ก่อนถอน fallback',
    '- ไม่มี ChartOfAccount/AccountingPeriod/JournalEntry/JournalEntryLine/GeneralLedger ใน schema ฉบับนี้',
    '- Generic references ใน WorkflowApproval, Document, EventOutbox หรือ source fields ต้องตรวจ referential integrity ใน service หากไม่มี FK',
    '- อย่าใช้ data dictionary นี้สร้าง DB ใหม่ครอบ production; ใช้ reviewed Prisma migrations ตาม roadmap', '',
    '- P3 migration มี CHECK constraints และ append-only triggers นอก Prisma schema; ตรวจ SQL และ runbook เพิ่มเติมก่อน deploy', '',
    '## เอกสารที่ใช้ต่อ', '',
    '- [แบบฐานข้อมูลเป้าหมายและส่วนเพิ่ม](SMARTOP_DATABASE_TARGET.md)',
    '- [สถาปัตยกรรมโครงการ](SMARTOP_PROJECT_ARCHITECTURE.md)',
    '- [แผนพัฒนาขึ้น production](SMARTOP_PRODUCTION_ROADMAP.md)', '',
]
output = ROOT / 'docs/SMARTOP_DATABASE_CURRENT.md'
output.write_text('\n'.join(lines), encoding='utf-8')
print(f'Generated {output.name}: {len(models)} models, {sum(len(v[0]) for v in parsed.values())} fields (including relations), {len(relations)} explicit FK relations')
