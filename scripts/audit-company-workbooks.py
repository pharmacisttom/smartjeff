"""Read-only XLSX structure audit. Emits counts/roles only, never cell values or raw formulas.

Usage: python scripts/audit-company-workbooks.py <employee.xlsx> <materials.xlsx>
Source workbooks are never changed. Output can be redirected to ignored tmp/.
"""
import json
import posixpath
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
NS = {'m': MAIN}


def classify(name):
    n = name.strip().casefold()
    for term, role in [
        ('ประวัติพนักงาน', 'employee_master'), ('staff_info', 'staff_access_reference'),
        ('code', 'master_code_reference'), ('เข้าออก', 'shift_reference'),
        ('เงินเดือน', 'payroll'), ('attenden', 'attendance'), ('slip', 'payslip'),
        ('customer', 'customer_master'), ('bill', 'billing_note'), ('inv', 'invoice'),
        ('ส่งตัว', 'employee_deployment'), ('price', 'material_price_master'),
        ('summary', 'site_consumption_summary'), ('form', 'requisition_template'),
    ]:
        if term in n:
            return role
    return 'site_requisition_or_other_document'


def audit(filename, alias):
    path = Path(filename)
    with zipfile.ZipFile(path) as archive:
        # Limit decompression before parsing; never follow external workbook links.
        if sum(info.file_size for info in archive.infolist()) > 256 * 1024 * 1024:
            raise ValueError('Workbook exceeds structural inspection size limit.')
        names = archive.namelist()
        strings = []
        if 'xl/sharedStrings.xml' in names:
            strings = [''.join(t.text or '' for t in si.iter(f'{{{MAIN}}}t'))
                       for si in ET.fromstring(archive.read('xl/sharedStrings.xml'))]
        links = {item.attrib['Id']: item.attrib.get('Target', '')
                 for item in ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))
                 if item.attrib.get('TargetMode') != 'External'}
        sheets = ET.fromstring(archive.read('xl/workbook.xml')).find('m:sheets', NS)
        reports = []
        for index, sheet in enumerate(sheets, 1):
            target = links[sheet.attrib[f'{{{REL}}}id']]
            target = target.lstrip('/') if target.startswith('/') else posixpath.normpath(posixpath.join('xl', target))
            if not target.startswith('xl/worksheets/'):
                raise ValueError('Unexpected worksheet path.')
            root = ET.fromstring(archive.read(target))
            cells = list(root.iter(f'{{{MAIN}}}c'))
            formulas = [c.find('m:f', NS) for c in cells if c.find('m:f', NS) is not None]
            errors = {}
            for cell in cells:
                if cell.attrib.get('t') == 'e':
                    value = cell.find('m:v', NS)
                    # Keep only recognized spreadsheet error tokens, no arbitrary cached text.
                    token = value.text if value is not None else ''
                    if token in {'#REF!', '#DIV/0!', '#VALUE!', '#NAME?', '#N/A', '#NUM!', '#NULL!'}:
                        errors[token] = errors.get(token, 0) + 1
            dimension = root.find('m:dimension', NS)
            used_range = dimension.attrib.get('ref') if dimension is not None else None
            if used_range and not re.fullmatch(r'[A-Z]+\d+(?::[A-Z]+\d+)?', used_range):
                used_range = None
            report = {
                'sheetIndex': index, 'role': classify(sheet.attrib['name']),
                'usedRange': used_range,
                'storedCells': len(cells), 'formulaCells': len(formulas), 'cachedFormulaErrors': errors,
                'mergedRegions': len(root.findall('m:mergeCells/m:mergeCell', NS)),
                'dataValidationRules': len(root.findall('m:dataValidations/m:dataValidation', NS)),
            }
            if report['role'] == 'material_price_master':
                values = {}
                for cell in cells:
                    value = cell.find('m:v', NS)
                    text = ''
                    if value is not None:
                        text = strings[int(value.text)] if cell.attrib.get('t') == 's' else value.text or ''
                    elif cell.attrib.get('t') == 'inlineStr':
                        text = ''.join(t.text or '' for t in cell.iter(f'{{{MAIN}}}t'))
                    values[cell.attrib['r']] = text.strip()
                candidates = 0
                explicit_codes = 0
                for desc_col, code_col, price_col in [('B', 'C', 'D'), ('K', 'L', 'M'), ('T', 'U', 'V')]:
                    for address, text in values.items():
                        match = re.fullmatch(re.escape(desc_col) + r'(\d+)', address)
                        if not match or int(match[1]) < 9 or not text:
                            continue
                        row = match[1]
                        price = values.get(price_col + row, '')
                        if not re.fullmatch(r'\d+(?:\.\d+)?', price):
                            continue
                        if values.get(code_col + row):
                            explicit_codes += 1
                        else:
                            candidates += 1
                report['pricedDescriptionsWithCode'] = explicit_codes
                report['pricedDescriptionsWithoutCode_needsReview'] = candidates
            reports.append(report)
        return {
            'sourceAlias': alias, 'sheetCount': len(reports),
            'formulaCells': sum(s['formulaCells'] for s in reports),
            'cachedErrorCells': sum(sum(s['cachedFormulaErrors'].values()) for s in reports),
            'hasExternalLinkParts': any(n.startswith('xl/externalLinks/') for n in names),
            'sheets': reports,
            'limitation': 'Structural evidence only; cached values not recalculated, business rows and raw formulas not emitted.',
        }


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Supply the two authorized source XLSX paths.')
    print(json.dumps([audit(sys.argv[1], 'employee_workbook'), audit(sys.argv[2], 'materials_workbook')], ensure_ascii=True, indent=2))
