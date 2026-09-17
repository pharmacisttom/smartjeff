export const locales = ['th', 'en', 'km', 'my', 'lo'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  th: 'ไทย 🇹🇭',
  en: 'English 🇺🇸',
  km: 'ខ្មែរ 🇰🇭',
  my: 'မြန်မာ 🇲🇲',
  lo: 'ລາວ 🇱🇦',
};

export const defaultLocale: Locale = 'th';

export const dictionary: Record<Locale, Record<string, any>> = {
  th: {
    common: { save: 'บันทึก', cancel: 'ยกเลิก', confirm: 'ยืนยัน', delete: 'ลบ' },
    checkin: { title: 'ลงเวลาทำงาน', check_in: 'ลงเวลาเข้า', check_out: 'ลงเวลาออก', outside_area: 'อยู่นอกพื้นที่' },
    payroll: { salary: 'เงินเดือน', net_pay: 'รับสุทธิ', ot: 'ค่าล่วงเวลา' },
  },
  en: {
    common: { save: 'Save', cancel: 'Cancel', confirm: 'Confirm', delete: 'Delete' },
    checkin: { title: 'Attendance Check-in', check_in: 'Check In', check_out: 'Check Out', outside_area: 'Outside Boundary' },
    payroll: { salary: 'Base Salary', net_pay: 'Net Payable', ot: 'Overtime Pay' },
  },
  km: {
    common: { save: 'រក្សាទុក', cancel: 'បោះបង់', confirm: 'បញ្ជាក់', delete: 'លុប' },
    checkin: { title: 'វត្តមានធ្វើការ', check_in: 'ចូលធ្វើការ', check_out: 'ចេញធ្វើការ', outside_area: 'ក្រៅតំបន់' },
    payroll: { salary: 'ប្រាក់ខែ', net_pay: 'ប្រាក់ខែសុទ្ធ', ot: 'ថ្លៃថែមម៉ោង' },
  },
  my: {
    common: { save: 'သိမ်းဆည်းပါ', cancel: 'ပယ်ဖျက်ပါ', confirm: 'အတည်ပြုပါ', delete: 'ဖျက်ပါ' },
    checkin: { title: 'အလုပ်ဆင်း/တက်', check_in: 'အလုပ်ဝင်', check_out: 'အလုပ်ထွက်', outside_area: 'နယ်မြေပြင်ပ' },
    payroll: { salary: 'လစာ', net_pay: 'ရရှိမည့်လစာ', ot: 'အချိန်ပိုကြေး' },
  },
  lo: {
    common: { save: 'ບັນທຶກ', cancel: 'ຍົກເລີກ', confirm: 'ຢືນຢັນ', delete: 'ລົບ' },
    checkin: { title: 'ລົງເວລາເຮັດວຽກ', check_in: 'ເຂົ້າວຽກ', check_out: 'ອອກວຽກ', outside_area: 'ນອກພື້ນທີ່' },
    payroll: { salary: 'ເງິນເດືອນ', net_pay: 'ຮັບສຸດທິ', ot: 'ຄ່າລ່ວງເວລາ' },
  },
};
