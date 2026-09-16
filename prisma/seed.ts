import { PrismaClient, Gender, SalaryType, Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const SITES_DATA = [
  // เหมราช / อมตะซิตี้
  { code: 'AAM', name: 'บริษัท เอเอเอ็ม อินดัสเตรียล จำกัด', lat: 12.9236, lng: 101.1352, radius: 200 },
  { code: 'ABPR1', name: 'โรงงาน ABPR 1 (อมตะซิตี้)', lat: 12.9250, lng: 101.1360, radius: 200 },
  { code: 'ABPR2', name: 'โรงงาน ABPR 2 (อมตะซิตี้)', lat: 12.9260, lng: 101.1370, radius: 200 },
  { code: 'ABPR3', name: 'โรงงาน ABPR 3 (อมตะซิตี้)', lat: 12.9270, lng: 101.1380, radius: 200 },
  { code: 'ABPR4', name: 'โรงงาน ABPR 4 (อมตะซิตี้)', lat: 12.9280, lng: 101.1390, radius: 200 },
  { code: 'ABPR5', name: 'โรงงาน ABPR 5 (อมตะซิตี้)', lat: 12.9290, lng: 101.1400, radius: 200 },
  { code: 'JATH', name: 'บริษัท เจเอทีเอช เทคโนโลยี จำกัด', lat: 12.9220, lng: 101.1340, radius: 200 },

  // อีสเทิร์นซีบอร์ด (ปลวกแดง)
  { code: 'BAT', name: 'โรงงานแบตเตอรี่ อีสเทิร์นซีบอร์ด', lat: 12.6841, lng: 101.1476, radius: 250 },
  { code: 'BW', name: 'บีดับเบิลยู ออโต้พาร์ท', lat: 12.6850, lng: 101.1480, radius: 200 },
  { code: 'CATALER', name: 'บริษัท คาตาเลอร์ (ประเทศไทย) จำกัด', lat: 12.6860, lng: 101.1490, radius: 200 },
  { code: 'DOWA', name: 'บริษัท โดวะ ฮีทเทรตติ้ง จำกัด', lat: 12.6870, lng: 101.1500, radius: 200 },
  { code: 'FTS1', name: 'เอฟทีเอส เฟส 1', lat: 12.6880, lng: 101.1510, radius: 200 },
  { code: 'FTS2', name: 'เอฟทีเอส เฟส 2', lat: 12.6890, lng: 101.1520, radius: 200 },

  // แหลมฉบัง
  { code: 'LCIT', name: 'ท่าเทียบเรือแหลมฉบัง LCIT', lat: 13.0762, lng: 100.8886, radius: 300 },
  { code: 'TIPS', name: 'ท่าเรือ TIPS แหลมฉบัง', lat: 13.0780, lng: 100.8900, radius: 300 },
];

const INITIAL_EMPLOYEES = [
  { code: 'EMP001', prefix: 'นาง', firstName: 'สมศรี', lastName: 'สุขใจ', position: 'หัวหน้าแม่บ้าน', siteCode: 'AAM', gender: Gender.FEMALE, dailyRate: 450, baseSalary: 13500 },
  { code: 'EMP002', prefix: 'นาย', firstName: 'สมชาย', lastName: 'มีทรัพย์', position: 'พนักงานทำความสะอาด', siteCode: 'AAM', gender: Gender.MALE, dailyRate: 400, baseSalary: 12000 },
  { code: 'EMP003', prefix: 'นางสาว', firstName: 'พัดมา', lastName: 'วงค์คำ', position: 'พนักงานทำความสะอาด', siteCode: 'AAM', gender: Gender.FEMALE, dailyRate: 400, baseSalary: 12000 },
  { code: 'EMP004', prefix: 'นาย', firstName: 'บุญมี', lastName: 'มั่นคง', position: 'คนสวน', siteCode: 'ABPR1', gender: Gender.MALE, dailyRate: 420, baseSalary: 12600 },
  { code: 'EMP005', prefix: 'นาง', firstName: 'พรทิพย์', lastName: 'สว่างอรุณ', position: 'แม่บ้านประจำอาคาร', siteCode: 'ABPR1', gender: Gender.FEMALE, dailyRate: 400, baseSalary: 12000 },
  { code: 'EMP006', prefix: 'นาย', firstName: 'วิชัย', lastName: 'เจริญสุข', position: 'สายกวาด', siteCode: 'ABPR2', gender: Gender.MALE, dailyRate: 400, baseSalary: 12000 },
  { code: 'EMP007', prefix: 'นางสาว', firstName: 'กัญญารัตน์', lastName: 'ดวงดี', position: 'แม่บ้าน', siteCode: 'ABPR2', gender: Gender.FEMALE, dailyRate: 400, baseSalary: 12000 },
  { code: 'EMP008', prefix: 'นาย', firstName: 'สุทิน', lastName: 'ชูชัย', position: 'พนักงานกวาดพื้น', siteCode: 'ABPR3', gender: Gender.MALE, dailyRate: 400, baseSalary: 12000 },
  { code: 'EMP009', prefix: 'นาง', firstName: 'มาลี', lastName: 'สดใส', position: 'แม่บ้าน', siteCode: 'ABPR3', gender: Gender.FEMALE, dailyRate: 400, baseSalary: 12000 },
  { code: 'EMP010', prefix: 'นาย', firstName: 'อำนาจ', lastName: 'เกรียงไกร', position: 'คนสวน', siteCode: 'ABPR4', gender: Gender.MALE, dailyRate: 420, baseSalary: 12600 },
  { code: 'EMP011', prefix: 'นางสาว', firstName: 'จินตนา', lastName: 'แก้วมณี', position: 'แม่บ้าน', siteCode: 'BAT', gender: Gender.FEMALE, dailyRate: 400, baseSalary: 12000 },
  { code: 'EMP012', prefix: 'นาย', firstName: 'เกรียงไกร', lastName: 'สมบูรณ์', position: 'สายกวาด', siteCode: 'BAT', gender: Gender.MALE, dailyRate: 400, baseSalary: 12000 },
  { code: 'EMP013', prefix: 'นาง', firstName: 'นภา', lastName: 'แจ่มใส', position: 'แม่บ้าน', siteCode: 'BW', gender: Gender.FEMALE, dailyRate: 400, baseSalary: 12000 },
  { code: 'EMP014', prefix: 'นาย', firstName: 'ประเสริฐ', lastName: 'ศรีทอง', position: 'คนสวน', siteCode: 'CATALER', gender: Gender.MALE, dailyRate: 420, baseSalary: 12600 },
  { code: 'EMP015', prefix: 'นางสาว', firstName: 'วรรณา', lastName: 'รัตนะ', position: 'แม่บ้าน', siteCode: 'CATALER', gender: Gender.FEMALE, dailyRate: 400, baseSalary: 12000 },
  { code: 'EMP016', prefix: 'นาย', firstName: 'ชาญชัย', lastName: 'ยั่งยืน', position: 'สายกวาด', siteCode: 'DOWA', gender: Gender.MALE, dailyRate: 400, baseSalary: 12000 },
  { code: 'EMP017', prefix: 'นาง', firstName: 'ดาราน้อย', lastName: 'จันทร์เพ็ญ', position: 'แม่บ้าน', siteCode: 'DOWA', gender: Gender.FEMALE, dailyRate: 400, baseSalary: 12000 },
  { code: 'EMP018', prefix: 'นาย', firstName: 'ธนกร', lastName: 'รุ่งเรือง', position: 'หัวหน้าทีมทำความสะอาด', siteCode: 'LCIT', gender: Gender.MALE, dailyRate: 480, baseSalary: 14400 },
  { code: 'EMP019', prefix: 'นางสาว', firstName: 'ศิริพร', lastName: 'บุญนำ', position: 'แม่บ้านประจำเรือ', siteCode: 'LCIT', gender: Gender.FEMALE, dailyRate: 420, baseSalary: 12600 },
  { code: 'EMP020', prefix: 'นาย', firstName: 'อนุรักษ์', lastName: 'คุ้มทรัพย์', position: 'สายกวาด outdoor', siteCode: 'TIPS', gender: Gender.MALE, dailyRate: 400, baseSalary: 12000 },
];

async function main() {
  console.log('🌱 Starting SMARTO database seeding...');

  // Create Sites
  const siteMap = new Map<string, string>();
  for (const s of SITES_DATA) {
    const site = await prisma.site.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        radius: s.radius,
      },
      create: {
        code: s.code,
        name: s.name,
        location: 'นิคมอุตสาหกรรมระยอง/ชลบุรี',
        lat: s.lat,
        lng: s.lng,
        radius: s.radius,
        workStart: 7.0,
        workEnd: 16.0,
        otStart: 16.0,
        otEnd: 19.0,
      },
    });
    siteMap.set(s.code, site.id);

    // Create Payroll Config for each site
    await prisma.payrollConfig.upsert({
      where: { siteId: site.id },
      update: {},
      create: {
        siteId: site.id,
        otRate: 75.0,
        travelAllowance: 50.0,
        diligenceAmount: 1000.0,
        diligenceMaxLate: 3,
        workingDaysPerMonth: 26,
        workingHoursPerDay: 8,
      },
    });
  }
  console.log(`✅ Upserted ${SITES_DATA.length} sites and payroll configurations.`);

  // Create Employees
  for (let i = 0; i < INITIAL_EMPLOYEES.length; i++) {
    const emp = INITIAL_EMPLOYEES[i];
    const siteId = siteMap.get(emp.siteCode) || Array.from(siteMap.values())[0];
    
    const employee = await prisma.employee.upsert({
      where: { code: emp.code },
      update: {
        firstName: emp.firstName,
        lastName: emp.lastName,
        position: emp.position,
        siteId: siteId,
        dailyRate: emp.dailyRate,
        baseSalary: emp.baseSalary,
      },
      create: {
        code: emp.code,
        prefix: emp.prefix,
        firstName: emp.firstName,
        lastName: emp.lastName,
        position: emp.position,
        siteId: siteId,
        gender: emp.gender,
        nationality: 'ไทย',
        salaryType: SalaryType.MONTHLY,
        dailyRate: emp.dailyRate,
        baseSalary: emp.baseSalary,
        phone: `081-${1000000 + i}`,
        bankName: 'ธนาคารกสิกรไทย',
        bankAccount: `123-4-${50000 + i}-9`,
        idCardNo: `1209900${100000 + i}`,
        startDate: new Date('2024-01-15'),
      },
    });

    // Create default Admin and Employee User accounts
    if (i === 0) {
      // HR / Admin User
      await prisma.user.upsert({
        where: { email: 'admin@j2k.co.th' },
        update: { role: Role.ADMIN, employeeId: employee.id },
        create: {
          email: 'admin@j2k.co.th',
          password: 'hashed_password_placeholder', // In prod, hash with bcrypt
          role: Role.ADMIN,
          employeeId: employee.id,
        },
      });
    }

    await prisma.user.upsert({
      where: { email: `${emp.code.toLowerCase()}@j2k.co.th` },
      update: { employeeId: employee.id },
      create: {
        email: `${emp.code.toLowerCase()}@j2k.co.th`,
        password: 'hashed_password_placeholder',
        role: Role.EMPLOYEE,
        employeeId: employee.id,
      },
    });
  }

  console.log(`✅ Upserted ${INITIAL_EMPLOYEES.length} employees and user accounts.`);
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
