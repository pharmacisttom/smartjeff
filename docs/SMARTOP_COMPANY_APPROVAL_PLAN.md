# เอกสารเสนออนุมัติโครงการ SmartOP

23 พฤศจิกายน 2569 · ฉบับ 1.0 · เสนอเพื่อพิจารณาอนุมัติ

เสนอเพื่ออนุมัติขอบเขตโครงการ โครงสร้างระบบ วิธีดำเนินงาน และเกณฑ์ตรวจรับก่อนขึ้นใช้งานจริง

| ข้อมูลเอกสาร | รายละเอียด |
| --- | --- |
| รหัสเอกสาร | SMARTOP PROPOSAL 2026 001 |
| ฉบับและวันที่ | ฉบับ 1.0  /  23 พฤศจิกายน 2569 |
| ผู้รับเอกสาร | ผู้บริหารและผู้รับผิดชอบงานของบริษัทผู้ว่าจ้าง |
| ผู้จัดทำ | ทีมโครงการ SmartOP |
| สถานะ | เสนอเพื่อพิจารณาอนุมัติ ยังไม่มีผลเป็นการอนุมัติเปิดระบบหรือใช้จ่าย |

### เรื่องที่ขออนุมัติ

ขออนุมัติพัฒนาระบบที่เชื่อมงานพนักงานและไซต์ คลังวัสดุ จัดซื้อจัดจ้าง คำสั่งซื้อ วางบิล การรับจ่าย บัญชี และภาษี โดยต่อยอดระบบเดิม และเปิดทุกโมดูลพร้อมกันเมื่อผ่านการทดสอบและการรับรองยอดของบริษัท

เอกสารครอบคลุมบริษัทเดียวที่มีหลายไซต์หรือสาขา ใช้เว็บและ Excel เป็นข้อมูลตั้งต้น และให้เจ้าของข้อมูลอนุมัติส่วนต่างก่อนย้ายข้อมูล แผนส่งมอบมี 44 งานหลักและผูกกับ 48 ประเด็นตรวจติดตามจากการตรวจระบบและไฟล์บริษัท

### ขอบเขตการอนุมัติฉบับนี้

การลงนามใช้รับรองแนวทาง ขอบเขต และเกณฑ์ดำเนินโครงการ วงเงิน ระยะเวลาดำเนินงาน และวันเปิดใช้งานมีผลเมื่อผู้ว่าจ้างอนุมัติแผนฐานและข้อเสนอค่าใช้จ่ายภายหลังการประเมินข้อมูลและทรัพยากร ไม่ใช้เอกสารนี้แทนการอนุมัติยื่นภาษีหรือปล่อยจ่ายเงินรายรายการ

ฐานอ้างอิงการตรวจ 22 พฤศจิกายน 2569  |  เอกสารจัดทำ 23 พฤศจิกายน 2569

ฐานอ้างอิง 5dd38b5 และเอกสารออกแบบใน repository วันที่ 22 พฤศจิกายน 2569


## สารบัญและวิธีใช้เอกสาร

ส่วนต้นใช้ประกอบการตัดสินใจและกำกับโครงการ ภาคผนวก ก ระบุงานส่งมอบครบ 44 งาน ภาคผนวก ข แสดงประเด็นตรวจติดตาม 48 ข้อพร้อมงานอ้างอิง และส่วนท้ายเป็นแหล่งข้อมูลกับแบบลงนามอนุมัติ


## 1 บทสรุปและข้อตกลงโครงการ

SmartOP จะเป็นระบบทำงานหลักร่วมกันของบริษัทตั้งแต่เอกสารต้นทางถึงบัญชีและภาษี ลดการคีย์ซ้ำ และให้ทุกยอดตรวจย้อนกลับถึงเอกสาร ผู้อนุมัติ และเวอร์ชันกฎที่ใช้ได้ การรับรองความพร้อมวัดจาก workflow และยอดที่กระทบตรงกัน ไม่วัดจากจำนวนหน้าจอหรือตาราง

| ประเด็น | ข้อกำหนดที่ยืนยันแล้ว |
| --- | --- |
| ขอบเขตองค์กร | เริ่มบริษัทเดียว หลายไซต์หรือสาขา โครงสร้างข้อมูลเตรียมรองรับหลายบริษัท แต่รุ่นแรกตรวจรับนิติบุคคลเดียว |
| วิธีเปิดระบบ | พัฒนาและตรวจรับเป็นชุดบน staging แล้วเปิดทุกโมดูลพร้อมกันหลัง UAT ทั้งบริษัท |
| ข้อมูลปัจจุบัน | ใช้ทั้งเว็บและ Excel ส่วนต่างต้องให้เจ้าของข้อมูลอนุมัติรายโมดูลก่อน import |
| ทะเบียนภาษี | ตั้งค่าจด VAT หรือไม่จด VAT ตามทะเบียนและวันที่มีผล พร้อมหลักฐานและประวัติ |
| การนำส่งภาษี | รองรับไฟล์และ API ตามสิทธิ์ แบบ และช่องทางที่ผ่านการอนุมัติและทดสอบ |
| การจ่ายเงินรุ่นแรก | อนุมัติในระบบ ส่งไฟล์ผ่านธนาคาร และนำผลจริงกับ statement กลับมากระทบยอด |

### ผลที่บริษัทควรได้รับ

- ข้อมูลพนักงาน สัญญา ไซต์ และกำลังคน เชื่อมค่าจ้าง ต้นทุน และการเรียกเก็บตามหลักฐานที่อนุมัติ
- PR และ PO เชื่อมตรวจรับ คลัง เจ้าหนี้ และการจ่าย โดยไม่บันทึกสต็อกหรือค่าใช้จ่ายซ้ำ
- ลูกหนี้ เจ้าหนี้ เงินสด ธนาคาร บัญชี และทะเบียนภาษีตรวจสอบยอดร่วมกันได้
- มีผู้รับผิดชอบ สายอนุมัติ หลักฐาน และรายงานข้อผิดปกติสำหรับทุกธุรกรรมสำคัญ

## 2 สถานะปัจจุบันและเรื่องที่ต้องแก้ก่อนใช้งานจริง

ตรวจฐานโค้ด 5dd38b5 พบ schema 102 models และ API route files 63 ไฟล์ พัฒนา P3 database และ internal stock posting services แล้ว ส่วนบัญชีคู่และภาษีครบวงจรยังเป็นแบบออกแบบ ผลทดสอบด้านล่างเป็นหลักฐานของรอบ implementation ก่อนหน้า ไม่ใช่ผลรับรอง production

| ส่วนที่ตรวจ | สถานะและผลต่อแผน |
| --- | --- |
| คลัง P3 | มี service รับ จ่าย โอน คืน ปรับนับและต้นทุนเฉลี่ย ต้องต่อ workflow อนุมัติ API และหน้าจอ |
| ผลตรวจทางเทคนิคเดิม | tests ทั่วไป 134 และ database tests 38 ผ่าน พร้อม typecheck route check 115 เส้นทาง และ production build บนฐานทดสอบ |
| ไฟล์บริษัท | ตรวจโครงสร้างครบ 50 ชีต ไฟล์พนักงานมี external links และ price master มี 12 รายการราคาไม่มี code ที่ต้องทบทวน |
| Payroll | มี OT 20 ชั่วโมงและภาษี 1% แบบตายตัว และ query attendance ไม่จำกัดวันที่ตาม period ต้องแก้ก่อนใช้จ่ายหรือยื่นจริง |
| บัญชีและภาษี | ยังไม่มี Journal และ GL หรือ tax filing engine ใน schema ปัจจุบัน ต้องสร้างและทดสอบ source integration |
| ฐานข้อมูลเดิม | ผลตรวจล่าสุดบันทึก schema drift และไม่มี migration history ต้องตรวจยืนยันบนสำเนาที่ได้รับอนุญาตก่อน migrate |
| Backup และ DR | มี backup script แต่หน้าจอแสดงข้อมูล verified แบบจำลอง ยังต้องมี restore evidence จริง |

### เงื่อนไขก่อนเริ่มข้อมูลจริง

บริษัทต้องรับรองแหล่งข้อมูลหลัก กฎ payroll และ billing รายไซต์ ทะเบียนภาษี ผังบัญชี และสายอนุมัติ ทีมเทคนิคต้องสำรองและทดสอบคืนข้อมูล พร้อมจัด environment ทดสอบที่แยกจากงานจริง ก่อนเปิดคำสั่งที่เปลี่ยนเงิน สต็อก หรือแบบภาษี


## 3 ขอบเขตระบบที่เสนออนุมัติ

| ระบบ | ผลส่งมอบหลัก |
| --- | --- |
| ข้อมูลพื้นฐาน | บริษัท สาขา ลูกค้า ผู้ขาย พนักงาน ไซต์ โครงการ วัสดุ หน่วยนับ ผังบัญชี กฎภาษีและเลขเอกสาร |
| พนักงานและกำลังคน | ประวัติ การมอบหมายไซต์ กะ ลงเวลา OT ลา แก้เวลา ส่งตัว เข้าและพ้นสภาพ |
| Payroll และพอร์ทัล | คำนวณจาก period จริง ตรวจและอนุมัติ เผยแพร่ payslip ภาษีเงินเดือน ประกันสังคม และไฟล์จ่าย |
| ขายและสัญญาลูกค้า | เสนอราคา คำสั่งซื้อ สัญญา ตารางราคา หลักฐานบริการ และการคำนวณเรียกเก็บ |
| จัดซื้อจัดจ้าง | PR RFQ เปรียบเทียบราคา PO สัญญาจ้าง งวดงาน หลักประกันและ revision |
| ตรวจรับ | รับสินค้ารอตรวจ ตรวจคุณภาพ รับบางส่วน ปฏิเสธ ใบรับสินค้า และใบตรวจรับงานบริการ |
| คลังวัสดุ | SKU และ variant ยอดตาม location จองของ เบิกจ่าย โอน คืน ตรวจนับ และต้นทุนไซต์ |
| วางบิลและเจ้าหนี้ลูกหนี้ | วางบิลลูกค้า รับวางบิลผู้ขาย invoice credit และ debit note รับและจ่ายบางส่วนหลายใบ |
| การเงินและธนาคาร | เสนอจ่าย อนุมัติ ไฟล์ธนาคาร กระทบยอด เงินทดรอง ค่าใช้จ่าย เงินสดย่อยและ cash forecast |
| บัญชี | ผังบัญชี งวด Journal และ GL reversal ปิดงวด งบทดลอง งบการเงินและ source posting |
| ภาษีและนำส่ง | VAT WHT หนังสือรับรอง แบบภาษี การยื่น ชำระ หลักฐาน ยื่นเพิ่มเติม และภาษีอื่นตาม obligation |
| ระบบพ่วงและแพลตฟอร์ม | สินทรัพย์ ค่าเสื่อม QHSE การอบรม maintenance SLA tickets รายงาน worker เอกสาร สิทธิ์ backup และ monitoring |

ทุกหมวดใน launch scope ต้องผ่านการตรวจรับก่อนเปิดพร้อมกัน รายการที่ขึ้นกับข้อเท็จจริง เช่น ภาษีต่างประเทศ อากรตามตราสาร หรือเอกสารแรงงานเฉพาะประเภท ระบุ applicable หรือ not applicable พร้อมเหตุผลและผู้อนุมัติ ห้ามใช้ N/A ปิดงานหลักที่ยังไม่เสร็จ


## 4 กระบวนการเชื่อมงานทั้งบริษัท

แผนภาพสองวงจรหลัก Procure to Pay และ Order to Cash เชื่อมบัญชีและภาษีจาก source ที่อนุมัติ

ฝั่งซื้อเริ่มจากความต้องการและ PR ไป RFQ และ PO จากนั้นสินค้าผ่านใบตรวจรับก่อนเข้าคลัง ส่วนงานจ้างผ่านใบตรวจรับงานบริการ เจ้าหนี้และการจ่ายอ้างเอกสารที่ตรวจครบและไม่ลงต้นทุนซ้ำ

ฝั่งขายเริ่มจากสัญญาและคำสั่งซื้อ เชื่อมแผนกำลังคน หลักฐานปฏิบัติงาน การเรียกเก็บ วางบิล และรับเงิน แยก OT ที่จ่ายพนักงานออกจาก OT ที่เรียกเก็บลูกค้า และเก็บหลักฐานส่วนลดหรือหักค่าบริการ


## 5 ระบบภาษีและหลักฐานการนำส่ง

ข้อมูลภาษีผูกกับนิติบุคคลและสาขาตามทะเบียน มีวันที่มีผลและประวัติ เอกสารแต่ละฉบับเก็บ snapshot ของคู่ค้า ภาษี และกฎที่ใช้ การแก้ค่าพื้นฐานจึงไม่เปลี่ยนเอกสารที่ออกแล้ว

| กลุ่มงาน | ขอบเขตและการควบคุม |
| --- | --- |
| VAT | ภาษีซื้อและขาย แยกอัตราปกติ ศูนย์ ยกเว้นและนอกขอบเขต รวมสิทธิ์ภาษีซื้อและ ภ.พ.30 ตาม profile |
| WHT | ภาษีที่บริษัทหักและที่ลูกค้าหัก ภ.ง.ด.1 3 53 และ 50 ทวิ ตามประเภทเงินได้ คู่ค้าและการจ่ายจริง |
| ภาษีตามเงื่อนไข | ภ.พ.36 ภ.ง.ด.54 CIT ภ.ง.ด.50 และ 51 อากรแสตมป์ และแบบอื่นเมื่อบริษัทเข้าเงื่อนไข |
| การจัดทำแบบ | ดึง source ที่อนุมัติ ตรวจทะเบียน กระทบยอด ตรวจทาน อนุมัติ และตรึงเวอร์ชันพร้อม hash |
| ช่องทางนำส่ง | ไฟล์ตาม format ที่ผ่านเครื่องมือทางการ และ API เฉพาะแบบและสิทธิ์ที่ได้รับอนุมัติ พร้อม assisted mode |
| ผลยื่นและการชำระ | แยกส่งแล้ว กำลังประมวลผล รับแบบแล้ว และชำระยืนยัน ใช้ผลทางการกับหลักฐานธนาคาร |
| ยื่นเพิ่มเติม | สร้างเวอร์ชันอ้างต้นฉบับ แสดงส่วนต่างและเหตุผล เก็บหลักฐาน ไม่แก้แบบเดิมทับ |

### ข้อกำหนดที่ต้องยืนยันก่อนเปิดใช้

ฝ่ายบัญชีและผู้รับผิดชอบภาษีอนุมัติทะเบียน obligation จุดเกิดภาษี อัตรา ฐาน การปัดเศษ วันที่ครบกำหนด และกฎเฉพาะบริษัทจากแหล่งทางการ กฎที่ยังไม่ยืนยันคงสถานะรอตรวจและไม่ถูกใช้คำนวณจริง

ประกันสังคมและการส่งงบ DBD ใช้ทะเบียน ช่องทาง และหลักฐานแยกจากสรรพากร การสร้างไฟล์หรือได้รับ HTTP success เพียงอย่างเดียวไม่ใช้รับรองว่ายื่นหรือชำระสำเร็จ


## 6 โครงสร้างระบบและฐานข้อมูลเป้าหมาย

ต่อยอด Next.js TypeScript Prisma และ MySQL family ใน repository เดิมด้วย modular monolith แยกหน้าจอและ API ออกจาก service และกฎธุรกิจ ใช้ shared authorization approval numbering audit private document storage และ durable outbox ร่วมกัน

| ชั้นระบบ | หน้าที่และข้อมูลที่รับผิดชอบ |
| --- | --- |
| หน้าจอและ API | รับข้อมูลที่ตรวจรูปแบบแล้ว ตรวจ session และ scope ทุกคำสั่ง แสดง loading empty error และผลสำเร็จตามหลักฐาน |
| Application services | ควบคุม use case และ state transition ตรวจผู้อนุมัติ idempotency และเวอร์ชันข้อมูล |
| ข้อมูลพื้นฐาน | Organization และ Branch คู่ค้า พนักงาน ไซต์ วัสดุ UOM ราคา บัญชีและ tax profile versions |
| เอกสารธุรกิจ | PR quotation PO สัญญา inspection acceptance requisition invoice billing และ allocations |
| Ledger และการกระทบยอด | InventoryMovement Journal GL TaxLedger และ source posting พร้อมข้อมูลอ้างอิงและ reversal |
| งานภายนอก | worker ส่งและติดตามผลธนาคาร ภาษี email เอกสาร และ import ด้วย reference ที่ป้องกันรายการซ้ำ |
| ปฏิบัติการ | monitoring audit storage backup restore และการควบคุม dev test staging production |

### กฎข้อมูลที่บังคับใช้ร่วมกัน

- ยอดเงินใช้ Decimal และ currency ชัดเจน ไม่ใช้ Float คำนวณเงิน และกำหนด precision การปัดเศษตามนโยบาย
- ทุก ledger อ้าง source และ organization สอดคล้องกัน posted facts แก้ด้วย reversal หรือ adjustment ที่อนุมัติ
- เลขเอกสารออกด้วย transaction และ unique constraint ไม่ใช้ COUNT บวกหนึ่ง
- คง Client Supplier และ GoodsReceipt ของเดิม ใช้ additive migrations และตรวจ mapping ก่อนถอน legacy
- ขยายจาก 102 models ตามแบบข้อมูลเป้าหมายทีละชุด ไม่ถือว่าตารางที่มีแล้วคือ workflow ที่เสร็จแล้ว

## 7 แผนย้ายข้อมูลจากเว็บและ Excel

ใช้ source of truth ที่เจ้าของข้อมูลอนุมัติรายโมดูล หากเว็บและ Excel ต่างกัน ให้ระบบสร้างรายงานส่วนต่างและรอ decision ที่บันทึกผู้อนุมัติ ไม่เลือกข้อมูลใหม่กว่าหรือเขียนทับอัตโนมัติ

| ขั้น | การดำเนินการและหลักฐาน |
| --- | --- |
| 1 สำรวจ | ระบุ environment สคีมาจริง migration history ช่วงข้อมูล คู่มือและเจ้าของข้อมูล พร้อมรายการ sensitive fields |
| 2 สำรองและคืน | สำรอง DB และเอกสาร คืนบน authorized clone และยืนยันข้อมูล triggers และ checksums |
| 3 วิเคราะห์ | parse และ map ชื่อ/รหัส/สาขา วันที่และ UOM ตรวจ external links duplicate orphan และ SKU variants |
| 4 ตรวจส่วนต่าง | เทียบเว็บกับ Excel ตาม business key เก็บ conflict และ decision ของเจ้าของข้อมูลรายโมดูล |
| 5 ทดลองย้าย | validate preview error report และ dry run บน staging แก้ critical errors ก่อนอนุมัติ |
| 6 ยืนยันและนำเข้า | freeze file hash และ mapping version นำเข้าใน transaction แบบ retry ไม่ซ้ำ เก็บ source row lineage และ audit |
| 7 กระทบยอด | ตรวจ employee/assignment, stock qty/value, AR AP GL tax payroll และเอกสารที่เปิดค้าง ให้เจ้าของข้อมูลลงนาม |
| 8 Final cutover | หยุดแก้ข้อมูลตามเวลาที่อนุมัติ เก็บ final delta ย้ายครั้งสุดท้าย ตรวจยอดและเปิดทุกโมดูลพร้อมกัน |

ยอดเบิกวัสดุย้อนหลังไม่ใช้แทน opening stock ต้องมี quantity และ valuation ที่ตรวจนับหรือรับรองแล้ว เอกสารที่ยังไม่จบ เช่น PO ค้างรับ ลูกหนี้ค้าง เจ้าหนี้ค้าง เงินทดรอง และเครดิตภาษี ต้องมีบัญชีเปิดค้างและ source reference แยก

ใช้ Prisma migrations ที่ตรวจแล้ว ไม่ใช้ db push reset DROP หรือการ mark migration applied ทั้งชุดโดยไม่พิสูจน์ผล ทีมต้องซ้อมแผนกับสำเนาก่อนใช้กับฐานจริง


## 8 แผนพัฒนาและหมุดหมายการส่งมอบ

พัฒนาและทดสอบเป็นชุดภายใน dev และ staging เพื่อควบคุม dependency แต่การเปิดให้ลูกค้าจริงเป็นครั้งเดียวหลังผ่าน UAT ครบ launch scope ชุดงาน A0 ถึง A7 เชื่อม phase P0 ถึง P8 ของแผนเดิมและรายละเอียด 44 งานในภาคผนวก ก

| ชุดงาน | สิ่งส่งมอบและเงื่อนไขผ่าน |
| --- | --- |
| A0 ความพร้อม | baseline clone restore IAM และ payroll ที่ใช้ข้อมูลจริงผ่านก่อนนำยอดเข้าบัญชีหรือแบบภาษี |
| A1 พื้นฐานและ GL | บริษัท สาขา VAT คู่ค้า approval เลขเอกสาร ผังบัญชี งวด และ balanced journal |
| A2 คลัง | ต่อ service P3 เป็น workflow API และ UI ครบ reservation ตรวจรับ ยืนยันรับและกระทบยอด |
| A3 ซื้อและจ้าง | PR RFQ PO สัญญาจ้าง QC acceptance invoice match วางบิลผู้ขายและเจ้าหนี้ |
| A4 ขายและการเงิน | customer order billing invoice AR payment bank files และ statement reconciliation |
| A5 ภาษี | tax rules registers certificates approved returns channels evidence payment และแก้ไขเพิ่มเติม |
| A6 ระบบบริษัท | workforce payroll SSO assets expenses SLA maintenance รายงานและข้อมูลส่วนบุคคลตาม scope |
| A7 เปิดใช้งาน | integration browser security restore UAT training final migration และลงนาม go live |

### การจัดทำกำหนดการและควบคุมงบ

หลังสำรวจ A0 และยืนยัน master rules ใน A1 ให้ทีมแตก 44 งานเป็น implementation tasks ประเมิน effort dependency และจำนวนคน แล้วเสนอ baseline schedule พร้อมต้นทุนพัฒนา ย้ายข้อมูล ทดสอบ อบรม และดูแลระบบให้ผู้ว่าจ้างอนุมัติ รวมค่าใช้จ่ายประจำด้าน hosting storage backup provider certificates และ maintenance

ยังไม่มีข้อมูลยืนยันขนาดทีม อัตราค่าบริการ และวงเงิน จึงไม่กำหนดราคาหรือวันเปิดระบบเป็นข้อผูกพันในฉบับนี้ การเปลี่ยน scope กฎ ข้อมูล หรือช่องทาง provider หลังอนุมัติ ต้องมี impact assessment และ change request ก่อนปรับแผนฐาน


## 9 ผู้รับผิดชอบ สิทธิ์และการกำกับงาน

| งานกำกับ | ผู้ดำเนินการ | ผู้อนุมัติ |
| --- | --- | --- |
| ขอบเขตและแผนฐาน | หัวหน้าโครงการร่วมกับเจ้าของกระบวนการ | ผู้บริหารหรือผู้สนับสนุนโครงการ |
| ข้อมูลบริษัทและภาษี | ฝ่ายบัญชีและผู้รับผิดชอบภาษี | ผู้มีอำนาจของบริษัท |
| Payroll และกำลังคน | HR และ Operations | ผู้รับผิดชอบ HR และการเงินตามอำนาจ |
| จัดซื้อ ตรวจรับ คลัง | Procurement ผู้ตรวจรับและ Warehouse | ผู้มีอำนาจตามวงเงินและ scope |
| รับจ่ายและธนาคาร | AR AP Treasury | ผู้อนุมัติและผู้ปล่อยจ่ายที่แยกหน้าที่ |
| บัญชีและปิดงวด | ผู้จัดทำบัญชีและผู้ตรวจทาน | ผู้รับผิดชอบบัญชีตามอำนาจ |
| ทดสอบและย้ายข้อมูล | Tech QA Ops และเจ้าของข้อมูล | เจ้าของกระบวนการและหัวหน้าโครงการ |
| เปิดระบบจริง | ทีมโครงการและ Operations | ผู้บริหารหลังรับรอง UAT และ go live checklist |

### การแยกหน้าที่และความปลอดภัย

- ผู้สร้างไม่เป็น final approver ของ requisition PO adjustment invoice payment และ payroll ผู้จัดทำ journal ไม่เป็น poster และผู้จัดทำแบบภาษีไม่เป็น final approver
- ใช้ UserRoleAssignment RolePermission และ resource scope เป็นสิทธิ์หลัก ตรวจซ้ำที่ server และฐานข้อมูลก่อน query หรือ mutation
- แยกสิทธิ์เงินเดือน บัญชีธนาคาร เอกสารภาษีและ export มี masking การอนุมัติเปลี่ยนบัญชี และ audit การเข้าถึง
- เก็บ private documents และ secrets แยกจาก Git ใช้ HTTPS และ environment แยก พร้อม retention และ legal hold ที่บริษัทอนุมัติ
บริษัทแต่งตั้งชื่อผู้รับผิดชอบจริงและผู้แทนตามบทบาทก่อนเริ่ม migration และ UAT ส่วนลงนามท้ายเอกสารใช้บันทึกผู้มีอำนาจและเงื่อนไขที่อนุมัติ


## 10 แผนทดสอบและเกณฑ์ตรวจรับ

ผลรับรองต้องผูกกับ release commit environment ชุดข้อมูล กฎเวอร์ชัน และผู้ตรวจรับ รายการที่ไม่ได้ทดสอบระบุ NOT RUN หรือ BLOCKED ไม่แสดง PASS แทน

| กรณี | หัวข้อ | เกณฑ์ตรวจรับ |
| --- | --- | --- |
| U01 | VAT และสาขา | วันที่มีผลถูกต้อง ใบเก่าคง snapshot และสิทธิ์ภาษีซื้อแยกชัด |
| U02 | ซื้อสินค้า | GR คลัง GRNI AP ภาษีซื้อ และจ่าย กระทบตรงโดยไม่ลงต้นทุนซ้ำ |
| U03 | QC และคืนผู้ขาย | รับบางส่วน ปฏิเสธ คืน และลดหนี้อ้าง source และจำนวนถูกต้อง |
| U04 | งานจ้าง | ตรวจรับตามผลงาน retention WHT และ AP โดยไม่เพิ่มสต็อกบริการ |
| U05 | ค่าบริการลูกค้า | fixed headcount OT holiday deductions อ้างสัญญาและหลักฐาน |
| U06 | ลูกค้าหักภาษี | ยอดเงินสดและ WHT credit รวมปิด AR ได้ โดยไม่มีเงินสดสมมติ |
| U07 | จ่ายหักภาษี | ปิด AP ด้วย bank และ WHT payable แล้วนำส่งภาษีครั้งเดียว |
| U08 | คลังและต้นทุน | WAC โอน คืน count และ landed cost ตรง ledger balance และ GL |
| U09 | แบบ VAT | register return credit และ control accounts กระทบตรง |
| U10 | ยื่นเพิ่มเติม | เก็บ original version และส่วนต่าง ไม่รวม source หรือจ่ายซ้ำ |
| U11 | ส่งข้อมูลภายนอก | timeout UNKNOWN ใช้ reference เดิมและตรวจ callback ซ้ำ |
| U12 | ธนาคาร | ผลจริง partial failed และ statement กระทบได้ ไม่ปิด PAID ก่อนยืนยัน |
| U13 | ปิดงวดและ reversal | กัน post งวดปิดและตรวจยอดสุทธิ original รวม reversal ถูกต้อง |
| U14 | Payroll | period attendance OT YTD ภาษี SSO และยอดธนาคารตรงกัน |
| U15 | สิทธิ์และ SoD | กันข้ามบริษัท ไซต์ ฟิลด์ ผู้อนุมัติตนเองและ session ที่หมดสิทธิ์ |
| U16 | นำเข้า | preview conflict hashes และ retry ไม่สร้างข้อมูลซ้ำ |
| U17 | คืนระบบ | คืน DB เอกสารและ triggers แล้วตรวจยอดและแผนกลับได้จริง |
| U18 | รายงาน | AR AP stock GL tax cash และกำไรไซต์ trace ถึง source |

Quality gates ฝั่ง implementation ได้แก่ Prisma validate generate migrate status typecheck unit และ integration tests route check production build และ Playwright ที่ตรง workflow รวมการทดสอบ engine/provider บน staging และการลงนามรับรองยอดของบริษัท


## 11 แผนเปิดใช้งาน ความเสี่ยงและการส่งมอบ

### เปิดทุกโมดูลพร้อมกันหลังผ่าน UAT

ก่อนวันเปิด ให้บริษัทอนุมัติ final migration rehearsal รายงานยอด รายการเอกสารเปิดค้าง ผู้ใช้และสิทธิ์ คู่มือ และผู้รับผิดชอบ support จากนั้นประกาศช่วงหยุดแก้เว็บและ Excel เก็บ final delta ย้ายข้อมูล ตรวจยอดและ runtime smoke แล้วผู้มีอำนาจอนุมัติเปิดจริง

หากเงื่อนไข UAT ข้อมูล ภาษี provider หรือ restore ยังไม่ผ่าน ให้เลื่อน go live โดยพัฒนาต่อบน staging ก่อนการส่งภายนอกจริงสามารถคืน application version ที่เข้ากันได้ แต่หลังเกิดการจ่ายหรือแบบที่ได้รับแล้ว ต้องใช้ reconciliation และ forward correction ไม่ restore ทับหลักฐานธุรกรรมภายนอก

| ความเสี่ยง | มาตรการและผู้รับผิดชอบ |
| --- | --- |
| ข้อมูลเว็บกับ Excel ขัดกัน | เจ้าของข้อมูลอนุมัติ conflict รายโมดูล พร้อม hash mapping และ control totals |
| ฐานเดิมไม่ตรง migration | Tech และ Ops สำรอง คืนบน clone และตรวจผลของแต่ละ migration ก่อน baseline |
| กฎเงินเดือน ภาษีหรือ billing ไม่ยืนยัน | HR บัญชีและ Operations ลงนาม rule matrix ก่อนคำนวณจริง |
| provider หรือ API ไม่พร้อม | ใช้ช่องทางไฟล์หรือ assisted ที่อนุมัติ และเปิด API เฉพาะ capabilities ที่ทดสอบแล้ว |
| ข้อมูลลับหรือการอนุมัติผิด | Security และ Finance ใช้ scope masking maker checker verified bank และ audit |
| เปิดพร้อมกันมีผลกระทบกว้าง | ซ้อม cutover ทั้งวงจร มี go no go checklist ผู้ตัดสินใจและ support owner |

### สิ่งส่งมอบและการควบคุมการเปลี่ยนแปลง

ส่งมอบ source code และ migrations ที่ review แล้ว แบบข้อมูลและ API เอกสารกฎและ mapping ผลทดสอบ UAT คู่มือผู้ใช้และผู้ดูแล วิธี backup restore deploy rollback และทะเบียนผู้รับผิดชอบ ใช้ issue และ change request บันทึกผลต่อ scope effort งบ วันส่งมอบและการทดสอบ ก่อนอนุมัติเปลี่ยนแผน

หลังเปิดระบบให้มีผู้รับเรื่อง ช่องทางแจ้งปัญหา การจัดระดับความรุนแรง การติดตามคิวและยอดผิดปกติ รวมถึงการส่งต่อเจ้าของธุรกิจ รายละเอียดเวลาบริการและเงื่อนไขดูแลให้ระบุในข้อตกลงการให้บริการที่บริษัทอนุมัติ


## ภาคผนวก ก งานส่งมอบ 1 ถึง 9

44 งานนี้เป็น delivery tickets หรือ epics ขนาดต่างกัน ทีมต้องแตกงานย่อยและประเมิน effort ก่อนอนุมัติแผนฐาน

| รหัส | งาน ผลส่งมอบและเงื่อนไขผ่าน | ผู้ตรวจรับ |
| --- | --- | --- |
| ERP-001 | ตรวจ baseline DB บน authorized clone / เกณฑ์ผ่าน schema/types/FKs/defaults/data migration effects เทียบได้; ไม่ blind resolve / Dependency backup/access | เทคนิค และ ปฏิบัติการระบบ |
| ERP-002 | Backup/restore/monitoring จริง / เกณฑ์ผ่าน restore DB+documents+triggers สำเร็จ มี checksum/เวลา/ผู้ตรวจ; UI ไม่แสดง mock verified / Dependency ERP-001 | ปฏิบัติการระบบ และ ผู้มีอำนาจ |
| ERP-003 | ปิด IAM/session/scope activation/reset gaps / เกณฑ์ผ่าน active/expired/revoked/cross-org/field tests; office/site login regression ผ่าน / Dependency baseline | ความปลอดภัย และ QA |
| ERP-004 | แก้ payroll demo calculation / เกณฑ์ผ่าน period-bounded attendance, actual OT, Decimal, YTD tax/SSO versioned; sample reconciliation / Dependency approved HR rules | HR และ บัญชี |
| ERP-005 | ข้อมูลบริษัท/สาขา/ทะเบียนภาษี / เกณฑ์ผ่าน เลือก VAT status/effective dates/evidence; branch identity; profile changeไม่แก้ใบเก่า / Dependency ERP-003 | ภาษี และ ผู้มีอำนาจ |
| ERP-006 | Client/Supplier/Employee tax and bank masters / เกณฑ์ผ่าน identity/branch/effective history, masked fields, dual-approved beneficiary change / Dependency ERP-005 | การเงิน และ HR |
| ERP-007 | Approval/SoD/delegation engine / เกณฑ์ผ่าน amount/context authority, creator!=approver, snapshot/version bound, audit / Dependency ERP-003/005 | ผู้มีอำนาจ และ ความปลอดภัย |
| ERP-008 | Document sequence/storage/version / เกณฑ์ผ่าน concurrent number allocation, void history, private immutable artifacts, authorized download / Dependency ERP-005 | บัญชี และ QA |
| ERP-009 | COA/year/period/mappings / เกณฑ์ผ่าน reviewed chart, reporting map, nonoverlap periods/account validity and close controls / Dependency ERP-005 | บัญชี |


## ภาคผนวก ก งานส่งมอบ 10 ถึง 18

44 งานนี้เป็น delivery tickets หรือ epics ขนาดต่างกัน ทีมต้องแตกงานย่อยและประเมิน effort ก่อนอนุมัติแผนฐาน

| รหัส | งาน ผลส่งมอบและเงื่อนไขผ่าน | ผู้ตรวจรับ |
| --- | --- | --- |
| ERP-010 | Journal/GL/reversal/report engine / เกณฑ์ผ่าน balanced posting/immutable posted/closed-period rejection/source dedupe; trial balance / Dependency ERP-007/009 | บัญชี และ QA |
| ERP-011 | SKU/UOM/warehouse/legacy mapping CRUD / เกณฑ์ผ่าน preview SKU variants; leading zeros; UOM/effective conversions; scoped Thai UI / Dependency ERP-003/005 | คลัง |
| ERP-012 | Requisition lifecycle/acknowledgement / เกณฑ์ผ่าน create/submit/review/approve/partial issue/receive/cancel, no double stock decrement / Dependency ERP-007/011 | ไซต์ และ คลัง |
| ERP-013 | Stock reservations/count/transit/returns / เกณฑ์ผ่าน available vs on-hand, stale count, partial transit receive, supplier/internal return distinctions / Dependency ERP-012 | คลัง |
| ERP-014 | Stock→GL / landed-cost bridge / เกณฑ์ผ่าน consume inventory.posted once; qty/value/GL reconcile; consumed cost allocation / Dependency ERP-010/013 | คลัง และ บัญชี |
| ERP-015 | PR demand/budget approval / เกณฑ์ผ่าน linked demand allocation, duplicate request guard, authorized emergency route / Dependency ERP-007/011 | จัดซื้อ |
| ERP-016 | RFQ/quote/evaluation / เกณฑ์ผ่าน quotes versioned, comparison/evidence, vendor selection approved by policy / Dependency ERP-015 | จัดซื้อ และ ผู้มีอำนาจ |
| ERP-017 | PO / Work contract / change order / เกณฑ์ผ่าน approved revision, lines classify goods/service, milestones/retention/send log / Dependency ERP-007/008/016 | จัดซื้อ |
| ERP-018 | Inbound inspection / service acceptance / เกณฑ์ผ่าน partial accept/reject; approved goods→GR; services→acceptance, no phantom stock / Dependency ERP-017/012 | ผู้ตรวจรับ และ ไซต์ |


## ภาคผนวก ก งานส่งมอบ 19 ถึง 27

44 งานนี้เป็น delivery tickets หรือ epics ขนาดต่างกัน ทีมต้องแตกงานย่อยและประเมิน effort ก่อนอนุมัติแผนฐาน

| รหัส | งาน ผลส่งมอบและเงื่อนไขผ่าน | ผู้ตรวจรับ |
| --- | --- | --- |
| ERP-019 | Supplier invoice / matching / AP / เกณฑ์ผ่าน duplicate invoice guard, PO/GR/service match, overbilling exceptions, approved AP / Dependency ERP-010/018 | AP และ บัญชี |
| ERP-020 | Vendor billing / payment request / เกณฑ์ผ่าน billing evidence, due schedule, multi-invoice partial allocation/advances/retention / Dependency ERP-019/007 | การเงิน |
| ERP-021 | Customer order / contract rates / SLA / เกณฑ์ผ่าน approved customer order and effective commercial pricing / Dependency ERP-006/007 | ขาย และ Operations |
| ERP-022 | Service evidence → billing calculation / เกณฑ์ผ่าน approved headcount/OT/holiday/deduction sources; client period and payroll period independent / Dependency ERP-004/021 | Operations และ วางบิล |
| ERP-023 | Invoice / tax document / credit-debit / เกณฑ์ผ่าน no unapproved issue; immutable snapshot, concurrent numbers, capped credit/reversal / Dependency ERP-008/010/022 + tax contract | วางบิล และ ภาษี |
| ERP-024 | Customer billing / collections / AR / เกณฑ์ผ่าน billing acknowledgement, multiple/partial receipts, unallocated cash, aging, WHT certificate follow-up / Dependency ERP-023 | AR และ การเงิน |
| ERP-025 | Bank/payments/statements/reconcile / เกณฑ์ผ่าน maker/checker/releaser, transaction results, timeout UNKNOWN, no duplicate release, split-match / Dependency ERP-006/020/024 | การเงิน และ QA |
| ERP-026 | Tax rules/points/events/registers / เกณฑ์ผ่าน approved effective rules, no ambiguous fallback, recoverable/nonrecoverable VAT, WHT/CIT classifications / Dependency ERP-005/006/010 | ภาษี และ บัญชี |
| ERP-027 | WHT certificate issuing/receiving / เกณฑ์ผ่าน domestic/foreign/form selection review, partial/gross-up cases, original/replacement/e-WHT dedupe / Dependency ERP-025/026 | ภาษี |


## ภาคผนวก ก งานส่งมอบ 28 ถึง 36

44 งานนี้เป็น delivery tickets หรือ epics ขนาดต่างกัน ทีมต้องแตกงานย่อยและประเมิน effort ก่อนอนุมัติแผนฐาน

| รหัส | งาน ผลส่งมอบและเงื่อนไขผ่าน | ผู้ตรวจรับ |
| --- | --- | --- |
| ERP-028 | VAT/WHT return snapshot/reconciliation / เกณฑ์ผ่าน source provenance, branch/group totals, locked approved versions, credit/claim exceptions / Dependency ERP-026/027 | ภาษี และ ผู้อนุมัติ |
| ERP-029 | Tax calendar/due-date engine / เกณฑ์ผ่าน form/channel/fiscal/holiday/extension evidence, original/effective dates, alerts / Dependency ERP-005/026 | ภาษี |
| ERP-030 | Assisted export/filing/evidence / เกณฑ์ผ่าน official-format validation, user submission evidence, accepted/payment states distinct, amendment trace / Dependency ERP-028/029 | ภาษี และ QA |
| ERP-031 | RD/provider API/e-WHT/e-Tax/e-Stamp / เกณฑ์ผ่าน per-form capability, sandbox proof, timeout polling, callback verification/deduplication / Dependency ERP-030 + approved credentials | เชื่อมระบบ และ ภาษี |
| ERP-032 | Tax payment and GL reconcile / เกณฑ์ผ่าน official liability/payin, payment evidence, no double liability/payment posting / Dependency ERP-025/028 | ภาษี และ Treasury |
| ERP-033 | CIT/foreign/stamp computation / เกณฑ์ผ่าน approved applicability, schedules/treaty/instrument evidence, form/version adapters / Dependency ERP-010/026/032 | ภาษี และ ผู้ทำบัญชี |
| ERP-034 | Payroll/SSO/year-end adjacent filings / เกณฑ์ผ่าน net-pay/bank/WHT/SSO liabilities reconcile; authority-specific evidence / Dependency ERP-004/010/025/026 | HR และ บัญชี |
| ERP-035 | Expense/advances/petty cash/assets / เกณฑ์ผ่าน authorized claims/clearance, asset cost/depreciation/reversal/book-tax differences / Dependency ERP-007/010/025 | การเงิน |
| ERP-036 | Controlled master/history imports / เกณฑ์ผ่าน parse/map/validate/preview/error/confirm/transaction/audit; external links and file hashes handled / Dependency ERP-001/005/011 | ข้อมูล และ ผู้มีอำนาจ |


## ภาคผนวก ก งานส่งมอบ 37 ถึง 44

44 งานนี้เป็น delivery tickets หรือ epics ขนาดต่างกัน ทีมต้องแตกงานย่อยและประเมิน effort ก่อนอนุมัติแผนฐาน

| รหัส | งาน ผลส่งมอบและเงื่อนไขผ่าน | ผู้ตรวจรับ |
| --- | --- | --- |
| ERP-037 | Customer tickets/quality/doc expiry / เกณฑ์ผ่าน persistent service issue→inspection/CAPA→approved adjustment; conditional compliance evidence / Dependency ERP-021/022 | Operations |
| ERP-038 | Reports/site cost/profit/budget / เกณฑ์ผ่าน no double counting at GR/AP/payment; statement mappings and cross-scope negative tests / Dependency posted source integrations | ผู้บริหาร และ บัญชี |
| ERP-039 | Workers/inbox/provider observability / เกณฑ์ผ่าน durable claims/retry/DLQ/alert/replay; persisted event not shown as delivered / Dependency all integration contracts | ปฏิบัติการระบบ และ เทคนิค |
| ERP-040 | Integrated UAT / migration rehearsal / release / เกณฑ์ผ่าน signed scenarios, restore/rollback, release gates and trained owners / Dependency required launch tickets | ผู้มีอำนาจ และ QA และ ปฏิบัติการระบบ |
| ERP-041 | Workforce lifecycle/assignment/shift/correction/deployment / เกณฑ์ผ่าน effective assignments, joining/leaving checklist, correction before payroll freeze, dispatch evidence; foreign-document tracking when applicable / Dependency ERP-003/006/007 | HR และ Operations |
| ERP-042 | Employee self-service/mobile/offline/language / เกณฑ์ผ่าน published payslip privacy, profile/locale/security actions, offline conflict/idempotent sync and real-device tests / Dependency ERP-003/004/041 | HR และ QA |
| ERP-043 | Fleet/QHSE/training/maintenance workflows / เกณฑ์ผ่าน selected use cases persist/approve/evidence/cost-link; existing read models are not DONE / Dependency approved company scope + ERP-007/010 | Operations |
| ERP-044 | Data protection/retention/export controls / เกณฑ์ผ่าน classified fields, masked views, purpose/consent where applicable, audited export, retention/legal hold and deletion controls / Dependency ERP-003/006/008 | ความปลอดภัย และ ผู้มีอำนาจ |


## ภาคผนวก ข ประเด็นตรวจติดตาม 1 ถึง 12

ผล source และ workbook audit ที่ฐานเดิม ไม่ใช่การรับรอง production และไม่หมายความว่าทั้ง 48 ระบบไม่มีอยู่เลย

| รหัส | ระบบหรือเรื่องที่ตรวจ | สถานะและระดับ | งานอ้างอิง |
| --- | --- | --- | --- |
| G01 | บริษัท/สาขา/ทะเบียน VAT | ยังไม่พบส่วนที่ระบุ / HIGH | ERP-005 |
| G02 | ลูกค้า/ผู้ขาย/ผู้ติดต่อ/ธนาคารคู่ค้า | มีบางส่วน / HIGH | ERP-006 |
| G03 | activation/reset/password policy production | มีบางส่วน / CRITICAL | ERP-003 |
| G04 | สิทธิ์รายบริษัท/ไซต์/ฟิลด์ | มีบางส่วน / CRITICAL | ERP-003, ERP-007 |
| G05 | ประวัติ/ข้อมูลลับพนักงาน | มีบางส่วน / HIGH | ERP-006, ERP-036, ERP-044 |
| G06 | รับเข้า/พ้นสภาพ/คืนทรัพย์สินพนักงาน | มีบางส่วน / HIGH | ERP-041 |
| G07 | เอกสารแรงงานต่างชาติ/อายุเอกสาร | ขึ้นกับข้อเท็จจริง / MEDIUM | ERP-041 |
| G08 | สัญญาลูกค้าและกำลังคนตามสัญญา | มีบางส่วน / HIGH | ERP-021, ERP-041 |
| G09 | กะ/ตาราง/OT/หยุด/ลา | มีบางส่วน / HIGH | ERP-004, ERP-041 |
| G10 | ขอแก้เวลาและอนุมัติ | มีบางส่วน / HIGH | ERP-041 |
| G11 | Payroll จาก period จริง | มีบางส่วน / CRITICAL | ERP-004 |
| G12 | Payroll review/finalize/tax/SSO | มีบางส่วน / CRITICAL | ERP-004, ERP-034 |

รายละเอียดหลักฐานและเหตุผลรายข้ออยู่ใน Company System Gap Audit ที่อ้างอิงท้ายเอกสาร ประเด็น conditional ต้องให้บริษัทตัดสิน applicability ก่อนอนุมัติ launch scope


## ภาคผนวก ข ประเด็นตรวจติดตาม 13 ถึง 24

ผล source และ workbook audit ที่ฐานเดิม ไม่ใช่การรับรอง production และไม่หมายความว่าทั้ง 48 ระบบไม่มีอยู่เลย

| รหัส | ระบบหรือเรื่องที่ตรวจ | สถานะและระดับ | งานอ้างอิง |
| --- | --- | --- | --- |
| G13 | Payslip ที่อนุมัติและเผยแพร่ | มีบางส่วน / HIGH | ERP-004, ERP-042 |
| G14 | ใบส่งตัว/ย้ายไซต์/ผู้รับรอง | มีบางส่วน / HIGH | ERP-041 |
| G15 | CRM/เสนอราคา/สัญญาและต่ออายุ | มีบางส่วน / HIGH | ERP-021 |
| G16 | คำสั่งซื้อจากลูกค้า | ยังไม่พบส่วนที่ระบุ / HIGH | ERP-021 |
| G17 | ตรวจรับบริการลูกค้า/ข้อร้องเรียน/SLA | ยังไม่พบส่วนที่ระบุ / HIGH | ERP-022, ERP-037 |
| G18 | คำนวณค่าบริการรายสัญญา/ไซต์ | ยังไม่พบส่วนที่ระบุ / HIGH | ERP-022 |
| G19 | Invoice/TaxInvoice/credit/debit lifecycle | มีบางส่วน / HIGH | ERP-008, ERP-023 |
| G20 | วางบิลลูกค้า/รับวางบิล | ยังไม่พบส่วนที่ระบุ / HIGH | ERP-024 |
| G21 | AR รับบางส่วน/หลายใบ/WHT ถูกหัก | มีบางส่วน / HIGH | ERP-024 |
| G22 | PR/RFQ/เปรียบเทียบราคา/PO | มีบางส่วน / HIGH | ERP-015, ERP-016, ERP-017 |
| G23 | จัดจ้าง/BOQ/milestone/retention | ยังไม่พบส่วนที่ระบุ / HIGH | ERP-017, ERP-018 |
| G24 | ตรวจรับสินค้า/QC/รับบางส่วน/ปฏิเสธ | มีบางส่วน / HIGH | ERP-018 |

รายละเอียดหลักฐานและเหตุผลรายข้ออยู่ใน Company System Gap Audit ที่อ้างอิงท้ายเอกสาร ประเด็น conditional ต้องให้บริษัทตัดสิน applicability ก่อนอนุมัติ launch scope


## ภาคผนวก ข ประเด็นตรวจติดตาม 25 ถึง 36

ผล source และ workbook audit ที่ฐานเดิม ไม่ใช่การรับรอง production และไม่หมายความว่าทั้ง 48 ระบบไม่มีอยู่เลย

| รหัส | ระบบหรือเรื่องที่ตรวจ | สถานะและระดับ | งานอ้างอิง |
| --- | --- | --- | --- |
| G25 | ใบตรวจรับงานบริการ | ยังไม่พบส่วนที่ระบุ / HIGH | ERP-018 |
| G26 | หน้าข้อมูลวัสดุ/คลัง/UOM/variant | มีบางส่วน / HIGH | ERP-011 |
| G27 | รับจ่าย/ต้นทุน/โอน/คืนภายใน | ทดสอบภายในแล้ว / HIGH | ERP-012, ERP-014 |
| G28 | จองของ/transit/คืนผู้ขาย/lot/expiry | มีบางส่วน / HIGH/MEDIUM | ERP-013 |
| G29 | ตรวจ invoice ผู้ขาย/three-way match/รับวางบิล | มีบางส่วน / HIGH | ERP-019, ERP-020 |
| G30 | เสนอจ่าย/ธนาคาร/statement reconcile | มีบางส่วน / CRITICAL | ERP-025 |
| G31 | เงินทดรอง/เบิกค่าใช้จ่าย/เงินสดย่อย | ยังไม่พบส่วนที่ระบุ / HIGH | ERP-035 |
| G32 | ผังบัญชี/Journal/GL/ปิดงวด/งบ | ยังไม่พบส่วนที่ระบุ / CRITICAL | ERP-009, ERP-010 |
| G33 | สินทรัพย์/ค่าเสื่อม/จำหน่าย | มีบางส่วน / MEDIUM | ERP-010, ERP-035 |
| G34 | VAT/WHT registers และ rule versions | ยังไม่พบส่วนที่ระบุ / CRITICAL | ERP-026, ERP-027 |
| G35 | จัดทำแบบ/ยื่น/ชำระ/หลักฐาน/เพิ่มเติม | ยังไม่พบส่วนที่ระบุ / CRITICAL | ERP-028, ERP-029, ERP-030, ERP-031, ERP-032 |
| G36 | CIT/foreign payment/stamp obligations | ขึ้นกับข้อเท็จจริง / HIGH | ERP-033 |

รายละเอียดหลักฐานและเหตุผลรายข้ออยู่ใน Company System Gap Audit ที่อ้างอิงท้ายเอกสาร ประเด็น conditional ต้องให้บริษัทตัดสิน applicability ก่อนอนุมัติ launch scope


## ภาคผนวก ข ประเด็นตรวจติดตาม 37 ถึง 48

ผล source และ workbook audit ที่ฐานเดิม ไม่ใช่การรับรอง production และไม่หมายความว่าทั้ง 48 ระบบไม่มีอยู่เลย

| รหัส | ระบบหรือเรื่องที่ตรวจ | สถานะและระดับ | งานอ้างอิง |
| --- | --- | --- | --- |
| G37 | ประกันสังคม/DBD/งานยื่นหน่วยงานอื่น | ยังไม่พบส่วนที่ระบุ / HIGH | ERP-010, ERP-034 |
| G38 | งบประมาณ/commitment/กำไรไซต์ | มีบางส่วน / HIGH | ERP-015, ERP-038 |
| G39 | Fleet/QHSE/Training/maintenance | มีบางส่วน / MEDIUM | ERP-043 |
| G40 | Customer support/ticket/service quality | ข้อมูลแสดงผลจำลอง / MEDIUM | ERP-037 |
| G41 | Controlled imports ทั้งบริษัท | มีบางส่วน / CRITICAL | ERP-036 |
| G42 | เอกสาร/เลขที่/version/signature/archive | มีบางส่วน / HIGH | ERP-008 |
| G43 | worker/แจ้งเตือน/providers/monitoring | มีบางส่วน / HIGH | ERP-039 |
| G44 | Backup/restore/DR | ยังไม่รับรองผลจริง / CRITICAL | ERP-002 |
| G45 | ข้อมูลส่วนบุคคล/retention/สิทธิ์ export | มีบางส่วน / HIGH | ERP-044 |
| G46 | UAT/E2E/load/CI/release ownership | ยังไม่รับรองผลจริง / CRITICAL | ERP-040 |
| G47 | พอร์ทัลพนักงาน/offline/ภาษา/บัญชีตนเอง | มีบางส่วน / MEDIUM | ERP-042 |
| G48 | Legacy database baseline | ยังไม่รับรองผลจริง / CRITICAL | ERP-001 |

รายละเอียดหลักฐานและเหตุผลรายข้ออยู่ใน Company System Gap Audit ที่อ้างอิงท้ายเอกสาร ประเด็น conditional ต้องให้บริษัทตัดสิน applicability ก่อนอนุมัติ launch scope


## เอกสารอ้างอิงและคำศัพท์สำคัญ

ฐานข้อมูลอ้างอิงเป็น source code และเอกสารที่ตรวจวันที่ 22 พฤศจิกายน 2569 ร่วมกับข้อตกลงผู้ว่าจ้างในแชตวันที่ 22 ถึง 23 พฤศจิกายน 2569 ไฟล์ Excel ใช้ตรวจโครงสร้าง 50 ชีตโดยไม่เผยข้อมูลรายบุคคล เอกสารนี้ไม่ได้รับรองสูตรจาก cached values

- R01 [โครงสร้าง ERP รวมทั้งบริษัท](https://github.com/pharmacisttom/smartjeff/blob/5dd38b5d7ba8a266f06b83da8c2f07aec4050bbd/docs/SMARTOP_INTEGRATED_ERP_BLUEPRINT.md)
- R02 [แบบข้อมูลและจุดเชื่อมระบบ](https://github.com/pharmacisttom/smartjeff/blob/5dd38b5d7ba8a266f06b83da8c2f07aec4050bbd/docs/SMARTOP_ERP_INTEGRATION_DATA_MODEL.md)
- R03 [แผนงาน 44 งานและเกณฑ์ตรวจรับ](https://github.com/pharmacisttom/smartjeff/blob/5dd38b5d7ba8a266f06b83da8c2f07aec4050bbd/docs/SMARTOP_ERP_DELIVERY_BACKLOG.md)
- R04 [ผลตรวจช่องว่าง 48 ประเด็น](https://github.com/pharmacisttom/smartjeff/blob/5dd38b5d7ba8a266f06b83da8c2f07aec4050bbd/docs/SMARTOP_COMPANY_SYSTEM_GAP_AUDIT.md)
- R05 [ระบบภาษีนำส่งและทะเบียนแหล่งอ้างอิง](https://github.com/pharmacisttom/smartjeff/blob/5dd38b5d7ba8a266f06b83da8c2f07aec4050bbd/docs/SMARTOP_TAX_FILING_DESIGN.md)
- R06 [แบบภาษีมูลค่าเพิ่ม กรมสรรพากร](https://www.rd.go.th/62381.html)
- R07 [แบบภาษีหัก ณ ที่จ่าย กรมสรรพากร](https://www.rd.go.th/7064.html)
- R08 [ข้อมูล API การยื่นแบบ กรมสรรพากร](https://efiling.rd.go.th/rd-cms/api)
- R09 [มาตรฐานธุรกรรมภาษีอิเล็กทรอนิกส์](https://www.rd.go.th/65244.html)
- R10 [SSO e Service](https://www.sso.go.th/eservices/esv/txn1d05.do)
- R11 [คู่มือ DBD e Filing](https://efiling.dbd.go.th/efiling-documents/SubmitManual.pdf)
แหล่งสรรพากรและหน่วยงานรัฐเป็นแนวทางออกแบบที่ตรวจในรอบก่อนหน้า ฝ่ายบัญชีต้องตรวจเวอร์ชันกฎหมาย แบบ taxonomy และสิทธิ์ช่องทางอีกครั้งก่อนใช้งานจริง โดยเก็บผลทบทวนใน rule register

| คำศัพท์ | ความหมาย |
| --- | --- |
| UAT | บริษัททดสอบและรับรอง workflow กับยอดตามกรณีใช้งานจริง |
| Staging | ระบบซ้อมก่อน production ที่แยกฐานข้อมูล credentials และ storage |
| SoD | การแยกหน้าที่ผู้สร้าง ผู้ตรวจ ผู้อนุมัติและผู้ปล่อยรายการ |
| GL และ WAC | บัญชีแยกประเภท และการคิดต้นทุนเฉลี่ยถ่วงน้ำหนักของสต็อก |
| Baseline และ cutover | ฐานข้อมูลและแผนอ้างอิงที่รับรองแล้ว และช่วงตัดเข้าสู่ระบบใหม่ |


## การพิจารณาอนุมัติและการลงนาม

เสนอให้ผู้มีอำนาจพิจารณาขอบเขตระบบทั้งหมด วิธีเปิดทุกโมดูลพร้อมกัน การย้ายข้อมูลแบบอนุมัติรายโมดูล เกณฑ์ทดสอบ ผู้รับผิดชอบ และเงื่อนไขจัดทำแผนฐานกับงบประมาณตามเอกสารฉบับนี้

[ ] อนุมัติขอบเขตและแนวทางดำเนินโครงการตามเอกสารฉบับนี้

[ ] อนุมัติโดยมีเงื่อนไขตามบันทึกแนบที่ลงนามร่วมกัน

[ ] ให้ปรับปรุงก่อนเสนอพิจารณาอีกครั้ง

เงื่อนไขหรือเลขที่บันทึกแนบ  __________________________________________________

________________________________________________________________________

การอนุมัติแผนฐาน effort ทีม งบประมาณและวันเปิดระบบ ให้ยืนยันภายหลัง A0 และการรับรองกฎข้อมูลหลัก การอนุมัติเปิดระบบ การยื่นภาษี และคำสั่งจ่ายเงินจริงยังใช้หลักฐานและอำนาจตาม workflow ที่กำหนดแยกต่างหาก

ผู้เสนอแผนหรือหัวหน้าโครงการ

ลงชื่อ _______________________  ชื่อ _______________________  วันที่ ______________

ผู้รับผิดชอบ Operations จัดซื้อและคลัง

ลงชื่อ _______________________  ชื่อ _______________________  วันที่ ______________

ผู้รับผิดชอบ HR และข้อมูลพนักงาน

ลงชื่อ _______________________  ชื่อ _______________________  วันที่ ______________

ผู้รับผิดชอบบัญชี การเงินและภาษี

ลงชื่อ _______________________  ชื่อ _______________________  วันที่ ______________

ผู้มีอำนาจอนุมัติโครงการของบริษัท

ลงชื่อ _______________________  ชื่อ _______________________  วันที่ ______________

เอกสารฉบับ 1.0  รหัส SMARTOP PROPOSAL 2026 001  จำนวนหน้าตามเลขท้ายเอกสาร
