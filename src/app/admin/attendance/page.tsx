"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  MapPin,
  ShieldAlert,
  User,
  Search,
  Filter,
  Calendar,
  Clock,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { showSuccess, showConfirm, showWarning, showToast } from "@/lib/swal";

interface Employee {
  id: string;
  code: string;
  prefix: string | null;
  firstName: string;
  lastName: string;
  position: string;
  site?: { name: string; code: string } | null;
  baseSalary: number;
}

interface PendingApproval {
  id: string;
  employeeCode: string;
  employeeName: string;
  position: string;
  siteName: string;
  type: string;
  time: string;
  date: string;
  distance: number;
  reason: string;
}

const INITIAL_PENDINGS: PendingApproval[] = [
  {
    id: "att-1",
    employeeCode: "210993",
    employeeName: "กิมเอิน อีท",
    position: "พ่อบ้าน",
    siteName: "AAM (บริษัท อเมริกัน แอ็คเซิลฯ)",
    type: "CHECK_IN",
    time: "06:52",
    date: "2026-09-21",
    distance: 215,
    reason: "ลงเวลานอกรัศมี Geofence เล็กน้อย (215 เมตร)",
  },
  {
    id: "att-2",
    employeeCode: "120189",
    employeeName: "พัดมา เชื้อวังคำ",
    position: "แม่บ้าน",
    siteName: "AAM (บริษัท อเมริกัน แอ็คเซิลฯ)",
    type: "CHECK_IN",
    time: "06:55",
    date: "2026-09-21",
    distance: 230,
    reason: "สแกนจุดทางเข้าโรงงานใหม่",
  },
  {
    id: "att-3",
    employeeCode: "120748",
    employeeName: "ลลิต อบสุนทร",
    position: "แม่บ้าน",
    siteName: "ABPR1,2 (อมตะ บี.กริม เพาเวอร์)",
    type: "OT_IN",
    time: "16:05",
    date: "2026-09-20",
    distance: 180,
    reason: "ขออนุมัติ OT 1.5 ชม. ประจำกะเย็น",
  },
];

export default function AdminAttendancePage() {
  const [activeTab, setActiveTab] = useState<"timesheet" | "approvals">("timesheet");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [searchEmp, setSearchEmp] = useState<string>("");
  const [period, setPeriod] = useState<string>("2026-09");
  const [pendings, setPendings] = useState<PendingApproval[]>(INITIAL_PENDINGS);
  const [loading, setLoading] = useState(false);

  // Fetch employees for timesheet selector
  useEffect(() => {
    async function fetchEmps() {
      try {
        setLoading(true);
        const res = await fetch("/api/dispatch");
        const data = await res.json();
        if (res.ok && data.employees) {
          setEmployees(data.employees);
          if (data.employees.length > 0) {
            setSelectedEmpId(data.employees[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchEmps();
  }, []);

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId) || employees[0];

  // Generate 21st to 20th Days Array
  // e.g. 21, 22, ..., 31, 1, ..., 20
  const daysCycle = [
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
  ];

  const handleApprove = async (id: string) => {
    showSuccess("อนุมัติเรียบร้อย!", "บันทึกการอนุมัติเวลาปฏิบัติงานสำเร็จ");
    setPendings((prev) => prev.filter((i) => i.id !== id));
  };

  const handleReject = async (id: string) => {
    const confirmed = await showConfirm(
      "ยืนยันการปฏิเสธ",
      "คุณต้องการปฏิเสธการลงเวลานี้ใช่หรือไม่?",
      "ปฏิเสธ",
      "ยกเลิก"
    );
    if (confirmed) {
      showWarning("ปฏิเสธเรียบร้อย", "รายการถูกปฏิเสธแล้ว");
      setPendings((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleBulkApprove = async () => {
    const confirmed = await showConfirm(
      "อนุมัติทั้งหมด (Bulk Approve)",
      `คุณต้องการอนุมัติรายการลงเวลานอกพื้นที่ทั้งหมด (${pendings.length} รายการ) ใช่หรือไม่?`,
      "อนุมัติทั้งหมด",
      "ยกเลิก"
    );
    if (confirmed) {
      showSuccess("อนุมัติทั้งหมดสำเร็จ!", `อนุมัติการลงเวลาจำนวน ${pendings.length} รายการเรียบร้อยแล้ว`);
      setPendings([]);
    }
  };

  const handleExportTimesheetExcel = () => {
    if (!selectedEmployee) return;

    const dataRows = [
      ["แบบฟอร์มสรุปเวลาทำงานของพนักงาน J2K (รอบ 21-20)"],
      ["“The Best Quality Service is our Professional Duty”"],
      ["รหัสพนักงาน: " + selectedEmployee.code, "ชื่อ-สกุล: " + `${selectedEmployee.prefix || ""} ${selectedEmployee.firstName} ${selectedEmployee.lastName}`, "รอบ: " + period],
      [""],
      ["วันที่", ...daysCycle.map(d => String(d)), "รวม"],
      ["เวลาเข้า", ...daysCycle.map(() => "07:00"), "26 วัน"],
      ["เวลาออก", ...daysCycle.map(() => "16:00"), "-"],
      ["เวลาเข้าโอที", ...daysCycle.map(d => d % 2 === 0 ? "16:00" : "-"), "-"],
      ["เวลาออกโอที", ...daysCycle.map(d => d % 2 === 0 ? "17:30" : "-"), "-"],
      ["โอที (1.5)", ...daysCycle.map(d => d % 2 === 0 ? "1.5" : "0"), "20 ชม."],
    ];

    const ws = XLSX.utils.aoa_to_sheet(dataRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Timesheet_${selectedEmployee.code}`);
    XLSX.writeFile(wb, `Timesheet_J2K_${selectedEmployee.code}_${period}.xlsx`);
    showToast("ส่งออกสรุปเวลาทำงานเรียบร้อยแล้ว", "success");
  };

  const filteredEmployees = employees.filter((emp) => {
    const name = `${emp.prefix || ""} ${emp.firstName} ${emp.lastName}`.toLowerCase();
    const code = emp.code.toLowerCase();
    const site = (emp.site?.name || "").toLowerCase();
    const q = searchEmp.toLowerCase();
    return name.includes(q) || code.includes(q) || site.includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Time & Attendance Control Console</span>
          </div>
          <h1 className="text-2xl font-black mt-1">
            ระบบตรวจสอบและสรุปเวลาปฏิบัติงาน (Attendance & Timesheets)
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            แบบฟอร์มสรุปเวลาทำงานของพนักงาน J2K รอบ 21-20 และระบบอนุมัติการลงเวลานอกพื้นที่
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
          <button
            onClick={() => setActiveTab("timesheet")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeTab === "timesheet"
                ? "bg-brand-500 text-white shadow"
                : "text-slate-300 hover:text-white"
            )}
          >
            📋 ฟอร์มสรุปเวลา (รอบ 21-20)
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all relative cursor-pointer",
              activeTab === "approvals"
                ? "bg-brand-500 text-white shadow"
                : "text-slate-300 hover:text-white"
            )}
          >
            🔔 รายการรออนุมัติ ({pendings.length})
          </button>
        </div>
      </div>

      {activeTab === "timesheet" ? (
        /* ======================== TIMESHEET TAB (Attenden) ======================== */
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-card border border-surface-border p-4 rounded-3xl shadow-sm">
            {/* Search and Select Employee */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-content-secondary flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-600" />
                เลือกพนักงาน ({employees.length} ท่าน)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, รหัส, ไซต์งาน..."
                  value={searchEmp}
                  onChange={(e) => setSearchEmp(e.target.value)}
                  className="w-1/2 px-3 py-2 text-xs rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none focus:border-brand-500"
                />
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-1/2 px-3 py-2 text-xs rounded-xl border border-surface-border bg-surface-bg text-content-primary font-bold outline-none focus:border-brand-500"
                >
                  {filteredEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.code} - {emp.prefix || ""} {emp.firstName} {emp.lastName} ({emp.site?.code || "AAM"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cycle Period & Action */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-content-secondary flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                รอบคำนวณ (Cutoff Cycle 21-20)
              </label>
              <div className="flex gap-2">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-surface-bg text-content-primary font-bold outline-none focus:border-brand-500"
                >
                  <option value="2026-09">21 ส.ค. - 20 ก.ย. 2026</option>
                  <option value="2026-08">21 ก.ค. - 20 ส.ค. 2026</option>
                  <option value="2026-07">21 มิ.ย. - 20 ก.ค. 2026</option>
                </select>
                <button
                  onClick={handleExportTimesheetExcel}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm whitespace-nowrap cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Form Header Visual Box */}
          <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-6 overflow-hidden">
            <div className="text-center border-b border-surface-border pb-4 space-y-1">
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 italic">
                “The Best Quality Service is our Professional Duty”
              </p>
              <h2 className="text-lg md:text-xl font-black text-content-primary tracking-tight">
                แบบฟอร์มสรุปเวลาทำงานของพนักงาน J2K (Timesheet Form)
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-content-secondary pt-2">
                <div>
                  <span className="font-bold text-content-primary">รหัสพนักงาน: </span>
                  <span className="font-mono font-bold bg-brand-50 dark:bg-brand-950/50 text-brand-600 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                    {selectedEmployee?.code || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-content-primary">ชื่อ-สกุล: </span>
                  <span className="font-bold text-content-primary">
                    {selectedEmployee?.prefix || ""} {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-content-primary">ตำแหน่ง: </span>
                  <span>{selectedEmployee?.position || "พนักงานทำความสะอาด"}</span>
                </div>
                <div>
                  <span className="font-bold text-content-primary">หน่วยงาน: </span>
                  <span>{selectedEmployee?.site?.name || "AAM"}</span>
                </div>
                <div>
                  <span className="font-bold text-content-primary">รอบ: </span>
                  <span className="font-bold text-brand-600">รอบ 21 - 20 ({period})</span>
                </div>
              </div>
            </div>

            {/* Daily Grid Table (Scrollable X) */}
            <div className="overflow-x-auto pb-2">
              <table className="w-full text-[11px] text-center border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-surface-subtle text-content-secondary font-bold">
                    <th className="p-2 border border-surface-border w-24 text-left">รายการ</th>
                    <th className="p-2 border border-surface-border w-20 text-left">ประเภท</th>
                    {daysCycle.map((d) => (
                      <th
                        key={d}
                        className={cn(
                          "p-1.5 border border-surface-border w-8",
                          d === 21 || d === 1 ? "bg-brand-50 dark:bg-brand-950/40 text-brand-600 font-black" : ""
                        )}
                      >
                        {d}
                      </th>
                    ))}
                    <th className="p-2 border border-surface-border w-16 bg-surface-subtle font-black text-content-primary">
                      รวม
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-mono">
                  {/* Row 1: Time in */}
                  <tr>
                    <td rowSpan={2} className="p-2 border border-surface-border font-sans font-bold text-left bg-surface-subtle/50 text-content-primary">
                      เวลาทำงาน
                    </td>
                    <td className="p-1.5 border border-surface-border text-left font-sans text-content-muted">
                      เวลาเข้า
                    </td>
                    {daysCycle.map((d) => (
                      <td key={d} className="p-1 border border-surface-border text-slate-600 dark:text-slate-300">
                        {d % 7 === 0 ? "OFF" : "07:00"}
                      </td>
                    ))}
                    <td className="p-1.5 border border-surface-border font-bold text-emerald-600 font-sans">
                      26 วัน
                    </td>
                  </tr>

                  {/* Row 2: Time out */}
                  <tr>
                    <td className="p-1.5 border border-surface-border text-left font-sans text-content-muted">
                      เวลาออก
                    </td>
                    {daysCycle.map((d) => (
                      <td key={d} className="p-1 border border-surface-border text-slate-600 dark:text-slate-300">
                        {d % 7 === 0 ? "-" : "16:00"}
                      </td>
                    ))}
                    <td className="p-1.5 border border-surface-border text-content-muted font-sans">-</td>
                  </tr>

                  {/* Row 3: OT in */}
                  <tr className="bg-amber-500/5">
                    <td rowSpan={2} className="p-2 border border-surface-border font-sans font-bold text-left bg-surface-subtle/50 text-content-primary">
                      เวลาทำโอที
                    </td>
                    <td className="p-1.5 border border-surface-border text-left font-sans text-content-muted">
                      เวลาเข้า
                    </td>
                    {daysCycle.map((d) => (
                      <td key={d} className="p-1 border border-surface-border text-amber-700 dark:text-amber-400">
                        {d % 2 === 0 && d % 7 !== 0 ? "16:00" : "-"}
                      </td>
                    ))}
                    <td className="p-1.5 border border-surface-border text-content-muted font-sans">-</td>
                  </tr>

                  {/* Row 4: OT out */}
                  <tr className="bg-amber-500/5">
                    <td className="p-1.5 border border-surface-border text-left font-sans text-content-muted">
                      เวลาออก
                    </td>
                    {daysCycle.map((d) => (
                      <td key={d} className="p-1 border border-surface-border text-amber-700 dark:text-amber-400">
                        {d % 2 === 0 && d % 7 !== 0 ? "17:30" : "-"}
                      </td>
                    ))}
                    <td className="p-1.5 border border-surface-border text-content-muted font-sans">-</td>
                  </tr>

                  {/* Row 5: OT 1 */}
                  <tr>
                    <td className="p-1.5 border border-surface-border font-sans text-left text-content-muted" colSpan={2}>
                      โอที (1)
                    </td>
                    {daysCycle.map((d) => (
                      <td key={d} className="p-1 border border-surface-border text-content-muted">
                        -
                      </td>
                    ))}
                    <td className="p-1.5 border border-surface-border font-bold">0</td>
                  </tr>

                  {/* Row 6: OT 1.5 */}
                  <tr className="font-bold text-brand-600 bg-brand-50/40 dark:bg-brand-950/20">
                    <td className="p-1.5 border border-surface-border font-sans text-left" colSpan={2}>
                      โอที (1.5)
                    </td>
                    {daysCycle.map((d) => (
                      <td key={d} className="p-1 border border-surface-border">
                        {d % 2 === 0 && d % 7 !== 0 ? "1.5" : "0"}
                      </td>
                    ))}
                    <td className="p-1.5 border border-surface-border font-black text-xs text-brand-600">
                      20.0 ชม.
                    </td>
                  </tr>

                  {/* Row 7: OT 2 */}
                  <tr>
                    <td className="p-1.5 border border-surface-border font-sans text-left text-content-muted" colSpan={2}>
                      โอที (2)
                    </td>
                    {daysCycle.map((d) => (
                      <td key={d} className="p-1 border border-surface-border text-content-muted">
                        -
                      </td>
                    ))}
                    <td className="p-1.5 border border-surface-border font-bold">0</td>
                  </tr>

                  {/* Row 8: OT 3 */}
                  <tr>
                    <td className="p-1.5 border border-surface-border font-sans text-left text-content-muted" colSpan={2}>
                      โอที (3)
                    </td>
                    {daysCycle.map((d) => (
                      <td key={d} className="p-1 border border-surface-border text-content-muted">
                        -
                      </td>
                    ))}
                    <td className="p-1.5 border border-surface-border font-bold">0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Income & Deduction Summary Matrix - Matching Attenden sheet bottom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-surface-border">
              {/* Income Preview */}
              <div className="bg-surface-subtle/60 rounded-2xl p-4 border border-surface-border space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                  <span className="font-bold text-xs text-emerald-600 uppercase tracking-wider">
                    รายรับที่คำนวณได้ (Calculated Income)
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600">THB</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-content-secondary">ฐานเงินเดือน (Base):</span>
                    <span className="font-bold text-content-primary">
                      {Number(selectedEmployee?.baseSalary || 12000).toLocaleString()} ฿
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-secondary">โอที 1.5 (20 ชม. x 75฿):</span>
                    <span className="font-bold text-brand-600">1,500 ฿</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-secondary">เบี้ยขยัน (Diligence):</span>
                    <span className="font-bold text-content-primary">1,000 ฿</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-secondary">ค่าเดินทาง (Travel Allow):</span>
                    <span className="font-bold text-content-primary">1,000 ฿</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-surface-border font-bold text-sm">
                    <span className="text-content-primary">รวมรายรับ:</span>
                    <span className="text-emerald-600">
                      {(Number(selectedEmployee?.baseSalary || 12000) + 3500).toLocaleString()} ฿
                    </span>
                  </div>
                </div>
              </div>

              {/* Deduction Preview */}
              <div className="bg-surface-subtle/60 rounded-2xl p-4 border border-surface-border space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                  <span className="font-bold text-xs text-rose-600 uppercase tracking-wider">
                    รายการหัก (Deductions)
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-600">THB</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-content-secondary">หัก ปกส. 5% (ประกันสังคม):</span>
                    <span className="font-bold text-rose-600">600 ฿</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-secondary">หัก ภาษี ณ ที่จ่าย:</span>
                    <span className="font-bold text-rose-600">120 ฿</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-secondary">หักเงินสงเคราะห์ (Welfare):</span>
                    <span className="font-bold text-rose-600">30 ฿</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-surface-border font-bold text-sm">
                    <span className="text-content-primary">รวมเงินรับสุทธิ (Net Pay):</span>
                    <span className="text-brand-600 font-black">
                      {(Number(selectedEmployee?.baseSalary || 12000) + 3500 - 750).toLocaleString()} ฿
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ======================== APPROVALS TAB ======================== */
        <div className="bg-surface-bg rounded-2xl border border-surface-border overflow-hidden">
          <div className="p-4 border-b border-surface-border flex items-center justify-between">
            <span className="font-semibold text-sm text-content-primary">
              รายการรอการอนุมัติ ({pendings.length})
            </span>
            <button
              onClick={handleBulkApprove}
              disabled={pendings.length === 0}
              className="px-3 py-1.5 rounded-xl bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 disabled:opacity-50 transition-colors cursor-pointer"
            >
              อนุมัติทั้งหมด (Bulk Approve)
            </button>
          </div>

          {pendings.length === 0 ? (
            <div className="p-8 text-center text-content-muted text-xs">
              🎉 ไม่มีรายการค้างรออนุมัติ การลงเวลาทั้งหมดได้รับการตรวจสอบเรียบร้อยแล้ว
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {pendings.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-subtle transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded">
                        {item.employeeCode}
                      </span>
                      <span className="font-semibold text-sm text-content-primary">{item.employeeName}</span>
                      <span className="text-xs text-content-muted">({item.position})</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-content-secondary">
                      <span className="flex items-center gap-1 font-semibold text-content-primary">
                        <MapPin className="w-3.5 h-3.5 text-brand-600" />
                        {item.siteName}
                      </span>
                      <span>•</span>
                      <span>วันที่ {item.date}</span>
                      <span>•</span>
                      <span className="font-mono font-bold text-content-primary">{item.time} น.</span>
                      <span>•</span>
                      <span className="font-bold text-amber-600">
                        {item.type === "CHECK_IN" ? "เข้างาน" : "ทำ OT"}
                      </span>
                    </div>

                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-lg inline-block border border-amber-200 dark:border-amber-800">
                      ⚠️ {item.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(item.id)}
                      className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-colors cursor-pointer"
                    >
                      ปฏิเสธ
                    </button>
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      อนุมัติ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
