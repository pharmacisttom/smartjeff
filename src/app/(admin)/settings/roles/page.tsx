"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Users,
  Lock,
  CheckCircle2,
  Building,
  KeyRound,
  FileText,
  Clock,
  DollarSign,
  UserCheck,
} from "lucide-react";
import { showSuccess, showToast } from "@/lib/swal";

interface J2KStaff {
  id: string;
  name: string;
  position: string;
  site: string;
  role: string;
  roleTitle: string;
  permissions: string[];
}

const J2K_STAFF_MATRIX: J2KStaff[] = [
  {
    id: "1",
    name: "นายปณิธาน ลานทองกุล",
    position: "กรรมการผู้จัดการ / เจ้าของกิจการ",
    site: "สำนักงานใหญ่ J2K",
    role: "EXECUTIVE",
    roleTitle: "ผู้บริหารระดับสูง (ดูได้ทั้งหมด)",
    permissions: ["ดูได้ทั้งหมด (Full Access)", "อนุมัติงบประมาณ", "ตั้งค่าระบบ", "รายงานผู้บริหาร", "เข้าถึงทุกโมดูล"],
  },
  {
    id: "2",
    name: "นางอัศนา ธรรมถาวร",
    position: "ผู้ช่วยผู้บริหาร (ASST.)",
    site: "สำนักงานใหญ่ J2K",
    role: "EXECUTIVE",
    roleTitle: "ผู้บริหารระดับสูง (ดูได้ทั้งหมด)",
    permissions: ["ดูได้ทั้งหมด (Full Access)", "อนุมัติงบประมาณ", "ตั้งค่าระบบ", "รายงานผู้บริหาร", "เข้าถึงทุกโมดูล"],
  },
  {
    id: "3",
    name: "น.ส.ยุพดี วะโร",
    position: "ผู้จัดการฝ่ายการเงินและบัญชี (Finance & Accounting)",
    site: "สำนักงานใหญ่ J2K",
    role: "HR_PAYROLL",
    roleTitle: "ฝ่ายการเงิน & ผู้จัดการเงินเดือน",
    permissions: ["เวลาเข้า-ออก", "เงินเดือน (คำนวณ & แก้ไข)", "Attendance", "slip", "ประวัติพนักงาน", "Customer", "โอที", "เวลาทำงาน", "เอกสารส่งตัว"],
  },
  {
    id: "4",
    name: "นางเนตรนภา อินทร์ผลเล็ก",
    position: "ผู้จัดการทั่วไป (Manager)",
    site: "สำนักงานใหญ่ J2K",
    role: "HR_PAYROLL",
    roleTitle: "ผู้จัดการฝ่ายปฏิบัติการ & ทรัพยากรบุคคล",
    permissions: ["เวลาเข้า-ออก", "เงินเดือน", "Attendance", "slip", "ประวัติพนักงาน", "Customer", "โอที", "เวลาทำงาน", "เอกสารส่งตัว"],
  },
  {
    id: "5",
    name: "นางสาวอรอุมา วิเวช",
    position: "ผู้ประสานงานหน่วยงาน (Site Coordinator)",
    site: "สำนักงานใหญ่ / หน่วยงานภาคสนาม",
    role: "OPERATIONS",
    roleTitle: "ประสานงานโครงการ & ธุรการ HR",
    permissions: ["เวลาเข้า-ออก", "Attendance", "slip", "ประวัติพนักงาน", "Customer", "โอที", "เวลาทำงาน", "เอกสารส่งตัว"],
  },
  {
    id: "6",
    name: "นางสาวชุลีพร แซ่เอี๊ยว",
    position: "เจ้าหน้าที่ฝ่ายประสานงานลูกค้า (Client Coordinator)",
    site: "สำนักงานใหญ่ J2K",
    role: "OPERATIONS",
    roleTitle: "ธุรการโครงการ & ทรัพยากรบุคคล",
    permissions: ["เวลาเข้า-ออก", "Attendance", "slip", "ประวัติพนักงาน", "Customer", "โอที", "เวลาทำงาน", "เอกสารส่งตัว"],
  },
  {
    id: "7",
    name: "นางสาวสริญญา ชะนิดนอก",
    position: "หัวหน้าแม่บ้านประจำหน่วยงาน (Site Leader)",
    site: "หน่วยงาน AAM (อเมริกัน แอ็คเซิล)",
    role: "SUPERVISOR",
    roleTitle: "หัวหน้างานประจำไซต์",
    permissions: ["โอที", "Attendance", "เวลาทำงาน"],
  },
  {
    id: "8",
    name: "นางสาวสร้อยทิพย์ มณีศรี",
    position: "หัวหน้าแม่บ้านประจำหน่วยงาน (Site Leader)",
    site: "หน่วยงาน ABPR 1,2 (อมตะ บี.กริม)",
    role: "SUPERVISOR",
    roleTitle: "หัวหน้างานประจำไซต์",
    permissions: ["โอที", "Attendance", "เวลาทำงาน"],
  },
  {
    id: "9",
    name: "นางจารุวรรณ แก้วมูล",
    position: "หัวหน้าแม่บ้านประจำหน่วยงาน (Site Leader)",
    site: "หน่วยงาน ABPR 3,4 (อมตะ บี.กริม)",
    role: "SUPERVISOR",
    roleTitle: "หัวหน้างานประจำไซต์",
    permissions: ["โอที", "Attendance", "เวลาทำงาน"],
  },
  {
    id: "10",
    name: "น.ส.อรอุมา สิงห์ทองลา",
    position: "หัวหน้าแม่บ้านประจำหน่วยงาน (Site Leader)",
    site: "หน่วยงาน ABPR 5 (อมตะ บี.กริม)",
    role: "SUPERVISOR",
    roleTitle: "หัวหน้างานประจำไซต์",
    permissions: ["โอที", "Attendance", "เวลาทำงาน"],
  },
  {
    id: "11",
    name: "นางจิราภา ชินบุตร",
    position: "หัวหน้างานประจำหน่วยงาน (Site Leader)",
    site: "หน่วยงาน BW (บอร์กวอร์เนอร์)",
    role: "SUPERVISOR",
    roleTitle: "หัวหน้างานประจำไซต์",
    permissions: ["โอที", "Attendance", "เวลาทำงาน"],
  },
  {
    id: "12",
    name: "นางสาวอัญชลี วงค์ใหญ่",
    position: "หัวหน้าแม่บ้านประจำหน่วยงาน (Site Leader)",
    site: "หน่วยงาน JATH (เจเทคโตะ)",
    role: "SUPERVISOR",
    roleTitle: "หัวหน้างานประจำไซต์",
    permissions: ["โอที", "Attendance", "เวลาทำงาน"],
  },
  {
    id: "13",
    name: "ปรียาพรรณ ฟูวุฒิ",
    position: "หัวหน้าแม่บ้านประจำหน่วยงาน (Site Leader)",
    site: "หน่วยงาน MTAT (เอ็มแอนด์ที)",
    role: "SUPERVISOR",
    roleTitle: "หัวหน้างานประจำไซต์",
    permissions: ["โอที", "Attendance", "เวลาทำงาน"],
  },
];

export default function RoleSettingsPage() {
  const [staffList, setStaffList] = useState<J2KStaff[]>(J2K_STAFF_MATRIX);
  const [selectedStaff, setSelectedStaff] = useState<J2KStaff | null>(null);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "EXECUTIVE":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
      case "HR_PAYROLL":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
      case "OPERATIONS":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
      case "SUPERVISOR":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-brand-400 tracking-wider uppercase">
              J2K STAFF AUTHORIZATION MATRIX (จาก Staff_info)
            </span>
            <h1 className="text-2xl font-black tracking-tight">โครงสร้างสิทธิ์การเข้าถึงระบบ J2K</h1>
            <p className="text-xs text-slate-300">
              จัดการการมอบหมายสิทธิ์ 4 ระดับ สำหรับผู้บริหาร ฝ่ายการเงิน/เงินเดือน ฝ่ายประสานงาน และหัวหน้าแม่บ้านประจำไซต์
            </p>
          </div>
        </div>
      </div>

      {/* 4 Authorization Tiers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl border border-purple-500/30 bg-purple-500/5 text-purple-700 dark:text-purple-300 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Tier 1: ผู้บริหารสูงสุด</span>
            <span className="font-mono text-[10px] bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded">EXECUTIVE</span>
          </div>
          <h3 className="font-bold text-content-primary text-base">ดูได้ทั้งหมด</h3>
          <p className="text-xs text-content-muted leading-relaxed">
            สิทธิ์สูงสุด เข้าถึงรายงานทางการเงิน ตรวจสอบพนักงาน บันทึกการลงเวลา และการอนุมัติทั้งหมด
          </p>
          <div className="pt-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
            • คุณปณิธาน, คุณอัศนา
          </div>
        </div>

        <div className="p-5 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Tier 2: การเงิน & HR</span>
            <span className="font-mono text-[10px] bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">PAYROLL_MGR</span>
          </div>
          <h3 className="font-bold text-content-primary text-base">เงินเดือน & เวลาทำงาน</h3>
          <p className="text-xs text-content-muted leading-relaxed">
            จัดการระบบเงินเดือน สลิปเงินเดือน เวลาเข้า-ออก Attendance ลูกค้า และออกเอกสารส่งตัว
          </p>
          <div className="pt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            • คุณยุพดี (Finance), คุณเนตรนภา (Mgr.)
          </div>
        </div>

        <div className="p-5 rounded-3xl border border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Tier 3: ฝ่ายประสานงาน</span>
            <span className="font-mono text-[10px] bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded">OPERATIONS</span>
          </div>
          <h3 className="font-bold text-content-primary text-base">ประสานงาน & เอกสาร</h3>
          <p className="text-xs text-content-muted leading-relaxed">
            สิทธิ์เข้าถึงข้อมูลพนักงาน เวลาเข้า-ออก สลิป ลูกค้า และเอกสารส่งตัวพนักงาน
          </p>
          <div className="pt-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
            • คุณอรอุมา (Site Co.), คุณชุลีพร
          </div>
        </div>

        <div className="p-5 rounded-3xl border border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Tier 4: หัวหน้าแม่บ้าน</span>
            <span className="font-mono text-[10px] bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">SUPERVISOR</span>
          </div>
          <h3 className="font-bold text-content-primary text-base">โอที & เวลาทำงาน</h3>
          <p className="text-xs text-content-muted leading-relaxed">
            สิทธิ์ลงเวลาและอนุมัติโอที บันทึก Attendance ของแม่บ้านในไซต์งานที่ตนเองรับผิดชอบ
          </p>
          <div className="pt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            • 7 หัวหน้างานประจำหน่วยงาน
          </div>
        </div>
      </div>

      {/* Staff Permission Assignment Table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div>
            <h2 className="text-base font-bold text-content-primary">ตารางสิทธิ์การใช้งานของบุคลากร J2K (Staff Authorization Table)</h2>
            <p className="text-xs text-content-muted mt-0.5">
              ข้อมูลเชื่อมโยงจากแผ่นงาน Staff_info ในไฟล์ jeffy1.xlsx
            </p>
          </div>
          <span className="text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/40 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800">
            {staffList.length} รายชื่อผู้มีสิทธิ์
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-surface-border text-content-muted font-bold uppercase bg-surface-subtle">
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4">ตำแหน่งงาน</th>
                <th className="py-3 px-4">หน่วยงานที่สังกัด</th>
                <th className="py-3 px-4">บทบาทในระบบ</th>
                <th className="py-3 px-4">ขอบเขตสิทธิ์ที่ได้รับ (Permissions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-surface-subtle/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-content-primary">
                    {staff.name}
                  </td>
                  <td className="py-3.5 px-4 text-content-secondary font-medium">
                    {staff.position}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-content-primary flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-brand-600" />
                      {staff.site}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getRoleBadge(staff.role)}`}>
                      {staff.roleTitle}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {staff.permissions.map((p, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-surface-subtle text-content-secondary text-[10px] font-medium border border-surface-border/50"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
