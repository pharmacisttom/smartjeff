// J2K Staff Directory & Master Authentication Catalog
// Built from jeffy1.xlsx with complete permission & role mapping

export interface J2KUserRecord {
  id: string;
  email: string;
  code?: string;
  name: string;
  role: "ADMIN" | "HR" | "COORDINATOR" | "SUPERVISOR" | "EMPLOYEE";
  department?: string;
  position?: string;
  siteCode?: string;
  permissions: string;
  redirectTo: string;
}

export const J2K_STAFF_SPECIAL: J2KUserRecord[] = [
  {
    id: "user_admin_001",
    email: "admin@j2k.co.th",
    name: "นายปณิธาน ลานทองกุล (ผู้บริหารสูงสุด)",
    role: "ADMIN",
    department: "EXECUTIVE",
    position: "ประธานเจ้าหน้าที่บริหาร (CEO)",
    permissions: "ALL",
    redirectTo: "/admin/dashboard",
  },
  {
    id: "user_admin_002",
    email: "panithan@j2k.co.th",
    name: "นายปณิธาน ลานทองกุล",
    role: "ADMIN",
    department: "EXECUTIVE",
    position: "ประธานเจ้าหน้าที่บริหาร (CEO)",
    permissions: "ALL",
    redirectTo: "/admin/dashboard",
  },
  {
    id: "user_admin_003",
    email: "assana@j2k.co.th",
    name: "นางอัศนา ธรรมถาวร",
    role: "ADMIN",
    department: "EXECUTIVE",
    position: "ผู้บริหารระดับสูง",
    permissions: "ALL",
    redirectTo: "/admin/dashboard",
  },
  {
    id: "user_hr_121095",
    email: "121095@j2k.co.th",
    code: "121095",
    name: "น.ส.ยุพดี วะโร",
    role: "HR",
    department: "HR/Payroll",
    position: "Finance & Accounting",
    siteCode: "J2K-HQ",
    permissions: "เวลาเข้า-ออก,เงินเดือน,Attendance,slip,ประวัติ,Customer,โอที,เวลาทำงาน,เอกสารส่งตัว",
    redirectTo: "/admin/payroll",
  },
  {
    id: "user_hr_120001",
    email: "120001@j2k.co.th",
    code: "120001",
    name: "นางเนตรนภา อินทร์ผลเล็ก",
    role: "HR",
    department: "HR/Payroll",
    position: "ผู้จัดการทั่วไป (General Manager)",
    siteCode: "J2K-HQ",
    permissions: "เวลาเข้า-ออก,เงินเดือน,Attendance,slip,ประวัติ,Customer,โอที,เวลาทำงาน,เอกสารส่งตัว",
    redirectTo: "/admin/payroll",
  },
  {
    id: "user_coord_120886",
    email: "120886@j2k.co.th",
    code: "120886",
    name: "นางสาวอรอุมา วิเวช",
    role: "COORDINATOR",
    department: "Coordinator",
    position: "ฝ่ายประสานงานไซต์ (Site Coordinator)",
    siteCode: "J2K-HQ",
    permissions: "เวลาเข้า-ออก,Attendance,slip,ประวัติ,Customer,โอที,เวลาทำงาน,เอกสารส่งตัว",
    redirectTo: "/admin/dashboard",
  },
  {
    id: "user_coord_chuleeporn",
    email: "chuleeporn@j2k.co.th",
    code: "chuleeporn",
    name: "นางสาวชุลีพร แซ่เอี๊ยว",
    role: "COORDINATOR",
    department: "Coordinator",
    position: "ฝ่ายประสานงาน (Coordinator)",
    siteCode: "J2K-HQ",
    permissions: "เวลาเข้า-ออก,Attendance,slip,ประวัติ,Customer,โอที,เวลาทำงาน,เอกสารส่งตัว",
    redirectTo: "/admin/dashboard",
  },
  {
    id: "user_sup_120150",
    email: "120150@j2k.co.th",
    code: "120150",
    name: "นางสาวสริญญา ชะนิดนอก",
    role: "SUPERVISOR",
    department: "Operations",
    position: "หัวหน้าแม่บ้านประจำไซต์ AAM",
    siteCode: "AAM",
    permissions: "โอที,Attendance,เวลาทำงาน",
    redirectTo: "/operations",
  },
  {
    id: "user_sup_120116",
    email: "120116@j2k.co.th",
    code: "120116",
    name: "นางจิราภา ชินบุตร",
    role: "SUPERVISOR",
    department: "Operations",
    position: "หัวหน้างานประจำไซต์ BW",
    siteCode: "BW",
    permissions: "โอที,Attendance,เวลาทำงาน",
    redirectTo: "/operations",
  },
];

export const J2K_ALL_EMPLOYEES: { code: string; name: string; position: string; siteCode: string; phone: string }[] = [
  {
    "code": "210993",
    "name": "นายกิมเอิน อีท",
    "position": "พ่อบ้าน",
    "siteCode": "AAM",
    "phone": "06-1983-3706"
  },
  {
    "code": "120189",
    "name": "นางพัดมา เชื้อวังคำ",
    "position": "แม่บ้าน",
    "siteCode": "AAM",
    "phone": "984513766"
  },
  {
    "code": "120260",
    "name": "นางสร้อยทอง ทองสุข",
    "position": "แม่บ้าน",
    "siteCode": "AAM",
    "phone": "092-930-8293"
  },
  {
    "code": "121014",
    "name": "น.ส.สมใจ แว่นทิพย์",
    "position": "แม่บ้าน",
    "siteCode": "AAM",
    "phone": "902394930"
  },
  {
    "code": "120697",
    "name": "นางแววดาว มุกโส",
    "position": "แม่บ้าน",
    "siteCode": "AAM",
    "phone": "65538932"
  },
  {
    "code": "121068",
    "name": "นางพัน อุล",
    "position": "แม่บ้าน",
    "siteCode": "AAM",
    "phone": "082-448-9188"
  },
  {
    "code": "120150",
    "name": "นางสาวสริญญา ชะนิดนอก",
    "position": "หัวหน้าแม่บ้าน",
    "siteCode": "AAM",
    "phone": "659580418"
  },
  {
    "code": "120748",
    "name": "นางลลิต อบสุนทร",
    "position": "แม่บ้าน",
    "siteCode": "ABPR1,2",
    "phone": "927820197"
  },
  {
    "code": "120901",
    "name": "นางสุนิตย์ พิมพ์เขียว",
    "position": "แม่บ้าน",
    "siteCode": "ABPR1,2",
    "phone": "086-165-9122"
  },
  {
    "code": "110749",
    "name": "นายสนัด พลหาร",
    "position": "สายกวาด",
    "siteCode": "ABPR1,2",
    "phone": "610082631"
  },
  {
    "code": "110709",
    "name": "นายอุ่น แอ่นคำ",
    "position": "สายกวาด",
    "siteCode": "ABPR1,2",
    "phone": "850309821"
  },
  {
    "code": "111019",
    "name": "นายสุรชัย จันทร์หอม",
    "position": "สายกวาด",
    "siteCode": "ABPR1,2",
    "phone": "631791876"
  },
  {
    "code": "120362",
    "name": "นางสาวสร้อยทิพย์ มณีศรี",
    "position": "หัวหน้าแม่บ้าน",
    "siteCode": "ABPR1,2",
    "phone": "986326755"
  },
  {
    "code": "121300",
    "name": "น.ส.รัตติยา ชมบัณฑิตย์",
    "position": "แม่บ้าน",
    "siteCode": "ABPR3,4",
    "phone": "656208279"
  },
  {
    "code": "121099",
    "name": "นางวราภรณ์ บุญทา",
    "position": "แม่บ้าน",
    "siteCode": "ABPR3,4",
    "phone": "910543428"
  },
  {
    "code": "121301",
    "name": "น.ส.จิดาภา บุตรคำ",
    "position": "แม่บ้าน",
    "siteCode": "ABPR3,4",
    "phone": "652790119"
  },
  {
    "code": "110360",
    "name": "นายประดิษฐ์ บุญสิทธ์",
    "position": "สายกวาด",
    "siteCode": "ABPR3,4",
    "phone": "924057458"
  },
  {
    "code": "110738",
    "name": "นายกฤตชัย แซ่ตั้ง",
    "position": "สายกวาด",
    "siteCode": "ABPR3,4",
    "phone": "956614270"
  },
  {
    "code": "110932",
    "name": "นายวุฒินันท์ ชมภู",
    "position": "สายกวาด",
    "siteCode": "ABPR3,4",
    "phone": "879812549"
  },
  {
    "code": "120977",
    "name": "นางจารุวรรณ แก้วมูล",
    "position": "หัวหน้าแม่บ้าน",
    "siteCode": "ABPR3,4",
    "phone": "927397293"
  },
  {
    "code": "110669",
    "name": "นายกำไล เหนือเกาะหวาย",
    "position": "คนสวน",
    "siteCode": "ABPR5",
    "phone": "983739741"
  },
  {
    "code": "120603",
    "name": "นางอุลา แก้วพรม",
    "position": "แม่บ้าน",
    "siteCode": "ABPR5",
    "phone": "621861941"
  },
  {
    "code": "120918",
    "name": "น.ส.หนูเอ็ม โหมสูงเนิน",
    "position": "แม่บ้าน",
    "siteCode": "ABPR5",
    "phone": "099-4730955"
  },
  {
    "code": "110367",
    "name": "นายนูศิลป์ สมองาม",
    "position": "สายกวาด",
    "siteCode": "ABPR5",
    "phone": "928654891"
  },
  {
    "code": "120630",
    "name": "น.ส.อรอุมา สิงห์ทองลา",
    "position": "หัวหน้าแม่บ้าน",
    "siteCode": "ABPR5",
    "phone": "625413997"
  },
  {
    "code": "110947",
    "name": "นายณัฐวุฒิ หนูนาค",
    "position": "คนสวน",
    "siteCode": "BAT",
    "phone": "805195657"
  },
  {
    "code": "220804",
    "name": "นางพร ทอน",
    "position": "แม่บ้าน",
    "siteCode": "BAT",
    "phone": "615048360"
  },
  {
    "code": "120826",
    "name": "น.ส.สมหมาย อำมาตมนตรี",
    "position": "แม่บ้าน",
    "siteCode": "BAT",
    "phone": "820793834"
  },
  {
    "code": "110883",
    "name": "นายภูษิต ไพคำนาม",
    "position": "คนสวน",
    "siteCode": "BW",
    "phone": "808096073"
  },
  {
    "code": "121072",
    "name": "น.ส.แสงเดือน พันธ์ฉลามขวา",
    "position": "แม่บ้าน",
    "siteCode": "BW",
    "phone": "909624234"
  },
  {
    "code": "120450",
    "name": "นางสาวจงจิต บาลพิทักษ์",
    "position": "แม่บ้าน",
    "siteCode": "BW",
    "phone": "926073549"
  },
  {
    "code": "121200",
    "name": "น.ส.พิมวาสน์ ทวิไวนุวัฒน์",
    "position": "แม่บ้าน",
    "siteCode": "BW",
    "phone": "803384969"
  },
  {
    "code": "120116",
    "name": "นางจิราภา ชินบุตร",
    "position": "หัวหน้างาน",
    "siteCode": "BW",
    "phone": "961389329"
  },
  {
    "code": "110320",
    "name": "นายปรีเปรม ศรีพายัคฆ์",
    "position": "พ่อบ้าน",
    "siteCode": "CATALER",
    "phone": "982223051"
  },
  {
    "code": "121063",
    "name": "นางณัฐวิภา โพธิ์สุข",
    "position": "แม่บ้าน",
    "siteCode": "CATALER",
    "phone": "618730436"
  },
  {
    "code": "120162",
    "name": "นางสมจิตร โพศิริ",
    "position": "แม่บ้าน",
    "siteCode": "CATALER",
    "phone": "625431676"
  },
  {
    "code": "120967",
    "name": "น.ส.ปาริชาติ ชุนไธสง",
    "position": "แม่บ้าน",
    "siteCode": "CATALER",
    "phone": "622837367"
  },
  {
    "code": "121048",
    "name": "นางน้ำอ้อย โพธิ์เงิน",
    "position": "แม่บ้าน",
    "siteCode": "CATALER",
    "phone": "626524206"
  },
  {
    "code": "121302",
    "name": "นางนิติยา บุญเททิน",
    "position": "แม่บ้าน",
    "siteCode": "CATALER",
    "phone": "953324161"
  },
  {
    "code": "110792",
    "name": "นายธิวัฒน์ ราวัน",
    "position": "คนสวน",
    "siteCode": "DOWA",
    "phone": "944206191"
  },
  {
    "code": "120185",
    "name": "นางเกศราพร ศิลปยามานันท์",
    "position": "แม่บ้าน",
    "siteCode": "DOWA",
    "phone": "898983038"
  },
  {
    "code": "120940",
    "name": "นางกัญญ์ณณัฏฐ์ พูลเมือง",
    "position": "แม่บ้าน",
    "siteCode": "DOWA",
    "phone": ""
  },
  {
    "code": "120768",
    "name": "น.ส.อำพร เชิงกระโทก",
    "position": "แม่บ้าน",
    "siteCode": "FTS1",
    "phone": "810657901"
  },
  {
    "code": "120887",
    "name": "น.ส.ปิยะดา ปาสาจะ",
    "position": "แม่บ้าน",
    "siteCode": "FTS1",
    "phone": "812823763"
  },
  {
    "code": "120980",
    "name": "นางขำจิตร โลสิงห์",
    "position": "แม่บ้าน",
    "siteCode": "FTS1",
    "phone": "808860859"
  },
  {
    "code": "120871",
    "name": "น.ส.กนกวรรณ พูนกลาง",
    "position": "แม่บ้าน",
    "siteCode": "FTS2",
    "phone": "860272820"
  },
  {
    "code": "120321",
    "name": "นางมาลี ไชยไข",
    "position": "แม่บ้าน",
    "siteCode": "FTS2",
    "phone": "636848955"
  },
  {
    "code": "120640",
    "name": "น.ส.เกษร เข้าเมือง",
    "position": "แม่บ้าน",
    "siteCode": "FTS2",
    "phone": "928021917"
  },
  {
    "code": "120822",
    "name": "น.ส.ธัญพร มั่นยืน",
    "position": "ADMIN",
    "siteCode": "J2K-OFFICER",
    "phone": "634839025"
  },
  {
    "code": "120524",
    "name": "นางสาวปวริศา ฟองสมุทร",
    "position": "ADMIN",
    "siteCode": "J2K-OFFICER",
    "phone": "864071375"
  },
  {
    "code": "120143",
    "name": "นางอัศนา ธรรมถาวร",
    "position": "ASST.",
    "siteCode": "J2K-OFFICER",
    "phone": "962162189"
  },
  {
    "code": "121095",
    "name": "น.ส.ยุพดี วะโร",
    "position": "Finance&Accounting",
    "siteCode": "J2K-OFFICER",
    "phone": "882103479"
  },
  {
    "code": "120001",
    "name": "นางเนตรนภา อินทร์ผลเล็ก",
    "position": "Mgr.",
    "siteCode": "J2K-OFFICER",
    "phone": "870223371"
  },
  {
    "code": "120886",
    "name": "นางสาวอรอุมา วิเวช",
    "position": "Site Co.",
    "siteCode": "J2K-OFFICER",
    "phone": "927391532"
  },
  {
    "code": "120699",
    "name": "นางโศรยา ประสงค์ทรัพย์",
    "position": "SUP/Purchase",
    "siteCode": "J2K-OFFICER",
    "phone": "939097248"
  },
  {
    "code": "110970",
    "name": "นายสุนทร พานทอง",
    "position": "คนขับรถ",
    "siteCode": "J2K-OFFICER",
    "phone": "095- 963- 0622"
  },
  {
    "code": "311064",
    "name": "นายโช อ่อง",
    "position": "เก็บกล่อง",
    "siteCode": "JATH",
    "phone": ""
  },
  {
    "code": "210945",
    "name": "นายเวียสนา บาว",
    "position": "เก็บกล่อง S1",
    "siteCode": "JATH",
    "phone": ""
  },
  {
    "code": "210629",
    "name": "นายจันที สวน",
    "position": "เก็บกล่อง S1",
    "siteCode": "JATH",
    "phone": "945529067"
  },
  {
    "code": "310954",
    "name": "นายทอ มิน ฮาน (ชาย)",
    "position": "เก็บกล่อง S3",
    "siteCode": "JATH",
    "phone": "619086077"
  },
  {
    "code": "310956",
    "name": "นายทิน มิน อ่อง (อ่อง)",
    "position": "เก็บกล่อง S3",
    "siteCode": "JATH",
    "phone": ""
  },
  {
    "code": "210991",
    "name": "นายวัลฮาน่า วอน",
    "position": "เก็บกล่อง S3",
    "siteCode": "JATH",
    "phone": "618285693"
  },
  {
    "code": "311027",
    "name": "นายแจ้ ซิน ต้าน",
    "position": "เก็บกล่อง S3",
    "siteCode": "JATH",
    "phone": "988850049"
  },
  {
    "code": "311029",
    "name": "นาย ซัน กู กู",
    "position": "เก็บกล่อง WH",
    "siteCode": "JATH",
    "phone": ""
  },
  {
    "code": "210542",
    "name": "นายซาเลต กึ",
    "position": "เก็บกล่อง WH",
    "siteCode": "JATH",
    "phone": ""
  },
  {
    "code": "311028",
    "name": "นายจอ มอ มอ",
    "position": "เก็บกล่อง WH",
    "siteCode": "JATH",
    "phone": ""
  },
  {
    "code": "310973",
    "name": "นายนาย มิน",
    "position": "เก็บกล่อง WH",
    "siteCode": "JATH",
    "phone": "65982321"
  },
  {
    "code": "210041",
    "name": "นายซอมนาง เซือน",
    "position": "เข็นขยะ",
    "siteCode": "JATH",
    "phone": "653295690"
  },
  {
    "code": "210752",
    "name": "นายบุญเรือง เอง",
    "position": "เข็นขยะ",
    "siteCode": "JATH",
    "phone": "944033735"
  },
  {
    "code": "210165",
    "name": "นายสมพร เซียม",
    "position": "เข็นขยะ",
    "siteCode": "JATH",
    "phone": "634189766"
  },
  {
    "code": "310953",
    "name": "นายเมา สอ (เมา)",
    "position": "เข็นขยะ",
    "siteCode": "JATH",
    "phone": "634370217"
  },
  {
    "code": "310955",
    "name": "นายมิน จัน ยก (ชา)",
    "position": "พนักงานขัดพื้น",
    "siteCode": "JATH",
    "phone": "634699121"
  },
  {
    "code": "120765",
    "name": "นางสุบิน ศรีนอก",
    "position": "แม่บ้าน",
    "siteCode": "JATH",
    "phone": "822013981"
  },
  {
    "code": "220937",
    "name": "นางสุเพี้ยะ เซือง",
    "position": "แม่บ้าน",
    "siteCode": "JATH",
    "phone": "630072566"
  },
  {
    "code": "120171",
    "name": "น.ส.สาลิกา สว่างอารมณ์",
    "position": "แม่บ้าน",
    "siteCode": "JATH",
    "phone": "933235615"
  },
  {
    "code": "120628",
    "name": "นางทองมา หงษ์ทอง",
    "position": "แม่บ้าน",
    "siteCode": "JATH",
    "phone": "971533338"
  },
  {
    "code": "220340",
    "name": "นางแตน เซือง",
    "position": "แม่บ้าน",
    "siteCode": "JATH",
    "phone": "809655486"
  },
  {
    "code": "320952",
    "name": "นางเม โช อ่อง (เมโช)",
    "position": "แม่บ้าน",
    "siteCode": "JATH",
    "phone": "962162189"
  },
  {
    "code": "221020",
    "name": "นางเยท ฮาน",
    "position": "แม่บ้าน",
    "siteCode": "JATH",
    "phone": "819644083"
  },
  {
    "code": "221303",
    "name": "นางสาวกิมลาง ไซร (เรียง กิมลาง)",
    "position": "แม่บ้าน",
    "siteCode": "JATH",
    "phone": "943159749"
  },
  {
    "code": "121305",
    "name": "นางบัวหอม อนันทวรรณ์",
    "position": "แม่บ้าน",
    "siteCode": "JATH",
    "phone": "661136636"
  },
  {
    "code": "220810",
    "name": "นางสาวโรท ธีม",
    "position": "แม่บ้าน",
    "siteCode": "JATH",
    "phone": "630072566"
  },
  {
    "code": "220040",
    "name": "นางซีเอ๊ะ เมา",
    "position": "แม่บ้าน",
    "siteCode": "JATH",
    "phone": "661575415"
  },
  {
    "code": "220169",
    "name": "นางชิตน กง",
    "position": "แม่บ้าน",
    "siteCode": "JATH",
    "phone": "667137603"
  },
  {
    "code": "120058",
    "name": "นางม่วย ชมวงษ์ษา",
    "position": "แม่บ้าน",
    "siteCode": "JATH",
    "phone": "649652208"
  },
  {
    "code": "220743",
    "name": "นางวันนี ดวง",
    "position": "ล้างจาน",
    "siteCode": "JATH",
    "phone": ""
  },
  {
    "code": "321093",
    "name": "นางดาเลีย ดองลียอ",
    "position": "ล้างจาน",
    "siteCode": "JATH",
    "phone": ""
  },
  {
    "code": "120157",
    "name": "นางสาวอัญชลี วงค์ใหญ่",
    "position": "หัวหน้าแม่บ้าน",
    "siteCode": "JATH",
    "phone": "924787940"
  },
  {
    "code": "120042",
    "name": "น.ส.เสาวรักษ์ จั่นอยู่",
    "position": "แม่บ้าน",
    "siteCode": "LCIT B5",
    "phone": "924505474"
  },
  {
    "code": "121043",
    "name": "นางบุญนาง ทองประภา",
    "position": "แม่บ้าน",
    "siteCode": "LCIT B5",
    "phone": "861552530"
  },
  {
    "code": "121044",
    "name": "น.ส.ศิริพร พันธ์ลำภู",
    "position": "แม่บ้าน",
    "siteCode": "LCIT B5",
    "phone": "621178393"
  },
  {
    "code": "121074",
    "name": "น.ส.นงค์เยาว์ ผสมโค",
    "position": "แม่บ้าน",
    "siteCode": "LCIT B5",
    "phone": "927482602"
  },
  {
    "code": "121059",
    "name": "นางมณฑิกา ประกาฬโพธิ์",
    "position": "แม่บ้าน",
    "siteCode": "LCIT B5",
    "phone": "957125574"
  },
  {
    "code": "121024",
    "name": "น.ส.นิภาพร บุญประกอบ",
    "position": "แม่บ้าน",
    "siteCode": "LCIT B5",
    "phone": "828196452"
  },
  {
    "code": "111079",
    "name": "นายสุระเดช วารีรัตน์",
    "position": "คนกวาดลาน",
    "siteCode": "LCIT C3",
    "phone": "985108467"
  },
  {
    "code": "121032",
    "name": "นางพันธ์ลา บุญทอง",
    "position": "แม่บ้าน",
    "siteCode": "LCIT C3",
    "phone": "801853124"
  },
  {
    "code": "121033",
    "name": "น.ส.ดอกรัก อินทร์จันทร์",
    "position": "แม่บ้าน",
    "siteCode": "LCIT C3",
    "phone": "951634937"
  },
  {
    "code": "121035",
    "name": "น.ส.นงค์นุช ว่องไว",
    "position": "แม่บ้าน",
    "siteCode": "LCIT C3",
    "phone": "641932619"
  },
  {
    "code": "121036",
    "name": "น.ส.สุภาวดี พรมเวียง",
    "position": "แม่บ้าน",
    "siteCode": "LCIT C3",
    "phone": "824586323"
  },
  {
    "code": "121037",
    "name": "น.ส.ณัฎฐ์นรี ทองปาน",
    "position": "แม่บ้าน",
    "siteCode": "LCIT C3",
    "phone": "842580584"
  },
  {
    "code": "121038",
    "name": "นางมานพ ฤทธิ์บำรุง",
    "position": "แม่บ้าน",
    "siteCode": "LCIT C3",
    "phone": "971564403"
  },
  {
    "code": "121096",
    "name": "นางปรียาภรณ์ ผลทวี",
    "position": "แม่บ้าน",
    "siteCode": "LCIT C3",
    "phone": "989210589"
  },
  {
    "code": "121202",
    "name": "นางเดือน กะทิพรมราช",
    "position": "แม่บ้าน",
    "siteCode": "MISUMI",
    "phone": "649519003"
  },
  {
    "code": "121203",
    "name": "นางสำเนียง โกศล",
    "position": "แม่บ้าน",
    "siteCode": "MISUMI",
    "phone": "628762826"
  },
  {
    "code": "121204",
    "name": "นางสายสร้อย ใจบุญ",
    "position": "แม่บ้าน",
    "siteCode": "MISUMI",
    "phone": "992759082"
  },
  {
    "code": "110921",
    "name": "นายราชัน ไชยวัน",
    "position": "คนสวน",
    "siteCode": "MTAT",
    "phone": "831407886"
  },
  {
    "code": "111086",
    "name": "นายวัชรินทร์ ชัยวงษา",
    "position": "พ่อบ้าน",
    "siteCode": "MTAT",
    "phone": "625020844"
  },
  {
    "code": "420659",
    "name": "นางบัวพา ดวงมาลา",
    "position": "แม่บ้าน",
    "siteCode": "MTAT",
    "phone": "805977074"
  },
  {
    "code": "120995",
    "name": "น.ส.สกุณา รอบคอบ",
    "position": "แม่บ้าน",
    "siteCode": "MTAT",
    "phone": "641496298"
  },
  {
    "code": "120096",
    "name": "ปรียาพรรณ ฟูวุฒิ",
    "position": "หัวหน้าแม่บ้าน",
    "siteCode": "MTAT",
    "phone": "871745649"
  },
  {
    "code": "111306",
    "name": "นายบุญสืบ ธรรมนุสสรณ์",
    "position": "คนสวน",
    "siteCode": "SFT",
    "phone": "645645081"
  },
  {
    "code": "320957",
    "name": "น.ส.เว จูลี่ วิน (หนู)",
    "position": "แม่บ้าน",
    "siteCode": "SFT",
    "phone": ""
  },
  {
    "code": "121050",
    "name": "น.ส.พิมษร มลศิลป์",
    "position": "แม่บ้าน",
    "siteCode": "SFT",
    "phone": "854728344"
  },
  {
    "code": "420769",
    "name": "นางแวง วงสิยา",
    "position": "แม่บ้าน",
    "siteCode": "SPARE J2K",
    "phone": "656851165"
  },
  {
    "code": "121083",
    "name": "นางสมบัติ สุพรรณ์",
    "position": "แม่บ้าน",
    "siteCode": "SPARE J2K",
    "phone": "653430920"
  },
  {
    "code": "220680",
    "name": "นางอาย ชอร์น",
    "position": "แม่บ้าน",
    "siteCode": "SPARE J2K",
    "phone": ""
  },
  {
    "code": "111082",
    "name": "นายสังวาลย์ อุดโค",
    "position": "สายกวาด",
    "siteCode": "SPARE J2K",
    "phone": "655877037"
  },
  {
    "code": "211049",
    "name": "นายตึด อาด",
    "position": "คนสวน",
    "siteCode": "SSMC1",
    "phone": "627982674"
  },
  {
    "code": "221092",
    "name": "นางอี อัง",
    "position": "แม่บ้าน",
    "siteCode": "SSMC1",
    "phone": ""
  },
  {
    "code": "120527",
    "name": "นางสาวทศพร ทองประภา",
    "position": "แม่บ้าน",
    "siteCode": "SSMC1",
    "phone": "926073549"
  },
  {
    "code": "120968",
    "name": "น.ส.ดวงใจ แซ่ลิ้ม",
    "position": "แม่บ้าน",
    "siteCode": "SSMC1",
    "phone": "961127488"
  },
  {
    "code": "110618",
    "name": "นายประสิทธ์ บุดดาเคน",
    "position": "คนสวน",
    "siteCode": "SSMC2",
    "phone": "969603182"
  },
  {
    "code": "120412",
    "name": "น.ส.นุช เงินสมบัติ",
    "position": "แม่บ้าน",
    "siteCode": "SSMC2",
    "phone": "614026296"
  },
  {
    "code": "111103",
    "name": "นายอุทัย บำเพ็ญ",
    "position": "คนกวาดลาน",
    "siteCode": "TIPS",
    "phone": "897915682"
  },
  {
    "code": "111030",
    "name": "นายวสันต์ เรืองเดชผล",
    "position": "คนขับรถ",
    "siteCode": "TIPS",
    "phone": "995585202"
  },
  {
    "code": "111078",
    "name": "นายอาคม ทับจังหรีด",
    "position": "คนสวน",
    "siteCode": "TIPS",
    "phone": "658901517"
  },
  {
    "code": "121090",
    "name": "น.ส.รจนา อุ่นคำ",
    "position": "แม่บ้าน",
    "siteCode": "TIPS",
    "phone": "621718940"
  },
  {
    "code": "121088",
    "name": "น.ส.สำเนียง เฟื่องฟู",
    "position": "แม่บ้าน",
    "siteCode": "TIPS",
    "phone": "615218124"
  },
  {
    "code": "121006",
    "name": "น.ส.สุณิสา แก้วบุญเรือง",
    "position": "แม่บ้าน",
    "siteCode": "TIPS",
    "phone": "632498690"
  },
  {
    "code": "121089",
    "name": "น.ส.ภัทลดา ผงสูงเนิน",
    "position": "แม่บ้าน",
    "siteCode": "TIPS",
    "phone": "637462919"
  },
  {
    "code": "121023",
    "name": "น.ส.พัชดาพร เกษประทุม",
    "position": "แม่บ้าน",
    "siteCode": "TIPS",
    "phone": "63414974"
  },
  {
    "code": "121080",
    "name": "นางอุมาพร ควบพิมาย",
    "position": "แม่บ้าน",
    "siteCode": "TIPS",
    "phone": "89791682"
  },
  {
    "code": "121104",
    "name": "น.ส.สุพรรณมณี ยอดหอ",
    "position": "แม่บ้าน",
    "siteCode": "TIPS",
    "phone": "897915682"
  },
  {
    "code": "120336",
    "name": "นางสาวสุพรรณิภา สุพรรณ์",
    "position": "แม่บ้าน",
    "siteCode": "NSA",
    "phone": "957968318"
  },
  {
    "code": "120473",
    "name": "นางสังเวียน ศรีหงษ์",
    "position": "แม่บ้าน",
    "siteCode": "NSA",
    "phone": "647986508"
  },
  {
    "code": "120998",
    "name": "น.ส.เสาวนีย์ เจริญสุข",
    "position": "แม่บ้าน",
    "siteCode": "MISUBISHI",
    "phone": "870264319"
  },
  {
    "code": "120007",
    "name": "นางไพรวรรณ นุ่มพุฒ",
    "position": "แม่บ้าน",
    "siteCode": "MISUBISHI",
    "phone": "850309821"
  },
  {
    "code": "120919",
    "name": "น.ส.พัสดา ชมภูมี",
    "position": "แม่บ้าน",
    "siteCode": "TFI",
    "phone": "828448643"
  },
  {
    "code": "120148",
    "name": "นางไพร วิจิตพงศ์",
    "position": "แม่บ้าน",
    "siteCode": "TFI",
    "phone": "962805164"
  },
  {
    "code": "120436",
    "name": "น.ส.ปัญญา จันทรังษี",
    "position": "แม่บ้าน",
    "siteCode": "TNT",
    "phone": "655972936"
  },
  {
    "code": "120978",
    "name": "นางบุญเย็น ไชยวัน",
    "position": "แม่บ้าน",
    "siteCode": "TNT",
    "phone": "624056167"
  },
  {
    "code": "110898",
    "name": "นายสียม เชื้อคำจันทร์",
    "position": "คนสวน",
    "siteCode": "BRUCKNER",
    "phone": "624396338"
  },
  {
    "code": "120102",
    "name": "นางบังอร พสุรัตน์",
    "position": "แม่บ้าน",
    "siteCode": "CHIKUMA",
    "phone": "959491255"
  },
  {
    "code": "120962",
    "name": "นางเล็ก ทาทอง",
    "position": "แม่บ้าน",
    "siteCode": "KYT",
    "phone": "640305081"
  },
  {
    "code": "120847",
    "name": "น.ส.วรรณพร รื่นเริง",
    "position": "แม่บ้าน",
    "siteCode": "LCTH",
    "phone": "949044004"
  },
  {
    "code": "120910",
    "name": "น.ส.อุษา แดไชย",
    "position": "แม่บ้าน",
    "siteCode": "LSTH",
    "phone": "986120623"
  },
  {
    "code": "120950",
    "name": "น.ส.วัลยา จาตุรงค์",
    "position": "แม่บ้าน",
    "siteCode": "NIKKO",
    "phone": "643479786"
  },
  {
    "code": "120853",
    "name": "นางดวง เพชรบุตร",
    "position": "แม่บ้าน",
    "siteCode": "NS-OG(SPT)",
    "phone": "800169654"
  },
  {
    "code": "121091",
    "name": "น.ส.สนอง สิงหา",
    "position": "แม่บ้าน",
    "siteCode": "NS-OG (YRT)",
    "phone": "610156407"
  },
  {
    "code": "121021",
    "name": "น.ส.ปาริสรา บุญจันทร์",
    "position": "แม่บ้าน",
    "siteCode": "SHRED TECH",
    "phone": "823498129"
  },
  {
    "code": "120812",
    "name": "นางสุภาพร เพียนดี",
    "position": "แม่บ้าน",
    "siteCode": "STDI",
    "phone": "992081010"
  },
  {
    "code": "120928",
    "name": "นางสมปอง งามสม",
    "position": "แม่บ้าน",
    "siteCode": "SYC",
    "phone": "652472853"
  }
];

export function findJ2KDirectoryUser(identifier: string): J2KUserRecord | null {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();
  const raw = identifier.trim();

  // 1. Direct match on special staff (by email, id, or code)
  for (const s of J2K_STAFF_SPECIAL) {
    if (s.id.toLowerCase() === clean || s.id === raw) return s;
    if (s.email.toLowerCase() === clean) return s;
    if (s.code && (s.code.toLowerCase() === clean || s.code === raw)) return s;
  }

  // 2. Check if clean matches <empCode>@j2k.co.th or emp_user_<empCode> or raw is empCode
  let codeMatch = "";
  if (clean.endsWith("@j2k.co.th")) {
    codeMatch = clean.replace("@j2k.co.th", "");
  } else if (clean.startsWith("emp_user_")) {
    codeMatch = clean.replace("emp_user_", "");
  } else {
    codeMatch = clean;
  }

  const emp = J2K_ALL_EMPLOYEES.find((e) => e.code.toLowerCase() === codeMatch || e.phone === raw);
  if (emp) {
    // Check if employee is in special staff
    const special = J2K_STAFF_SPECIAL.find((s) => s.code === emp.code);
    if (special) return special;

    // Detect if position indicates supervisor
    const isSupervisor =
      emp.position.includes("หัวหน้า") ||
      emp.position.includes("Supervisor") ||
      emp.position.includes("Leader");

    return {
      id: "emp_user_" + emp.code,
      email: emp.code + "@j2k.co.th",
      code: emp.code,
      name: emp.name,
      role: isSupervisor ? "SUPERVISOR" : "EMPLOYEE",
      position: emp.position,
      siteCode: emp.siteCode,
      permissions: isSupervisor ? "โอที,Attendance,เวลาทำงาน" : "check-in,leave,payslip",
      redirectTo: isSupervisor ? "/operations" : "/check-in",
    };
  }

  // 3. Fallback for admin aliases
  if (clean === "admin" || clean === "panithan" || clean.includes("admin")) {
    return J2K_STAFF_SPECIAL[0];
  }

  return null;
}
