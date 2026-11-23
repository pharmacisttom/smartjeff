"""Build the Thai company approval proposal from agreed decisions and repository evidence.

Run with the Codex bundled Python. Requires bundled python-docx and Pillow.
Outputs editable DOCX plus a repository Markdown source. Does not touch the database.
"""
from pathlib import Path
import re
import json
from datetime import datetime, timezone
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/documents'
TMP = ROOT / 'tmp/approval-document'
OUT.mkdir(parents=True, exist_ok=True)
TMP.mkdir(parents=True, exist_ok=True)
FONT = 'Leelawadee UI'
TITLE = 'เอกสารเสนออนุมัติโครงการ SmartOP'
CODE = 'SMARTOP PROPOSAL 2026 001'
BASELINE = '5dd38b5d7ba8a266f06b83da8c2f07aec4050bbd'
DATE = '23 พฤศจิกายน 2569'
DOCX = OUT / 'SmartOP_Project_Approval_2026-11-23.docx'
MD = ROOT / 'docs/SMARTOP_COMPANY_APPROVAL_PLAN.md'


def parse_rows(name, prefix):
    text = (ROOT / 'docs' / name).read_text(encoding='utf-8')
    return [[c.strip() for c in line.strip().strip('|').split('|')]
            for line in text.splitlines() if re.match(r'^\| ' + prefix + r'\d', line)]


tickets = parse_rows('SMARTOP_ERP_DELIVERY_BACKLOG.md', 'ERP-')
gaps = parse_rows('SMARTOP_COMPANY_SYSTEM_GAP_AUDIT.md', 'G')[:48]
gap_text = (ROOT / 'docs/SMARTOP_COMPANY_SYSTEM_GAP_AUDIT.md').read_text(encoding='utf-8')
trace_text = gap_text.split('## 5. Gap-to-delivery traceability', 1)[1].split('## 6.', 1)[0]
trace = {g: refs.strip() for g, refs in re.findall(r'^\| (G\d{2}) \| ([^|]+) \|', trace_text, re.M)}
assert len(tickets) == 44 and len(gaps) == 48 and len(trace) == 48

doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Cm(21), Cm(29.7)
sec.top_margin, sec.bottom_margin = Cm(1.8), Cm(1.7)
sec.left_margin, sec.right_margin = Cm(2), Cm(2)
sec.header_distance, sec.footer_distance = Cm(.7), Cm(.7)
sec.different_first_page_header_footer = True
for name in ['Normal', 'Title', 'Subtitle', 'Heading 1', 'Heading 2', 'Heading 3', 'Caption']:
    style = doc.styles[name]
    style.font.name = FONT
    style.font.color.rgb = RGBColor(0, 0, 0)
    rf = style.element.get_or_add_rPr().get_or_add_rFonts()
    for attr in ['ascii', 'hAnsi', 'eastAsia', 'cs']:
        rf.set(qn('w:' + attr), FONT)
    lang = OxmlElement('w:lang'); lang.set(qn('w:val'), 'th-TH'); lang.set(qn('w:bidi'), 'th-TH')
    style.element.rPr.append(lang)
normal = doc.styles['Normal']
normal.font.size = Pt(11)
normal.paragraph_format.line_spacing = 1.12
normal.paragraph_format.space_after = Pt(5)
for name, size in [('Title', 27), ('Subtitle', 16), ('Heading 1', 18), ('Heading 2', 12.5), ('Heading 3', 11.5), ('Caption', 9.5)]:
    doc.styles[name].font.size = Pt(size)
    doc.styles[name].paragraph_format.space_after = Pt(7)
    if name.startswith('Heading'):
        doc.styles[name].font.bold = True
        doc.styles[name].paragraph_format.keep_with_next = True
        doc.styles[name].paragraph_format.space_before = Pt(8)
doc.styles['Title'].paragraph_format.space_before = Pt(0)
doc.styles['Title'].paragraph_format.space_after = Pt(10)
for pstyle in ['Title', 'Subtitle']:
    borders = doc.styles[pstyle].element.get_or_add_pPr().find(qn('w:pBdr'))
    if borders is not None:
        borders.getparent().remove(borders)

def format_run(run, size=None, bold=None, color=None):
    run.font.name = FONT
    rf = run._element.get_or_add_rPr().get_or_add_rFonts()
    for attr in ['ascii', 'hAnsi', 'eastAsia', 'cs']:
        rf.set(qn('w:' + attr), FONT)
    if size is not None:
        run.font.size = Pt(size)
        sz = OxmlElement('w:szCs'); sz.set(qn('w:val'), str(int(size * 2))); run._element.rPr.append(sz)
    if bold is not None:
        run.bold = bold
        b = OxmlElement('w:bCs'); b.set(qn('w:val'), '1' if bold else '0'); run._element.rPr.append(b)
    if color:
        run.font.color.rgb = RGBColor.from_string(color)
    return run

def field(p, instruction, cached='1'):
    r = p.add_run(); format_run(r, 9)
    begin = OxmlElement('w:fldChar'); begin.set(qn('w:fldCharType'), 'begin'); r._r.append(begin)
    instr = OxmlElement('w:instrText'); instr.set(qn('xml:space'), 'preserve'); instr.text = instruction
    r._r.append(instr)
    sep = OxmlElement('w:fldChar'); sep.set(qn('w:fldCharType'), 'separate'); r._r.append(sep)
    t = OxmlElement('w:t'); t.text = cached; r._r.append(t)
    end = OxmlElement('w:fldChar'); end.set(qn('w:fldCharType'), 'end'); r._r.append(end)

header = sec.header.paragraphs[0]
header.paragraph_format.tab_stops.add_tab_stop(Cm(17), WD_ALIGN_PARAGRAPH.RIGHT)
format_run(header.add_run('SmartOP เอกสารเสนออนุมัติโครงการ'), 8.5)
format_run(header.add_run('\tฉบับ 1.0'), 8.5)
footer = sec.footer.paragraphs[0]
footer.paragraph_format.tab_stops.add_tab_stop(Cm(17), WD_ALIGN_PARAGRAPH.RIGHT)
format_run(footer.add_run('สำหรับพิจารณาภายในบริษัท\tหน้า '), 8.5)
field(footer, 'PAGE'); format_run(footer.add_run(' จาก '), 8.5); field(footer, 'NUMPAGES')
props = doc.core_properties
props.title, props.subject = TITLE, 'โครงสร้างระบบ แผนพัฒนาและเกณฑ์อนุมัติโครงการทั้งบริษัท'
props.author = props.last_modified_by = 'ทีมโครงการ SmartOP'
props.created = props.modified = datetime(2026, 11, 23, tzinfo=timezone.utc)
props.keywords = 'SmartOP ERP Project Approval Thailand'

md = [f'# {TITLE}', '', f'{DATE} · ฉบับ 1.0 · เสนอเพื่อพิจารณาอนุมัติ', '']
headings = []
page_no = 0

def para(text, bold=False, size=None):
    p = doc.add_paragraph()
    format_run(p.add_run(text), size, bold)
    md.extend([text, ''])
    return p

def sub(text):
    doc.add_paragraph(text, 'Heading 2')
    md.extend(['### ' + text, ''])

def bullet(text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent, p.paragraph_format.first_line_indent = Cm(.35), Cm(-.25)
    format_run(p.add_run('•  ' + text))
    md.append('- ' + text)

def start(title, note=None):
    global page_no
    if page_no:
        doc.add_page_break()
    page_no += 1
    p = doc.add_paragraph(title, 'Heading 1')
    bookmark = f'section_{page_no}'
    b = OxmlElement('w:bookmarkStart'); b.set(qn('w:id'), str(page_no)); b.set(qn('w:name'), bookmark)
    e = OxmlElement('w:bookmarkEnd'); e.set(qn('w:id'), str(page_no))
    p._p.insert(0, b); p._p.append(e)
    headings.append((title, bookmark, page_no))
    md.extend(['', '## ' + title, ''])
    if note:
        para(note, size=10)

def table(headers, rows, widths, size=10):
    t = doc.add_table(rows=1, cols=len(headers))
    t.alignment, t.autofit = WD_TABLE_ALIGNMENT.CENTER, False
    pr = t._tbl.tblPr
    borders = OxmlElement('w:tblBorders')
    for side in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
        edge = OxmlElement('w:' + side); edge.set(qn('w:val'), 'single'); edge.set(qn('w:sz'), '5'); edge.set(qn('w:color'), 'D9D9D9'); borders.append(edge)
    pr.append(borders)
    margins = OxmlElement('w:tblCellMar')
    for side, val in [('top', '70'), ('bottom', '70'), ('left', '95'), ('right', '95')]:
        edge = OxmlElement('w:' + side); edge.set(qn('w:w'), val); edge.set(qn('w:type'), 'dxa'); margins.append(edge)
    pr.append(margins)
    repeat = OxmlElement('w:tblHeader'); repeat.set(qn('w:val'), 'true'); t.rows[0]._tr.get_or_add_trPr().append(repeat)
    for col, width in zip(t.columns, widths):
        col.width = Cm(width)
    for idx, data in enumerate([headers] + list(rows)):
        row = t.rows[0] if idx == 0 else t.add_row()
        cant = OxmlElement('w:cantSplit'); row._tr.get_or_add_trPr().append(cant)
        for j, text in enumerate(data):
            cell = row.cells[j]; cell.width = Cm(widths[j]); cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            shade = OxmlElement('w:shd'); shade.set(qn('w:fill'), '203C56' if idx == 0 else ('F1F5F8' if idx % 2 == 0 else 'FFFFFF')); cell._tc.get_or_add_tcPr().append(shade)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0); p.paragraph_format.space_after = Pt(1)
            p.paragraph_format.line_spacing = 1.08
            p.paragraph_format.keep_with_next = False
            if j == 0 and widths[j] < 2.1:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            format_run(p.add_run(str(text)), size, idx == 0, 'FFFFFF' if idx == 0 else '000000')
    md.extend(['| ' + ' | '.join(headers) + ' |', '| ' + ' | '.join(['---'] * len(headers)) + ' |'])
    md.extend('| ' + ' | '.join(str(v).replace('\n', ' / ').replace('|', '/') for v in row) + ' |' for row in rows)
    md.append('')
    return t

def link(p, label, url):
    from docx.opc.constants import RELATIONSHIP_TYPE
    rid = p.part.relate_to(url, RELATIONSHIP_TYPE.HYPERLINK, is_external=True)
    hl = OxmlElement('w:hyperlink'); hl.set(qn('r:id'), rid)
    run = OxmlElement('w:r'); rpr = OxmlElement('w:rPr')
    rf = OxmlElement('w:rFonts')
    for attr in ['ascii', 'hAnsi', 'cs']: rf.set(qn('w:' + attr), FONT)
    rpr.append(rf)
    for tag, val in [('color', '203C56'), ('u', 'single'), ('sz', '20'), ('szCs', '20')]:
        item = OxmlElement('w:' + tag); item.set(qn('w:val'), val); rpr.append(item)
    run.append(rpr); text = OxmlElement('w:t'); text.text = label; run.append(text); hl.append(run); p._p.append(hl)

def diagram():
    im = Image.new('RGB', (1500, 1460), 'white'); d = ImageDraw.Draw(im)
    font = ImageFont.truetype('C:/Windows/Fonts/tahoma.ttf', 27)
    bold = ImageFont.truetype('C:/Windows/Fonts/tahomabd.ttf', 29)
    left = ['Demand and purchase request', 'RFQ and supplier quotation', 'Approved PO or work contract', 'Goods inspection or service acceptance', 'Stock receipt and supplier invoice', 'Vendor billing and payment approval', 'Bank payment and withholding tax']
    right = ['Customer contract and order', 'Workforce and service schedule', 'Approved attendance and work evidence', 'Billing calculation and approval', 'Invoice and tax document', 'Customer billing and collection', 'Receipt allocation and WHT credit']
    for x, title, labels in [(35, 'PROCURE TO PAY', left), (785, 'ORDER TO CASH', right)]:
        d.text((x + 300, 28), title, font=bold, fill='black', anchor='mt')
        for idx, label in enumerate(labels):
            y = 100 + idx * 156
            d.rounded_rectangle((x, y, x + 680, y + 105), radius=10, fill='#F1F5F8', outline='#B8C5D0', width=2)
            # Keep all diagram text at a legible font size; English labels map to Thai prose.
            words = label.split(); lines = []; current = ''
            for word in words:
                proposed = (current + ' ' + word).strip()
                if d.textlength(proposed, font=font) > 625:
                    lines.append(current); current = word
                else: current = proposed
            lines.append(current)
            yy = y + 52 - (len(lines) - 1) * 17
            for text in lines:
                d.text((x + 340, yy), text, font=font, fill='black', anchor='mm'); yy += 35
            if idx < 6:
                cy = y + 106
                d.line((x + 340, cy, x + 340, cy + 44), fill='#203C56', width=4)
                d.polygon([(x + 330, cy + 34), (x + 350, cy + 34), (x + 340, cy + 47)], fill='#203C56')
    d.rounded_rectangle((35, 1255, 1465, 1400), radius=10, fill='#203C56')
    d.text((750, 1303), 'GENERAL LEDGER  |  TAX REGISTERS  |  REPORTING', font=bold, fill='white', anchor='mm')
    d.text((750, 1360), 'Approved source  +  immutable records  +  reconciliation', font=font, fill='white', anchor='mm')
    dest = TMP / 'erp_flow.png'; im.save(dest, dpi=(220, 220))
    return dest

# Cover
page_no = 1
p = doc.add_paragraph(TITLE, 'Title')
for r in p.runs: format_run(r, 27, True, '000000')
doc.add_paragraph('แผนพัฒนาระบบบริหารงานบริษัทครบวงจร', 'Subtitle')
para('เสนอเพื่ออนุมัติขอบเขตโครงการ โครงสร้างระบบ วิธีดำเนินงาน และเกณฑ์ตรวจรับก่อนขึ้นใช้งานจริง')
table(['ข้อมูลเอกสาร', 'รายละเอียด'], [
    ['รหัสเอกสาร', CODE], ['ฉบับและวันที่', 'ฉบับ 1.0  |  ' + DATE],
    ['ผู้รับเอกสาร', 'ผู้บริหารและผู้รับผิดชอบงานของบริษัทผู้ว่าจ้าง'],
    ['ผู้จัดทำ', 'ทีมโครงการ SmartOP'], ['สถานะ', 'เสนอเพื่อพิจารณาอนุมัติ ยังไม่มีผลเป็นการอนุมัติเปิดระบบหรือใช้จ่าย'],
], [4.1, 12.9], 10.5)
sub('เรื่องที่ขออนุมัติ')
para('ขออนุมัติพัฒนาระบบที่เชื่อมงานพนักงานและไซต์ คลังวัสดุ จัดซื้อจัดจ้าง คำสั่งซื้อ วางบิล การรับจ่าย บัญชี และภาษี โดยต่อยอดระบบเดิม และเปิดทุกโมดูลพร้อมกันเมื่อผ่านการทดสอบและการรับรองยอดของบริษัท')
para('เอกสารครอบคลุมบริษัทเดียวที่มีหลายไซต์หรือสาขา ใช้เว็บและ Excel เป็นข้อมูลตั้งต้น และให้เจ้าของข้อมูลอนุมัติส่วนต่างก่อนย้ายข้อมูล แผนส่งมอบมี 44 งานหลักและผูกกับ 48 ประเด็นตรวจติดตามจากการตรวจระบบและไฟล์บริษัท')
sub('ขอบเขตการอนุมัติฉบับนี้')
para('การลงนามใช้รับรองแนวทาง ขอบเขต และเกณฑ์ดำเนินโครงการ วงเงิน ระยะเวลาดำเนินงาน และวันเปิดใช้งานมีผลเมื่อผู้ว่าจ้างอนุมัติแผนฐานและข้อเสนอค่าใช้จ่ายภายหลังการประเมินข้อมูลและทรัพยากร ไม่ใช้เอกสารนี้แทนการอนุมัติยื่นภาษีหรือปล่อยจ่ายเงินรายรายการ')
para('ฐานอ้างอิงการตรวจ 22 พฤศจิกายน 2569  |  เอกสารจัดทำ 23 พฤศจิกายน 2569', size=9.5)
md += ['ฐานอ้างอิง 5dd38b5 และเอกสารออกแบบใน repository วันที่ 22 พฤศจิกายน 2569', '']

# TOC uses Word PAGEREF fields updated by the native render pass.
start('สารบัญและวิธีใช้เอกสาร')
para('ส่วนต้นใช้ประกอบการตัดสินใจและกำกับโครงการ ภาคผนวก ก ระบุงานส่งมอบครบ 44 งาน ภาคผนวก ข แสดงประเด็นตรวจติดตาม 48 ข้อพร้อมงานอ้างอิง และส่วนท้ายเป็นแหล่งข้อมูลกับแบบลงนามอนุมัติ')
toc_anchor = doc.add_paragraph()
toc_rows = []

start('1 บทสรุปและข้อตกลงโครงการ')
para('SmartOP จะเป็นระบบทำงานหลักร่วมกันของบริษัทตั้งแต่เอกสารต้นทางถึงบัญชีและภาษี ลดการคีย์ซ้ำ และให้ทุกยอดตรวจย้อนกลับถึงเอกสาร ผู้อนุมัติ และเวอร์ชันกฎที่ใช้ได้ การรับรองความพร้อมวัดจาก workflow และยอดที่กระทบตรงกัน ไม่วัดจากจำนวนหน้าจอหรือตาราง')
table(['ประเด็น', 'ข้อกำหนดที่ยืนยันแล้ว'], [
    ['ขอบเขตองค์กร', 'เริ่มบริษัทเดียว หลายไซต์หรือสาขา โครงสร้างข้อมูลเตรียมรองรับหลายบริษัท แต่รุ่นแรกตรวจรับนิติบุคคลเดียว'],
    ['วิธีเปิดระบบ', 'พัฒนาและตรวจรับเป็นชุดบน staging แล้วเปิดทุกโมดูลพร้อมกันหลัง UAT ทั้งบริษัท'],
    ['ข้อมูลปัจจุบัน', 'ใช้ทั้งเว็บและ Excel ส่วนต่างต้องให้เจ้าของข้อมูลอนุมัติรายโมดูลก่อน import'],
    ['ทะเบียนภาษี', 'ตั้งค่าจด VAT หรือไม่จด VAT ตามทะเบียนและวันที่มีผล พร้อมหลักฐานและประวัติ'],
    ['การนำส่งภาษี', 'รองรับไฟล์และ API ตามสิทธิ์ แบบ และช่องทางที่ผ่านการอนุมัติและทดสอบ'],
    ['การจ่ายเงินรุ่นแรก', 'อนุมัติในระบบ ส่งไฟล์ผ่านธนาคาร และนำผลจริงกับ statement กลับมากระทบยอด'],
], [3.4, 13.6], 10.4)
sub('ผลที่บริษัทควรได้รับ')
bullet('ข้อมูลพนักงาน สัญญา ไซต์ และกำลังคน เชื่อมค่าจ้าง ต้นทุน และการเรียกเก็บตามหลักฐานที่อนุมัติ')
bullet('PR และ PO เชื่อมตรวจรับ คลัง เจ้าหนี้ และการจ่าย โดยไม่บันทึกสต็อกหรือค่าใช้จ่ายซ้ำ')
bullet('ลูกหนี้ เจ้าหนี้ เงินสด ธนาคาร บัญชี และทะเบียนภาษีตรวจสอบยอดร่วมกันได้')
bullet('มีผู้รับผิดชอบ สายอนุมัติ หลักฐาน และรายงานข้อผิดปกติสำหรับทุกธุรกรรมสำคัญ')

start('2 สถานะปัจจุบันและเรื่องที่ต้องแก้ก่อนใช้งานจริง')
para('ตรวจฐานโค้ด 5dd38b5 พบ schema 102 models และ API route files 63 ไฟล์ พัฒนา P3 database และ internal stock posting services แล้ว ส่วนบัญชีคู่และภาษีครบวงจรยังเป็นแบบออกแบบ ผลทดสอบด้านล่างเป็นหลักฐานของรอบ implementation ก่อนหน้า ไม่ใช่ผลรับรอง production')
table(['ส่วนที่ตรวจ', 'สถานะและผลต่อแผน'], [
    ['คลัง P3', 'มี service รับ จ่าย โอน คืน ปรับนับและต้นทุนเฉลี่ย ต้องต่อ workflow อนุมัติ API และหน้าจอ'],
    ['ผลตรวจทางเทคนิคเดิม', 'tests ทั่วไป 134 และ database tests 38 ผ่าน พร้อม typecheck route check 115 เส้นทาง และ production build บนฐานทดสอบ'],
    ['ไฟล์บริษัท', 'ตรวจโครงสร้างครบ 50 ชีต ไฟล์พนักงานมี external links และ price master มี 12 รายการราคาไม่มี code ที่ต้องทบทวน'],
    ['Payroll', 'มี OT 20 ชั่วโมงและภาษี 1% แบบตายตัว และ query attendance ไม่จำกัดวันที่ตาม period ต้องแก้ก่อนใช้จ่ายหรือยื่นจริง'],
    ['บัญชีและภาษี', 'ยังไม่มี Journal และ GL หรือ tax filing engine ใน schema ปัจจุบัน ต้องสร้างและทดสอบ source integration'],
    ['ฐานข้อมูลเดิม', 'ผลตรวจล่าสุดบันทึก schema drift และไม่มี migration history ต้องตรวจยืนยันบนสำเนาที่ได้รับอนุญาตก่อน migrate'],
    ['Backup และ DR', 'มี backup script แต่หน้าจอแสดงข้อมูล verified แบบจำลอง ยังต้องมี restore evidence จริง'],
], [3.6, 13.4], 10.3)
sub('เงื่อนไขก่อนเริ่มข้อมูลจริง')
para('บริษัทต้องรับรองแหล่งข้อมูลหลัก กฎ payroll และ billing รายไซต์ ทะเบียนภาษี ผังบัญชี และสายอนุมัติ ทีมเทคนิคต้องสำรองและทดสอบคืนข้อมูล พร้อมจัด environment ทดสอบที่แยกจากงานจริง ก่อนเปิดคำสั่งที่เปลี่ยนเงิน สต็อก หรือแบบภาษี')

start('3 ขอบเขตระบบที่เสนออนุมัติ')
table(['ระบบ', 'ผลส่งมอบหลัก'], [
    ['ข้อมูลพื้นฐาน', 'บริษัท สาขา ลูกค้า ผู้ขาย พนักงาน ไซต์ โครงการ วัสดุ หน่วยนับ ผังบัญชี กฎภาษีและเลขเอกสาร'],
    ['พนักงานและกำลังคน', 'ประวัติ การมอบหมายไซต์ กะ ลงเวลา OT ลา แก้เวลา ส่งตัว เข้าและพ้นสภาพ'],
    ['Payroll และพอร์ทัล', 'คำนวณจาก period จริง ตรวจและอนุมัติ เผยแพร่ payslip ภาษีเงินเดือน ประกันสังคม และไฟล์จ่าย'],
    ['ขายและสัญญาลูกค้า', 'เสนอราคา คำสั่งซื้อ สัญญา ตารางราคา หลักฐานบริการ และการคำนวณเรียกเก็บ'],
    ['จัดซื้อจัดจ้าง', 'PR RFQ เปรียบเทียบราคา PO สัญญาจ้าง งวดงาน หลักประกันและ revision'],
    ['ตรวจรับ', 'รับสินค้ารอตรวจ ตรวจคุณภาพ รับบางส่วน ปฏิเสธ ใบรับสินค้า และใบตรวจรับงานบริการ'],
    ['คลังวัสดุ', 'SKU และ variant ยอดตาม location จองของ เบิกจ่าย โอน คืน ตรวจนับ และต้นทุนไซต์'],
    ['วางบิลและเจ้าหนี้ลูกหนี้', 'วางบิลลูกค้า รับวางบิลผู้ขาย invoice credit และ debit note รับและจ่ายบางส่วนหลายใบ'],
    ['การเงินและธนาคาร', 'เสนอจ่าย อนุมัติ ไฟล์ธนาคาร กระทบยอด เงินทดรอง ค่าใช้จ่าย เงินสดย่อยและ cash forecast'],
    ['บัญชี', 'ผังบัญชี งวด Journal และ GL reversal ปิดงวด งบทดลอง งบการเงินและ source posting'],
    ['ภาษีและนำส่ง', 'VAT WHT หนังสือรับรอง แบบภาษี การยื่น ชำระ หลักฐาน ยื่นเพิ่มเติม และภาษีอื่นตาม obligation'],
    ['ระบบพ่วงและแพลตฟอร์ม', 'สินทรัพย์ ค่าเสื่อม QHSE การอบรม maintenance SLA tickets รายงาน worker เอกสาร สิทธิ์ backup และ monitoring'],
], [4.1, 12.9], 10.3)
para('ทุกหมวดใน launch scope ต้องผ่านการตรวจรับก่อนเปิดพร้อมกัน รายการที่ขึ้นกับข้อเท็จจริง เช่น ภาษีต่างประเทศ อากรตามตราสาร หรือเอกสารแรงงานเฉพาะประเภท ระบุ applicable หรือ not applicable พร้อมเหตุผลและผู้อนุมัติ ห้ามใช้ N/A ปิดงานหลักที่ยังไม่เสร็จ', size=10.2)

start('4 กระบวนการเชื่อมงานทั้งบริษัท')
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
shape = p.add_run().add_picture(str(diagram()), width=Cm(16.3))
shape._inline.docPr.set('descr', 'Two linked business flows from procurement and customer orders to banking general ledger and tax registers')
md.extend(['แผนภาพสองวงจรหลัก Procure to Pay และ Order to Cash เชื่อมบัญชีและภาษีจาก source ที่อนุมัติ', ''])
para('ฝั่งซื้อเริ่มจากความต้องการและ PR ไป RFQ และ PO จากนั้นสินค้าผ่านใบตรวจรับก่อนเข้าคลัง ส่วนงานจ้างผ่านใบตรวจรับงานบริการ เจ้าหนี้และการจ่ายอ้างเอกสารที่ตรวจครบและไม่ลงต้นทุนซ้ำ')
para('ฝั่งขายเริ่มจากสัญญาและคำสั่งซื้อ เชื่อมแผนกำลังคน หลักฐานปฏิบัติงาน การเรียกเก็บ วางบิล และรับเงิน แยก OT ที่จ่ายพนักงานออกจาก OT ที่เรียกเก็บลูกค้า และเก็บหลักฐานส่วนลดหรือหักค่าบริการ')

start('5 ระบบภาษีและหลักฐานการนำส่ง')
para('ข้อมูลภาษีผูกกับนิติบุคคลและสาขาตามทะเบียน มีวันที่มีผลและประวัติ เอกสารแต่ละฉบับเก็บ snapshot ของคู่ค้า ภาษี และกฎที่ใช้ การแก้ค่าพื้นฐานจึงไม่เปลี่ยนเอกสารที่ออกแล้ว')
table(['กลุ่มงาน', 'ขอบเขตและการควบคุม'], [
    ['VAT', 'ภาษีซื้อและขาย แยกอัตราปกติ ศูนย์ ยกเว้นและนอกขอบเขต รวมสิทธิ์ภาษีซื้อและ ภ.พ.30 ตาม profile'],
    ['WHT', 'ภาษีที่บริษัทหักและที่ลูกค้าหัก ภ.ง.ด.1 3 53 และ 50 ทวิ ตามประเภทเงินได้ คู่ค้าและการจ่ายจริง'],
    ['ภาษีตามเงื่อนไข', 'ภ.พ.36 ภ.ง.ด.54 CIT ภ.ง.ด.50 และ 51 อากรแสตมป์ และแบบอื่นเมื่อบริษัทเข้าเงื่อนไข'],
    ['การจัดทำแบบ', 'ดึง source ที่อนุมัติ ตรวจทะเบียน กระทบยอด ตรวจทาน อนุมัติ และตรึงเวอร์ชันพร้อม hash'],
    ['ช่องทางนำส่ง', 'ไฟล์ตาม format ที่ผ่านเครื่องมือทางการ และ API เฉพาะแบบและสิทธิ์ที่ได้รับอนุมัติ พร้อม assisted mode'],
    ['ผลยื่นและการชำระ', 'แยกส่งแล้ว กำลังประมวลผล รับแบบแล้ว และชำระยืนยัน ใช้ผลทางการกับหลักฐานธนาคาร'],
    ['ยื่นเพิ่มเติม', 'สร้างเวอร์ชันอ้างต้นฉบับ แสดงส่วนต่างและเหตุผล เก็บหลักฐาน ไม่แก้แบบเดิมทับ'],
], [3.6, 13.4], 10.3)
sub('ข้อกำหนดที่ต้องยืนยันก่อนเปิดใช้')
para('ฝ่ายบัญชีและผู้รับผิดชอบภาษีอนุมัติทะเบียน obligation จุดเกิดภาษี อัตรา ฐาน การปัดเศษ วันที่ครบกำหนด และกฎเฉพาะบริษัทจากแหล่งทางการ กฎที่ยังไม่ยืนยันคงสถานะรอตรวจและไม่ถูกใช้คำนวณจริง')
para('ประกันสังคมและการส่งงบ DBD ใช้ทะเบียน ช่องทาง และหลักฐานแยกจากสรรพากร การสร้างไฟล์หรือได้รับ HTTP success เพียงอย่างเดียวไม่ใช้รับรองว่ายื่นหรือชำระสำเร็จ')

start('6 โครงสร้างระบบและฐานข้อมูลเป้าหมาย')
para('ต่อยอด Next.js TypeScript Prisma และ MySQL family ใน repository เดิมด้วย modular monolith แยกหน้าจอและ API ออกจาก service และกฎธุรกิจ ใช้ shared authorization approval numbering audit private document storage และ durable outbox ร่วมกัน')
table(['ชั้นระบบ', 'หน้าที่และข้อมูลที่รับผิดชอบ'], [
    ['หน้าจอและ API', 'รับข้อมูลที่ตรวจรูปแบบแล้ว ตรวจ session และ scope ทุกคำสั่ง แสดง loading empty error และผลสำเร็จตามหลักฐาน'],
    ['Application services', 'ควบคุม use case และ state transition ตรวจผู้อนุมัติ idempotency และเวอร์ชันข้อมูล'],
    ['ข้อมูลพื้นฐาน', 'Organization และ Branch คู่ค้า พนักงาน ไซต์ วัสดุ UOM ราคา บัญชีและ tax profile versions'],
    ['เอกสารธุรกิจ', 'PR quotation PO สัญญา inspection acceptance requisition invoice billing และ allocations'],
    ['Ledger และการกระทบยอด', 'InventoryMovement Journal GL TaxLedger และ source posting พร้อมข้อมูลอ้างอิงและ reversal'],
    ['งานภายนอก', 'worker ส่งและติดตามผลธนาคาร ภาษี email เอกสาร และ import ด้วย reference ที่ป้องกันรายการซ้ำ'],
    ['ปฏิบัติการ', 'monitoring audit storage backup restore และการควบคุม dev test staging production'],
], [3.5, 13.5], 10.3)
sub('กฎข้อมูลที่บังคับใช้ร่วมกัน')
bullet('ยอดเงินใช้ Decimal และ currency ชัดเจน ไม่ใช้ Float คำนวณเงิน และกำหนด precision การปัดเศษตามนโยบาย')
bullet('ทุก ledger อ้าง source และ organization สอดคล้องกัน posted facts แก้ด้วย reversal หรือ adjustment ที่อนุมัติ')
bullet('เลขเอกสารออกด้วย transaction และ unique constraint ไม่ใช้ COUNT บวกหนึ่ง')
bullet('คง Client Supplier และ GoodsReceipt ของเดิม ใช้ additive migrations และตรวจ mapping ก่อนถอน legacy')
bullet('ขยายจาก 102 models ตามแบบข้อมูลเป้าหมายทีละชุด ไม่ถือว่าตารางที่มีแล้วคือ workflow ที่เสร็จแล้ว')

start('7 แผนย้ายข้อมูลจากเว็บและ Excel')
para('ใช้ source of truth ที่เจ้าของข้อมูลอนุมัติรายโมดูล หากเว็บและ Excel ต่างกัน ให้ระบบสร้างรายงานส่วนต่างและรอ decision ที่บันทึกผู้อนุมัติ ไม่เลือกข้อมูลใหม่กว่าหรือเขียนทับอัตโนมัติ')
table(['ขั้น', 'การดำเนินการและหลักฐาน'], [
    ['1 สำรวจ', 'ระบุ environment สคีมาจริง migration history ช่วงข้อมูล คู่มือและเจ้าของข้อมูล พร้อมรายการ sensitive fields'],
    ['2 สำรองและคืน', 'สำรอง DB และเอกสาร คืนบน authorized clone และยืนยันข้อมูล triggers และ checksums'],
    ['3 วิเคราะห์', 'parse และ map ชื่อ/รหัส/สาขา วันที่และ UOM ตรวจ external links duplicate orphan และ SKU variants'],
    ['4 ตรวจส่วนต่าง', 'เทียบเว็บกับ Excel ตาม business key เก็บ conflict และ decision ของเจ้าของข้อมูลรายโมดูล'],
    ['5 ทดลองย้าย', 'validate preview error report และ dry run บน staging แก้ critical errors ก่อนอนุมัติ'],
    ['6 ยืนยันและนำเข้า', 'freeze file hash และ mapping version นำเข้าใน transaction แบบ retry ไม่ซ้ำ เก็บ source row lineage และ audit'],
    ['7 กระทบยอด', 'ตรวจ employee/assignment, stock qty/value, AR AP GL tax payroll และเอกสารที่เปิดค้าง ให้เจ้าของข้อมูลลงนาม'],
    ['8 Final cutover', 'หยุดแก้ข้อมูลตามเวลาที่อนุมัติ เก็บ final delta ย้ายครั้งสุดท้าย ตรวจยอดและเปิดทุกโมดูลพร้อมกัน'],
], [3.1, 13.9], 10.2)
para('ยอดเบิกวัสดุย้อนหลังไม่ใช้แทน opening stock ต้องมี quantity และ valuation ที่ตรวจนับหรือรับรองแล้ว เอกสารที่ยังไม่จบ เช่น PO ค้างรับ ลูกหนี้ค้าง เจ้าหนี้ค้าง เงินทดรอง และเครดิตภาษี ต้องมีบัญชีเปิดค้างและ source reference แยก')
para('ใช้ Prisma migrations ที่ตรวจแล้ว ไม่ใช้ db push reset DROP หรือการ mark migration applied ทั้งชุดโดยไม่พิสูจน์ผล ทีมต้องซ้อมแผนกับสำเนาก่อนใช้กับฐานจริง')

start('8 แผนพัฒนาและหมุดหมายการส่งมอบ')
para('พัฒนาและทดสอบเป็นชุดภายใน dev และ staging เพื่อควบคุม dependency แต่การเปิดให้ลูกค้าจริงเป็นครั้งเดียวหลังผ่าน UAT ครบ launch scope ชุดงาน A0 ถึง A7 เชื่อม phase P0 ถึง P8 ของแผนเดิมและรายละเอียด 44 งานในภาคผนวก ก')
table(['ชุดงาน', 'สิ่งส่งมอบและเงื่อนไขผ่าน'], [
    ['A0 ความพร้อม', 'baseline clone restore IAM และ payroll ที่ใช้ข้อมูลจริงผ่านก่อนนำยอดเข้าบัญชีหรือแบบภาษี'],
    ['A1 พื้นฐานและ GL', 'บริษัท สาขา VAT คู่ค้า approval เลขเอกสาร ผังบัญชี งวด และ balanced journal'],
    ['A2 คลัง', 'ต่อ service P3 เป็น workflow API และ UI ครบ reservation ตรวจรับ ยืนยันรับและกระทบยอด'],
    ['A3 ซื้อและจ้าง', 'PR RFQ PO สัญญาจ้าง QC acceptance invoice match วางบิลผู้ขายและเจ้าหนี้'],
    ['A4 ขายและการเงิน', 'customer order billing invoice AR payment bank files และ statement reconciliation'],
    ['A5 ภาษี', 'tax rules registers certificates approved returns channels evidence payment และแก้ไขเพิ่มเติม'],
    ['A6 ระบบบริษัท', 'workforce payroll SSO assets expenses SLA maintenance รายงานและข้อมูลส่วนบุคคลตาม scope'],
    ['A7 เปิดใช้งาน', 'integration browser security restore UAT training final migration และลงนาม go live'],
], [3.3, 13.7], 10.2)
sub('การจัดทำกำหนดการและควบคุมงบ')
para('หลังสำรวจ A0 และยืนยัน master rules ใน A1 ให้ทีมแตก 44 งานเป็น implementation tasks ประเมิน effort dependency และจำนวนคน แล้วเสนอ baseline schedule พร้อมต้นทุนพัฒนา ย้ายข้อมูล ทดสอบ อบรม และดูแลระบบให้ผู้ว่าจ้างอนุมัติ รวมค่าใช้จ่ายประจำด้าน hosting storage backup provider certificates และ maintenance')
para('ยังไม่มีข้อมูลยืนยันขนาดทีม อัตราค่าบริการ และวงเงิน จึงไม่กำหนดราคาหรือวันเปิดระบบเป็นข้อผูกพันในฉบับนี้ การเปลี่ยน scope กฎ ข้อมูล หรือช่องทาง provider หลังอนุมัติ ต้องมี impact assessment และ change request ก่อนปรับแผนฐาน', size=10.5)

start('9 ผู้รับผิดชอบ สิทธิ์และการกำกับงาน')
table(['งานกำกับ', 'ผู้ดำเนินการ', 'ผู้อนุมัติ'], [
    ['ขอบเขตและแผนฐาน', 'หัวหน้าโครงการร่วมกับเจ้าของกระบวนการ', 'ผู้บริหารหรือผู้สนับสนุนโครงการ'],
    ['ข้อมูลบริษัทและภาษี', 'ฝ่ายบัญชีและผู้รับผิดชอบภาษี', 'ผู้มีอำนาจของบริษัท'],
    ['Payroll และกำลังคน', 'HR และ Operations', 'ผู้รับผิดชอบ HR และการเงินตามอำนาจ'],
    ['จัดซื้อ ตรวจรับ คลัง', 'Procurement ผู้ตรวจรับและ Warehouse', 'ผู้มีอำนาจตามวงเงินและ scope'],
    ['รับจ่ายและธนาคาร', 'AR AP Treasury', 'ผู้อนุมัติและผู้ปล่อยจ่ายที่แยกหน้าที่'],
    ['บัญชีและปิดงวด', 'ผู้จัดทำบัญชีและผู้ตรวจทาน', 'ผู้รับผิดชอบบัญชีตามอำนาจ'],
    ['ทดสอบและย้ายข้อมูล', 'Tech QA Ops และเจ้าของข้อมูล', 'เจ้าของกระบวนการและหัวหน้าโครงการ'],
    ['เปิดระบบจริง', 'ทีมโครงการและ Operations', 'ผู้บริหารหลังรับรอง UAT และ go live checklist'],
], [4.0, 7.0, 6.0], 10.2)
sub('การแยกหน้าที่และความปลอดภัย')
bullet('ผู้สร้างไม่เป็น final approver ของ requisition PO adjustment invoice payment และ payroll ผู้จัดทำ journal ไม่เป็น poster และผู้จัดทำแบบภาษีไม่เป็น final approver')
bullet('ใช้ UserRoleAssignment RolePermission และ resource scope เป็นสิทธิ์หลัก ตรวจซ้ำที่ server และฐานข้อมูลก่อน query หรือ mutation')
bullet('แยกสิทธิ์เงินเดือน บัญชีธนาคาร เอกสารภาษีและ export มี masking การอนุมัติเปลี่ยนบัญชี และ audit การเข้าถึง')
bullet('เก็บ private documents และ secrets แยกจาก Git ใช้ HTTPS และ environment แยก พร้อม retention และ legal hold ที่บริษัทอนุมัติ')
para('บริษัทแต่งตั้งชื่อผู้รับผิดชอบจริงและผู้แทนตามบทบาทก่อนเริ่ม migration และ UAT ส่วนลงนามท้ายเอกสารใช้บันทึกผู้มีอำนาจและเงื่อนไขที่อนุมัติ')

start('10 แผนทดสอบและเกณฑ์ตรวจรับ')
para('ผลรับรองต้องผูกกับ release commit environment ชุดข้อมูล กฎเวอร์ชัน และผู้ตรวจรับ รายการที่ไม่ได้ทดสอบระบุ NOT RUN หรือ BLOCKED ไม่แสดง PASS แทน')
uat = [
    ['U01', 'VAT และสาขา', 'วันที่มีผลถูกต้อง ใบเก่าคง snapshot และสิทธิ์ภาษีซื้อแยกชัด'],
    ['U02', 'ซื้อสินค้า', 'GR คลัง GRNI AP ภาษีซื้อ และจ่าย กระทบตรงโดยไม่ลงต้นทุนซ้ำ'],
    ['U03', 'QC และคืนผู้ขาย', 'รับบางส่วน ปฏิเสธ คืน และลดหนี้อ้าง source และจำนวนถูกต้อง'],
    ['U04', 'งานจ้าง', 'ตรวจรับตามผลงาน retention WHT และ AP โดยไม่เพิ่มสต็อกบริการ'],
    ['U05', 'ค่าบริการลูกค้า', 'fixed headcount OT holiday deductions อ้างสัญญาและหลักฐาน'],
    ['U06', 'ลูกค้าหักภาษี', 'ยอดเงินสดและ WHT credit รวมปิด AR ได้ โดยไม่มีเงินสดสมมติ'],
    ['U07', 'จ่ายหักภาษี', 'ปิด AP ด้วย bank และ WHT payable แล้วนำส่งภาษีครั้งเดียว'],
    ['U08', 'คลังและต้นทุน', 'WAC โอน คืน count และ landed cost ตรง ledger balance และ GL'],
    ['U09', 'แบบ VAT', 'register return credit และ control accounts กระทบตรง'],
    ['U10', 'ยื่นเพิ่มเติม', 'เก็บ original version และส่วนต่าง ไม่รวม source หรือจ่ายซ้ำ'],
    ['U11', 'ส่งข้อมูลภายนอก', 'timeout UNKNOWN ใช้ reference เดิมและตรวจ callback ซ้ำ'],
    ['U12', 'ธนาคาร', 'ผลจริง partial failed และ statement กระทบได้ ไม่ปิด PAID ก่อนยืนยัน'],
    ['U13', 'ปิดงวดและ reversal', 'กัน post งวดปิดและตรวจยอดสุทธิ original รวม reversal ถูกต้อง'],
    ['U14', 'Payroll', 'period attendance OT YTD ภาษี SSO และยอดธนาคารตรงกัน'],
    ['U15', 'สิทธิ์และ SoD', 'กันข้ามบริษัท ไซต์ ฟิลด์ ผู้อนุมัติตนเองและ session ที่หมดสิทธิ์'],
    ['U16', 'นำเข้า', 'preview conflict hashes และ retry ไม่สร้างข้อมูลซ้ำ'],
    ['U17', 'คืนระบบ', 'คืน DB เอกสารและ triggers แล้วตรวจยอดและแผนกลับได้จริง'],
    ['U18', 'รายงาน', 'AR AP stock GL tax cash และกำไรไซต์ trace ถึง source'],
]
table(['กรณี', 'หัวข้อ', 'เกณฑ์ตรวจรับ'], uat, [1.4, 4.1, 11.5], 9.8)
para('Quality gates ฝั่ง implementation ได้แก่ Prisma validate generate migrate status typecheck unit และ integration tests route check production build และ Playwright ที่ตรง workflow รวมการทดสอบ engine/provider บน staging และการลงนามรับรองยอดของบริษัท', size=10)

start('11 แผนเปิดใช้งาน ความเสี่ยงและการส่งมอบ')
sub('เปิดทุกโมดูลพร้อมกันหลังผ่าน UAT')
para('ก่อนวันเปิด ให้บริษัทอนุมัติ final migration rehearsal รายงานยอด รายการเอกสารเปิดค้าง ผู้ใช้และสิทธิ์ คู่มือ และผู้รับผิดชอบ support จากนั้นประกาศช่วงหยุดแก้เว็บและ Excel เก็บ final delta ย้ายข้อมูล ตรวจยอดและ runtime smoke แล้วผู้มีอำนาจอนุมัติเปิดจริง')
para('หากเงื่อนไข UAT ข้อมูล ภาษี provider หรือ restore ยังไม่ผ่าน ให้เลื่อน go live โดยพัฒนาต่อบน staging ก่อนการส่งภายนอกจริงสามารถคืน application version ที่เข้ากันได้ แต่หลังเกิดการจ่ายหรือแบบที่ได้รับแล้ว ต้องใช้ reconciliation และ forward correction ไม่ restore ทับหลักฐานธุรกรรมภายนอก')
table(['ความเสี่ยง', 'มาตรการและผู้รับผิดชอบ'], [
    ['ข้อมูลเว็บกับ Excel ขัดกัน', 'เจ้าของข้อมูลอนุมัติ conflict รายโมดูล พร้อม hash mapping และ control totals'],
    ['ฐานเดิมไม่ตรง migration', 'Tech และ Ops สำรอง คืนบน clone และตรวจผลของแต่ละ migration ก่อน baseline'],
    ['กฎเงินเดือน ภาษีหรือ billing ไม่ยืนยัน', 'HR บัญชีและ Operations ลงนาม rule matrix ก่อนคำนวณจริง'],
    ['provider หรือ API ไม่พร้อม', 'ใช้ช่องทางไฟล์หรือ assisted ที่อนุมัติ และเปิด API เฉพาะ capabilities ที่ทดสอบแล้ว'],
    ['ข้อมูลลับหรือการอนุมัติผิด', 'Security และ Finance ใช้ scope masking maker checker verified bank และ audit'],
    ['เปิดพร้อมกันมีผลกระทบกว้าง', 'ซ้อม cutover ทั้งวงจร มี go no go checklist ผู้ตัดสินใจและ support owner'],
], [5.0, 12.0], 10.2)
sub('สิ่งส่งมอบและการควบคุมการเปลี่ยนแปลง')
para('ส่งมอบ source code และ migrations ที่ review แล้ว แบบข้อมูลและ API เอกสารกฎและ mapping ผลทดสอบ UAT คู่มือผู้ใช้และผู้ดูแล วิธี backup restore deploy rollback และทะเบียนผู้รับผิดชอบ ใช้ issue และ change request บันทึกผลต่อ scope effort งบ วันส่งมอบและการทดสอบ ก่อนอนุมัติเปลี่ยนแผน')
para('หลังเปิดระบบให้มีผู้รับเรื่อง ช่องทางแจ้งปัญหา การจัดระดับความรุนแรง การติดตามคิวและยอดผิดปกติ รวมถึงการส่งต่อเจ้าของธุรกิจ รายละเอียดเวลาบริการและเงื่อนไขดูแลให้ระบุในข้อตกลงการให้บริการที่บริษัทอนุมัติ')

# Appendices retain every ticket and gap ID, without exposing private business rows.
owner_map = {'Tech': 'เทคนิค', 'Ops': 'ปฏิบัติการระบบ', 'Owner': 'ผู้มีอำนาจ', 'Security': 'ความปลอดภัย', 'Accounting': 'บัญชี', 'Accountant': 'ผู้ทำบัญชี', 'Finance': 'การเงิน', 'HR': 'HR', 'Tax': 'ภาษี', 'QA': 'QA', 'Procurement': 'จัดซื้อ', 'Warehouse': 'คลัง', 'Site': 'ไซต์', 'Operations': 'Operations', 'Inspector': 'ผู้ตรวจรับ', 'Data': 'ข้อมูล', 'Management': 'ผู้บริหาร', 'Approver': 'ผู้อนุมัติ', 'Integrations': 'เชื่อมระบบ', 'Sales': 'ขาย', 'Billing': 'วางบิล', 'AR': 'AR', 'AP': 'AP', 'Treasury': 'Treasury'}
def owner(text):
    return ' และ '.join(owner_map.get(part.strip(), part.strip()) for part in text.split('+'))

for offset in range(0, 44, 9):
    start(f'ภาคผนวก ก งานส่งมอบ {offset + 1} ถึง {min(offset + 9, 44)}', '44 งานนี้เป็น delivery tickets หรือ epics ขนาดต่างกัน ทีมต้องแตกงานย่อยและประเมิน effort ก่อนอนุมัติแผนฐาน')
    rows = []
    for code, task, deps, done, who in tickets[offset:offset + 9]:
        rows.append([code, task + '\nเกณฑ์ผ่าน ' + done + '\nDependency ' + deps, owner(who)])
    table(['รหัส', 'งาน ผลส่งมอบและเงื่อนไขผ่าน', 'ผู้ตรวจรับ'], rows, [2.0, 12.0, 3.0], 9.7)

status_map = {'NOT_FOUND': 'ยังไม่พบส่วนที่ระบุ', 'PARTIAL': 'มีบางส่วน', 'INTERNAL_TESTED': 'ทดสอบภายในแล้ว', 'DEMO_ONLY': 'ข้อมูลแสดงผลจำลอง', 'NOT_VERIFIED': 'ยังไม่รับรองผลจริง', 'CONDITIONAL': 'ขึ้นกับข้อเท็จจริง'}
for offset in range(0, 48, 12):
    start(f'ภาคผนวก ข ประเด็นตรวจติดตาม {offset + 1} ถึง {offset + 12}', 'ผล source และ workbook audit ที่ฐานเดิม ไม่ใช่การรับรอง production และไม่หมายความว่าทั้ง 48 ระบบไม่มีอยู่เลย')
    rows = []
    for code, subject, evidence, state, action in gaps[offset:offset + 12]:
        priority = action.split(':', 1)[0]
        rows.append([code, subject, status_map.get(state, state) + '\n' + priority, trace[code]])
    table(['รหัส', 'ระบบหรือเรื่องที่ตรวจ', 'สถานะและระดับ', 'งานอ้างอิง'], rows, [1.3, 7.2, 3.7, 4.8], 10)
    para('รายละเอียดหลักฐานและเหตุผลรายข้ออยู่ใน Company System Gap Audit ที่อ้างอิงท้ายเอกสาร ประเด็น conditional ต้องให้บริษัทตัดสิน applicability ก่อนอนุมัติ launch scope', size=10)

start('เอกสารอ้างอิงและคำศัพท์สำคัญ')
para('ฐานข้อมูลอ้างอิงเป็น source code และเอกสารที่ตรวจวันที่ 22 พฤศจิกายน 2569 ร่วมกับข้อตกลงผู้ว่าจ้างในแชตวันที่ 22 ถึง 23 พฤศจิกายน 2569 ไฟล์ Excel ใช้ตรวจโครงสร้าง 50 ชีตโดยไม่เผยข้อมูลรายบุคคล เอกสารนี้ไม่ได้รับรองสูตรจาก cached values')
refs = [
    ('R01', 'โครงสร้าง ERP รวมทั้งบริษัท', f'https://github.com/pharmacisttom/smartjeff/blob/{BASELINE}/docs/SMARTOP_INTEGRATED_ERP_BLUEPRINT.md'),
    ('R02', 'แบบข้อมูลและจุดเชื่อมระบบ', f'https://github.com/pharmacisttom/smartjeff/blob/{BASELINE}/docs/SMARTOP_ERP_INTEGRATION_DATA_MODEL.md'),
    ('R03', 'แผนงาน 44 งานและเกณฑ์ตรวจรับ', f'https://github.com/pharmacisttom/smartjeff/blob/{BASELINE}/docs/SMARTOP_ERP_DELIVERY_BACKLOG.md'),
    ('R04', 'ผลตรวจช่องว่าง 48 ประเด็น', f'https://github.com/pharmacisttom/smartjeff/blob/{BASELINE}/docs/SMARTOP_COMPANY_SYSTEM_GAP_AUDIT.md'),
    ('R05', 'ระบบภาษีนำส่งและทะเบียนแหล่งอ้างอิง', f'https://github.com/pharmacisttom/smartjeff/blob/{BASELINE}/docs/SMARTOP_TAX_FILING_DESIGN.md'),
    ('R06', 'แบบภาษีมูลค่าเพิ่ม กรมสรรพากร', 'https://www.rd.go.th/62381.html'),
    ('R07', 'แบบภาษีหัก ณ ที่จ่าย กรมสรรพากร', 'https://www.rd.go.th/7064.html'),
    ('R08', 'ข้อมูล API การยื่นแบบ กรมสรรพากร', 'https://efiling.rd.go.th/rd-cms/api'),
    ('R09', 'มาตรฐานธุรกรรมภาษีอิเล็กทรอนิกส์', 'https://www.rd.go.th/65244.html'),
    ('R10', 'SSO e Service', 'https://www.sso.go.th/eservices/esv/txn1d05.do'),
    ('R11', 'คู่มือ DBD e Filing', 'https://efiling.dbd.go.th/efiling-documents/SubmitManual.pdf'),
]
for code, label, url in refs:
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(4)
    format_run(p.add_run(code + '  '), 10)
    link(p, label, url)
    md.append(f'- {code} [{label}]({url})')
para('แหล่งสรรพากรและหน่วยงานรัฐเป็นแนวทางออกแบบที่ตรวจในรอบก่อนหน้า ฝ่ายบัญชีต้องตรวจเวอร์ชันกฎหมาย แบบ taxonomy และสิทธิ์ช่องทางอีกครั้งก่อนใช้งานจริง โดยเก็บผลทบทวนใน rule register', size=10)
table(['คำศัพท์', 'ความหมาย'], [
    ['UAT', 'บริษัททดสอบและรับรอง workflow กับยอดตามกรณีใช้งานจริง'],
    ['Staging', 'ระบบซ้อมก่อน production ที่แยกฐานข้อมูล credentials และ storage'],
    ['SoD', 'การแยกหน้าที่ผู้สร้าง ผู้ตรวจ ผู้อนุมัติและผู้ปล่อยรายการ'],
    ['GL และ WAC', 'บัญชีแยกประเภท และการคิดต้นทุนเฉลี่ยถ่วงน้ำหนักของสต็อก'],
    ['Baseline และ cutover', 'ฐานข้อมูลและแผนอ้างอิงที่รับรองแล้ว และช่วงตัดเข้าสู่ระบบใหม่'],
], [4.2, 12.8], 10)

start('การพิจารณาอนุมัติและการลงนาม')
para('เสนอให้ผู้มีอำนาจพิจารณาขอบเขตระบบทั้งหมด วิธีเปิดทุกโมดูลพร้อมกัน การย้ายข้อมูลแบบอนุมัติรายโมดูล เกณฑ์ทดสอบ ผู้รับผิดชอบ และเงื่อนไขจัดทำแผนฐานกับงบประมาณตามเอกสารฉบับนี้')
para('[ ] อนุมัติขอบเขตและแนวทางดำเนินโครงการตามเอกสารฉบับนี้')
para('[ ] อนุมัติโดยมีเงื่อนไขตามบันทึกแนบที่ลงนามร่วมกัน')
para('[ ] ให้ปรับปรุงก่อนเสนอพิจารณาอีกครั้ง')
para('เงื่อนไขหรือเลขที่บันทึกแนบ  __________________________________________________')
para('________________________________________________________________________')
para('การอนุมัติแผนฐาน effort ทีม งบประมาณและวันเปิดระบบ ให้ยืนยันภายหลัง A0 และการรับรองกฎข้อมูลหลัก การอนุมัติเปิดระบบ การยื่นภาษี และคำสั่งจ่ายเงินจริงยังใช้หลักฐานและอำนาจตาม workflow ที่กำหนดแยกต่างหาก', size=10.5)
for role in ['ผู้เสนอแผนหรือหัวหน้าโครงการ', 'ผู้รับผิดชอบ Operations จัดซื้อและคลัง', 'ผู้รับผิดชอบ HR และข้อมูลพนักงาน', 'ผู้รับผิดชอบบัญชี การเงินและภาษี', 'ผู้มีอำนาจอนุมัติโครงการของบริษัท']:
    p = para(role, bold=True, size=10.5); p.paragraph_format.space_before = Pt(5)
    p = para('ลงชื่อ _______________________  ชื่อ _______________________  วันที่ ______________', size=10)
    p.paragraph_format.space_after = Pt(5)
para('เอกสารฉบับ 1.0  รหัส ' + CODE + '  จำนวนหน้าตามเลขท้ายเอกสาร', size=9.5)

# Fill the TOC with genuine internal page-reference fields rather than guessed page numbers.
anchor = toc_anchor
for title, bookmark, number in headings[1:]:
    p = doc.add_paragraph()
    anchor._p.addnext(p._p); anchor = p
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.tab_stops.add_tab_stop(Cm(16.8), WD_ALIGN_PARAGRAPH.RIGHT)
    format_run(p.add_run(title + '\t'), 10.2)
    field(p, f'PAGEREF {bookmark} \\h', str(number))
settings = doc.settings.element
update = OxmlElement('w:updateFields'); update.set(qn('w:val'), 'true'); settings.append(update)
doc.save(DOCX)
MD.write_text('\n'.join(md).rstrip() + '\n', encoding='utf-8')
(TMP / 'page-manifest.json').write_text(json.dumps({'expectedPages': page_no, 'headings': headings, 'docx': str(DOCX)}, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'docx': str(DOCX), 'source': str(MD), 'plannedPages': page_no, 'tickets': len(tickets), 'gaps': len(gaps)}, ensure_ascii=True))
