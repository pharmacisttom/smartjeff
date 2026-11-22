# SmartOP — ทะเบียนกฎภาษีและแหล่งอ้างอิงสำหรับพัฒนา

วันที่ตรวจ: 22 พฤศจิกายน 2026 · เอกสารอ้างอิงออกแบบ ไม่ใช่บริษัท-specific tax configuration ที่เปิดใช้แล้ว

## 1. Source register

| ID | แหล่งทางการที่ตรวจ | ใช้กำหนด requirement ใด | ข้อจำกัดก่อนเปิดใช้ |
| --- | --- | --- | --- |
| RD-01 | [ทะเบียนพระราชกฤษฎีกา กรมสรรพากร](https://www.rd.go.th/1603.html), [ฉบับที่ 807 พ.ศ.2569](https://www.rd.go.th/fileadmin/user_upload/kormor/newlaw/dc807.pdf) | index ระบุขยายเวลาลด VAT ถึง 30 ก.ย.2570; เก็บเลขกฎหมาย/effective interval ใน rule registry | PDF text extraction มีอักขระเพี้ยน; implementation ต้อง review สำเนาทางการที่อ่านได้/ฉบับแก้ไข และเก็บหลักฐานการอนุมัติ rule |
| RD-02 | [ข่าวรัฐบาลเรื่องขยาย VAT](https://www.thaigov.go.th/th/news/166993) | ข่าวระบุ VAT รวมภาษีท้องถิ่น 7% และช่วงขยายถึง 30 ก.ย.2570; แยกข่าวออกจากตัวบทกฎหมาย | ใช้เป็น corroborating source; ไม่เปิด rate บริษัทจากข่าวอย่างเดียว |
| RD-03 | [แบบ VAT](https://www.rd.go.th/62381.html) | catalog ภ.พ.30/ใบแนบ/30.2/30.3/36; แบบสำหรับ branch/input-tax cases | ต้องเลือก form revision/applicability และทดสอบ field mapping |
| RD-04 | [แบบ WHT](https://www.rd.go.th/7064.html) | catalog ภ.ง.ด.1/3/53 และ certificate/annual forms ที่เกี่ยวข้อง | ไม่ได้พิสูจน์ว่าบริษัทต้องยื่นทุกแบบหรือใช้อัตราเดียว |
| RD-05 | [format กลาง WHT](https://www.rd.go.th/54910.html) | มี format แยกตามแบบ; adapter ต้อง version และตรวจ encoding/fields | หน้าอ้างอิงเก่า ต้อง pin actual download/spec + ช่องทางที่ใช้และ validate ในเครื่องมือปัจจุบัน |
| RD-06 | [คู่มือ WHT/SVS/SWC/50 ทวิ](https://www.rd.go.th/63641.html) | แยก certificate issuance, return preparation และ submission tools | ตรวจ manual/version/registration ก่อนผูก connector |
| RD-07 | [CIT filing](https://www.rd.go.th/840.html) | base deadline ภ.ง.ด.51 สองเดือนหลังหกเดือนแรก / ภ.ง.ด.50 150 วันหลังสิ้นรอบ | ประกอบ fiscal calendar, exception/extension/holiday และ eligibility จริง |
| RD-08 | [New e-Filing API](https://efiling.rd.go.th/rd-cms/api) | auth/submit/status/payin/receipt และ async references มี spec เผยแพร่; capabilities แยก form/role | ไม่อนุมานว่าทุกแบบรองรับ API; ต้องมีสิทธิ์/ข้อตกลง/spec ของรูปแบบและ environment นั้น |
| RD-09 | [e-Filing คู่มือและ RD Prep](https://efiling.rd.go.th/rd-cms/knowledge) | assisted/import-file channel และกระบวนการเตรียมข้อมูล | export format ต้องผ่านเครื่องมือทางการจริงก่อนเรียกว่า ready to file |
| RD-10 | [มาตรฐาน electronic tax transactions](https://www.rd.go.th/65244.html) | security, data retention, format, electronic signature และ e-Tax requirements | PDF ที่สร้างเองไม่ใช่หลักฐานว่า e-Tax compliant; ต้อง validate/sign/deliver ตาม channel |
| RD-11 | [e-Stamp guidance](https://efiling.rd.go.th/ef-cms-web/advice) | อากรแสตมป์มี workflow/registration/API แยกตามบริการ | instrument classification/authorization ต้องยืนยัน ไม่ใช้ VAT adapter แทน |
| RD-12 | [แนวทาง WHT มาตรา 3 เตรส](https://www.rd.go.th/3535.html) | ต้อง classify payer/payee/income และพิจารณากฎที่เกี่ยวข้อง | เป็นแหล่งฐานเก่า ต้องทบทวน amendments/reduced rates/treaty เฉพาะกรณี ไม่ seed 3% ให้ทุกอย่าง |
| SSO-01 | [SSO e-Service terms/workflows](https://www.sso.go.th/eservices/esv/txn1d05.do) | employer/employee registration และ contribution filings เป็นอีก authority; เก็บ receipt/evidence แยก | current contribution bases/rates/caps ต้องตรวจเป็นเวอร์ชัน ไม่ใช้ cap ใน code เดิมเป็นกฎหมาย |
| DBD-01 | [DBD e-Filing information](https://efiling.dbd.go.th/efiling-documents/info_DBD_e-Filing.pdf), [submission manual](https://efiling.dbd.go.th/efiling-documents/SubmitManual.pdf) | financial statement/taxonomy/XBRL/e-Form เป็น adjacent year-end workflow | manuals มีหลายอายุ/version; ตรวจ taxonomy/release/credentials ของบริษัทก่อนเปิด adapter |

## 2. Rule lifecycle

```text
ค้นหาแหล่งทางการ → บันทึก source/document hash และช่วงเวลา
→ tax/accounting specialist ตรวจ applicability
→ ผู้มีอำนาจอนุมัติ rule version
→ boundary tests + official format/portal validation
→ ACTIVE เฉพาะช่วงเวลาและบริษัท/ธุรกรรมที่รับรอง
→ หมดอายุ/เปลี่ยนกฎหมายสร้าง version ใหม่
```

Rule fields: jurisdiction, tax family, transaction/income type, entity/residency, dates, rate/bands, thresholds/aggregation, calculation/rounding, filing form/channel, source refs, reviewed/approvedBy and nextReviewAt

ไม่มี rule active ที่เข้าเงื่อนไข หรือมีมากกว่าหนึ่ง rule ที่ชนกัน ให้ NEEDS_TAX_REVIEW และ block fiscal document/filing ตาม command ห้าม fallback อัตราปัจจุบัน/ศูนย์เปอร์เซ็นต์เงียบ ๆ

ตัวอย่าง candidate STANDARD VAT 7% ต้องเชื่อม legal source/effective dates และตรวจ case applicability ก่อน activate การเลือกไม่จด VAT ใช้ข้อมูลทะเบียนจริง ไม่ใช่เลือกตามความต้องการคิดราคาแต่ละใบ

## 3. ต้องให้บริษัท/ผู้รับผิดชอบบัญชียืนยัน

1. นิติบุคคล/เลขทะเบียนภาษี/สาขาและวันที่มีผลจริง รวมถึงสิทธิ์ยื่นรวมสาขาถ้ามี
2. งานสินค้า/บริการ/เงินล่วงหน้าและ tax-point policy, input tax restrictions/apportionment
3. คู่ค้าบุคคล/นิติบุคคล/ต่างประเทศ, WHT categories, gross-up, treaty/reduced-rate eligibility และหลักฐาน
4. fiscal year, corporate tax regime/rate bands/loss-credit history และ accounting framework
5. bank/e-WHT/e-Tax/filing channel registrations, delegated signers และสิทธิ์เชื่อมระบบ
6. payroll rule matrix, allowances/deductions/YTD และ SSO policy versions ที่ใช้จริง
7. source-document retention/legal-hold policy และผู้ตรวจรับผลยื่น/ชำระ

การออกแบบ database/workflow สามารถเดินหน้าได้โดยเก็บค่าที่ยังไม่ยืนยันเป็น DRAFT/PENDING การยื่น ชำระ และเปิดคำนวณจริงต้องผ่าน gate ของกฎและข้อมูลบริษัทก่อน
