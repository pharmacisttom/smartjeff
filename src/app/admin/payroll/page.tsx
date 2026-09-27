"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Calculator,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle,
  Users,
  Search,
  Filter,
  Eye,
  Printer,
  X,
  Building,
  CreditCard,
} from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showLoading, closeSwal, showToast } from "@/lib/swal";

interface Payslip {
  id: string;
  period: string;
  baseSalary: number;
  dailyRate?: number;
  workedDays?: number;
  dailyAmount?: number;
  otHours: number;
  otAmount: number;
  ot15Hours?: number;
  ot15Amount?: number;
  travelAllow: number;
  diligence: number;
  positionAllow?: number;
  phoneAllow?: number;
  heatAllow?: number;
  otherIncome: number;
  grossIncome?: number;
  tax: number;
  socialSec: number;
  welfareDeduct?: number;
  otherDeduct: number;
  totalDeduct?: number;
  netPay: number;
  employee: {
    id: string;
    code: string;
    prefix?: string | null;
    firstName: string;
    lastName: string;
    position: string;
    idCardNo?: string | null;
    startDate?: string | null;
    site?: { id: string; name: string; code: string } | null;
  };
}

export default function AdminPayrollPage() {
  const [period, setPeriod] = useState<string>("2026-09");
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSiteCode, setSelectedSiteCode] = useState("ALL");
  const [activeModalSlip, setActiveModalSlip] = useState<Payslip | null>(null);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/payroll?period=${period}`);
      const data = await res.json();
      if (res.ok) {
        setPayslips(data.payslips || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [period]);

  const handleRunPayroll = async () => {
    try {
      setCalculating(true);
      showLoading("กำลังประมวลผลคำนวณเงินเดือน...", `คำนวณยอดเงินเดือน สถิติเวลา เบี้ยขยัน ประกันสังคม ภาษี สำหรับงวด ${period}`);

      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      const data = await res.json();
      closeSwal();

      if (res.ok) {
        showSuccess("ประมวลผลเงินเดือนสำเร็จ!", data.message || `คำนวณยอดเงินเดือนประจำงวด ${period} เรียบร้อยแล้ว`);
        fetchPayroll();
      } else {
        showError("เกิดข้อผิดพลาดในการคำนวณ", data.message || "ไม่สามารถประมวลผลได้");
      }
    } catch (e) {
      closeSwal();
      showError("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setCalculating(false);
    }
  };

  const handleExportExcel = () => {
    if (filteredPayslips.length === 0) return;

    const exportData = filteredPayslips.map((p, idx) => ({
      ลำดับ: idx + 1,
      รหัสพนักงาน: p.employee.code,
      ชื่อพนักงาน: `${p.employee.prefix || ""} ${p.employee.firstName} ${p.employee.lastName}`,
      ตำแหน่ง: p.employee.position,
      หน่วยงาน: p.employee.site?.code || "AAM",
      ชื่อโรงงาน: p.employee.site?.name || "AAM",
      รายเดือน: Number(p.baseSalary),
      "โอที(1.5) ชม.": p.ot15Hours || p.otHours || 0,
      "เงินโอที(1.5)": Number(p.ot15Amount || p.otAmount || 0),
      ค่าเดินทาง: Number(p.travelAllow || 0),
      เบี้ยขยัน: Number(p.diligence || 0),
      ค่าตำแหน่ง: Number(p.positionAllow || 0),
      ค่าโทร: Number(p.phoneAllow || 0),
      ค่าร้อน: Number(p.heatAllow || 0),
      รวมรายรับ: Number(p.grossIncome || (p.baseSalary + p.otAmount + p.travelAllow + p.diligence)),
      "หัก ปกส. 5%": Number(p.socialSec),
      หักภาษี: Number(p.tax),
      หักเงินสงเคราะห์: Number(p.welfareDeduct || 30),
      รวมหัก: Number(p.totalDeduct || (p.socialSec + p.tax + (p.welfareDeduct || 30))),
      ยอดรับสุทธิ: Number(p.netPay),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Payroll_${period}`);
    XLSX.writeFile(workbook, `J2K_Payroll_${period}.xlsx`);

  const [showBankExportModal, setShowBankExportModal] = useState(false);
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false);
  const [selectedBankFormat, setSelectedBankFormat] = useState<"KBANK" | "SCB" | "BBL" | "GENERIC_CSV">("KBANK");
  const [companyAccount, setCompanyAccount] = useState("058-1-98765-4");
  const [transferDate, setTransferDate] = useState("2026-09-30");

  const handleDownloadBankFile = () => {
    if (filteredPayslips.length === 0) return;

    let content = "";
    let filename = "";
    let mimeType = "text/plain;charset=utf-8";

    const cleanAcc = (acc?: string | null) => (acc || "0000000000").replace(/[^0-9]/g, "");
    const cleanId = (id?: string | null) => (id || "0000000000000").replace(/[^0-9]/g, "");

    if (selectedBankFormat === "KBANK") {
      const dateKbank = transferDate.replace(/-/g, "");
      const header = `H|004|${cleanAcc(companyAccount)}|${dateKbank}|${filteredPayslips.length}|${totalNet.toFixed(2)}\r\n`;
      const rows = filteredPayslips
        .map((p) => {
          const empName = `${p.employee.prefix || ""} ${p.employee.firstName} ${p.employee.lastName}`.trim();
          return `D|004|${cleanAcc(p.employee.bankAccount).padEnd(10, "0")}|${Number(p.netPay).toFixed(2)}|${cleanId(p.employee.idCardNo).padEnd(13, "0")}|${empName}|${p.employee.code}`;
        })
        .join("\r\n");
      content = header + rows;
      filename = `KBANK_PAYROLL_${period}_${dateKbank}.txt`;
    } else if (selectedBankFormat === "SCB") {
      const dateScb = transferDate.replace(/-/g, "");
      const header = `01${cleanAcc(companyAccount).padStart(10, "0")}${dateScb}${filteredPayslips.length.toString().padStart(6, "0")}${Math.round(totalNet * 100).toString().padStart(13, "0")}\r\n`;
      const rows = filteredPayslips
        .map((p) => {
          const acc = cleanAcc(p.employee.bankAccount).padEnd(10, " ");
          const amt = Math.round(Number(p.netPay) * 100).toString().padStart(10, "0");
          const idCard = cleanId(p.employee.idCardNo).padEnd(13, " ");
          const empName = `${p.employee.firstName} ${p.employee.lastName}`.substring(0, 50).padEnd(50, " ");
          return `02${acc}${amt}${idCard}${empName}`;
        })
        .join("\r\n");
      content = header + rows;
      filename = `SCB_PAYROLL_${period}_${dateScb}.txt`;
    } else if (selectedBankFormat === "BBL") {
      const dateBbl = transferDate.replace(/-/g, "");
      const header = `H${cleanAcc(companyAccount).padEnd(10, " ")}${dateBbl}${filteredPayslips.length.toString().padStart(6, "0")}${Math.round(totalNet * 100).toString().padStart(12, "0")}\r\n`;
      const rows = filteredPayslips
        .map((p) => {
          const acc = cleanAcc(p.employee.bankAccount).padEnd(10, " ");
          const amt = Math.round(Number(p.netPay) * 100).toString().padStart(11, "0");
          const idCard = cleanId(p.employee.idCardNo).padEnd(13, " ");
          const empName = `${p.employee.firstName} ${p.employee.lastName}`.substring(0, 40).padEnd(40, " ");
          return `D${acc}${amt}${idCard}${empName}`;
        })
        .join("\r\n");
      content = header + rows;
      filename = `BBL_PAYROLL_${period}_${dateBbl}.txt`;
    } else {
      mimeType = "text/csv;charset=utf-8";
      const bom = "\uFEFF";
      const header = "ลำดับ,รหัสพนักงาน,คำนำหน้า,ชื่อ,นามสกุล,เลขประจำตัวประชาชน,ธนาคาร,เลขที่บัญชี,ยอดเงินสุทธิ,งวดเดือน,โรงงาน\r\n";
      const rows = filteredPayslips
        .map((p, idx) => {
          return `${idx + 1},"${p.employee.code}","${p.employee.prefix || ""}","${p.employee.firstName}","${p.employee.lastName}","${p.employee.idCardNo || ""}","${p.employee.bankName || "กสิกรไทย"}","${p.employee.bankAccount || ""}","${Number(p.netPay).toFixed(2)}","${period}","${p.employee.site?.code || "AAM"}"`;
        })
        .join("\r\n");
      content = bom + header + rows;
      filename = `BANK_PAYROLL_TRANSFER_${period}.csv`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowBankExportModal(false);
    showToast(`ดาวน์โหลดไฟล์โอนเงินธนาคาร (${selectedBankFormat}) เรียบร้อยแล้ว`, "success");
  };

  // Distinct sites for filter
  const distinctSites = Array.from(
    new Set(payslips.map((p) => p.employee.site?.code).filter(Boolean))
  ) as string[];

  // Filtered payslips
  const filteredPayslips = payslips.filter((p) => {
    const name = `${p.employee.prefix || ""} ${p.employee.firstName} ${p.employee.lastName}`.toLowerCase();
    const code = p.employee.code.toLowerCase();
    const siteCode = (p.employee.site?.code || "").toLowerCase();
    const siteName = (p.employee.site?.name || "").toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesQuery = name.includes(q) || code.includes(q) || siteCode.includes(q) || siteName.includes(q);
    const matchesSite = selectedSiteCode === "ALL" || p.employee.site?.code === selectedSiteCode;

    return matchesQuery && matchesSite;
  });

  // Calculate Totals
  const totalBase = filteredPayslips.reduce((acc, curr) => acc + Number(curr.baseSalary), 0);
  const totalOT = filteredPayslips.reduce((acc, curr) => acc + Number(curr.otAmount), 0);
  const totalNet = filteredPayslips.reduce((acc, curr) => acc + Number(curr.netPay), 0);

  const formatDisplayDate = (dStr?: string | null) => {
    if (!dStr) return "-";
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Payroll Engine Console (J2K Housekeeping)</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">ศูนย์คำนวณเงินเดือนพนักงาน J2K</h1>
          <p className="text-sm text-slate-300">
            คำนวณเงินเดือนอัตโนมัติ 32 รายการ: ฐานเงินเดือน, ค่า OT, ค่าเดินทาง, เบี้ยขยัน, ค่าตำแหน่ง/โทร, ประกันสังคม และหักเงินสงเคราะห์
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunPayroll}
            disabled={calculating}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>{calculating ? "กำลังคำนวณ..." : "ประมวลผลเงินเดือนงวดนี้"}</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Filters & Export */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface-card border border-surface-border p-4 rounded-3xl shadow-sm">
        {/* Period Selector */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-content-secondary flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-brand-600" />
            งวดคำนวณเงินเดือน
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary font-bold text-xs outline-none focus:border-brand-500"
          >
            <option value="2026-09">กันยายน 2026 (2026-09)</option>
            <option value="2026-08">สิงหาคม 2026 (2026-08)</option>
            <option value="2026-07">กรกฎาคม 2026 (2026-07)</option>
          </select>
        </div>

        {/* Site Filter */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-content-secondary flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-brand-600" />
            กรองตามหน่วยงาน / โรงงาน
          </label>
          <select
            value={selectedSiteCode}
            onChange={(e) => setSelectedSiteCode(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary font-bold text-xs outline-none focus:border-brand-500"
          >
            <option value="ALL">ทุกหน่วยงาน (ทั้งหมด {payslips.length} ท่าน)</option>
            {distinctSites.map((site) => (
              <option key={site} value={site}>
                หน่วยงาน {site}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-content-secondary flex items-center gap-1">
            <Search className="w-3.5 h-3.5 text-brand-600" />
            ค้นหาชื่อ / รหัส
          </label>
          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัส..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary text-xs outline-none focus:border-brand-500"
          />
        </div>

        {/* Export & Print Buttons */}
        <div className="flex items-end gap-1.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleExportExcel}
            disabled={filteredPayslips.length === 0}
            className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl border border-surface-border bg-surface-bg hover:bg-surface-subtle text-content-primary font-bold text-xs transition-all disabled:opacity-40 cursor-pointer shadow-sm"
            title="ส่งออกไฟล์ Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => setShowBankExportModal(true)}
            disabled={filteredPayslips.length === 0}
            className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all disabled:opacity-40 cursor-pointer shadow-sm"
            title="ส่งออกไฟล์โอนเงินธนาคาร KBank / SCB / BBL / PromptPay"
          >
            <CreditCard className="w-4 h-4" />
            <span>โอนธนาคาร</span>
          </button>
          <button
            onClick={() => setShowBatchPrintModal(true)}
            disabled={filteredPayslips.length === 0}
            className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all disabled:opacity-40 cursor-pointer shadow-sm"
            title="พิมพ์สลิปเงินเดือนคาร์บอนทั้งหมด"
          >
            <Printer className="w-4 h-4" />
            <span>สลิปรวม</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-content-muted">ยอดจ่ายสุทธิรวม (Total Net Payment)</span>
          <p className="text-2xl font-black text-brand-600">{totalNet.toLocaleString()} ฿</p>
          <span className="text-[11px] text-content-muted">จำนวน {filteredPayslips.length} รายการ</span>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-content-muted">รวมฐานเงินเดือน (Total Base Salary)</span>
          <p className="text-2xl font-black text-content-primary">{totalBase.toLocaleString()} ฿</p>
          <span className="text-[11px] text-content-muted">เงินเดือนตั้งต้นพนักงาน</span>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-content-muted">รวมเงินค่า OT (Total Overtime)</span>
          <p className="text-2xl font-black text-amber-600">{totalOT.toLocaleString()} ฿</p>
          <span className="text-[11px] text-content-muted">โอทีสะสมตามงวด</span>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-content-muted animate-pulse">
            กำลังโหลดข้อมูลสลิปเงินเดือนงวด {period}...
          </div>
        ) : filteredPayslips.length === 0 ? (
          <div className="py-16 text-center text-content-muted space-y-2">
            <Calculator className="w-12 h-12 mx-auto text-content-muted/40" />
            <p className="font-bold text-sm text-content-primary">ไม่พบข้อมูลสลิปเงินเดือน</p>
            <p className="text-xs">กดปุ่ม &quot;ประมวลผลเงินเดือนงวดนี้&quot; ด้านบนเพื่อคำนวณเงินเดือน</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-[11px] text-content-muted font-bold uppercase bg-surface-subtle">
                  <th className="py-3 px-3">รหัส/ชื่อพนักงาน</th>
                  <th className="py-3 px-3">ตำแหน่ง/หน่วยงาน</th>
                  <th className="py-3 px-3 text-right">เงินเดือนฐาน</th>
                  <th className="py-3 px-3 text-right">ค่า OT</th>
                  <th className="py-3 px-3 text-right">เบี้ยขยัน</th>
                  <th className="py-3 px-3 text-right">ค่าเดินทาง</th>
                  <th className="py-3 px-3 text-right">หัก ปกส. 5%</th>
                  <th className="py-3 px-3 text-right">หักภาษี</th>
                  <th className="py-3 px-3 text-right">ยอดรับสุทธิ</th>
                  <th className="py-3 px-3 text-center">สลิป</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs">
                {filteredPayslips.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-content-primary">
                        {p.employee.prefix || ""} {p.employee.firstName} {p.employee.lastName}
                      </div>
                      <span className="text-[11px] text-content-muted font-mono">{p.employee.code}</span>
                    </td>
                    <td className="py-3 px-3 text-content-secondary">
                      <div>{p.employee.position}</div>
                      <span className="text-[10px] text-brand-600 font-bold bg-brand-50 dark:bg-brand-950/40 px-1.5 py-0.5 rounded">
                        {p.employee.site?.code || "AAM"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-content-primary">
                      {Number(p.baseSalary).toLocaleString()} ฿
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-amber-600">
                      +{Number(p.otAmount).toLocaleString()} ฿
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-emerald-600">
                      +{Number(p.diligence || 0).toLocaleString()} ฿
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-content-primary">
                      +{Number(p.travelAllow || 0).toLocaleString()} ฿
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-rose-600">
                      -{Number(p.socialSec).toLocaleString()} ฿
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-rose-600">
                      -{Number(p.tax).toLocaleString()} ฿
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-black text-brand-600 text-sm">
                        {Number(p.netPay).toLocaleString()} ฿
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setActiveModalSlip(p)}
                        className="p-1.5 rounded-lg bg-surface-subtle hover:bg-brand-50 hover:text-brand-600 text-content-secondary transition-colors cursor-pointer"
                        title="ดูใบสลิปเงินเดือน J2K"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* OFFICIAL J2K PAYSLIP MODAL (Matching Slip Sheet) */}
      {activeModalSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative my-8 border border-slate-200">
            {/* Close Button */}
            <button
              onClick={() => setActiveModalSlip(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Header */}
            <div className="text-center border-b-2 border-slate-800 pb-3 space-y-0.5">
              <h3 className="text-lg md:text-xl font-black text-slate-900">
                บริษัท เจทูเค เฮ้าส์คีพปิ้ง เซอร์วิส จำกัด
              </h3>
              <p className="text-xs font-semibold text-slate-600">
                J2K Housekeeping Service Co., Ltd.
              </p>
              <p className="text-[11px] text-slate-500">
                235 หมู่ที่ 4 ตำบลปลวกแดง อำเภอปลวกแดง จังหวัดระยอง 21140 โทรศัพท์ 097-253-9456
              </p>
            </div>

            {/* Slip Meta */}
            <div className="grid grid-cols-2 gap-3 text-xs py-3 border-b border-slate-200">
              <div>
                <span className="font-bold text-slate-700">รอบ: </span>
                <span className="font-semibold">{activeModalSlip.period}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-700">รหัสพนักงาน: </span>
                <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                  {activeModalSlip.employee.code}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-700">ชื่อ-นามสกุล: </span>
                <span className="font-bold">
                  {activeModalSlip.employee.prefix || ""} {activeModalSlip.employee.firstName} {activeModalSlip.employee.lastName}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-700">ตำแหน่ง: </span>
                <span>{activeModalSlip.employee.position}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">หมายเลขบัตรผู้เสียภาษี: </span>
                <span className="font-mono">{activeModalSlip.employee.idCardNo || "1-4603-00011-72-0"}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-700">หน่วยงาน: </span>
                <span className="font-semibold text-blue-700">{activeModalSlip.employee.site?.name || "AAM"}</span>
              </div>
            </div>

            {/* 2-Column Table: Income vs Deduction */}
            <div className="grid grid-cols-2 divide-x divide-slate-200 text-xs my-3 border border-slate-200 rounded-xl overflow-hidden">
              {/* Left: รายการรับ (Income) */}
              <div className="p-3 space-y-2">
                <div className="font-bold text-blue-800 pb-1.5 border-b border-slate-200 uppercase tracking-wider">
                  รายการรับ (Income)
                </div>
                <div className="flex justify-between">
                  <span>เงินเดือน / Salary:</span>
                  <span className="font-semibold">{Number(activeModalSlip.baseSalary).toLocaleString()} ฿</span>
                </div>
                <div className="flex justify-between">
                  <span>ค่าล่วงเวลา / โอที (1.5):</span>
                  <span className="font-semibold text-amber-700">
                    {Number(activeModalSlip.ot15Amount || activeModalSlip.otAmount || 0).toLocaleString()} ฿
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ค่าเดินทาง / ค่าน้ำมัน:</span>
                  <span className="font-semibold">{Number(activeModalSlip.travelAllow || 0).toLocaleString()} ฿</span>
                </div>
                <div className="flex justify-between">
                  <span>เบี้ยขยัน:</span>
                  <span className="font-semibold text-emerald-700">{Number(activeModalSlip.diligence || 0).toLocaleString()} ฿</span>
                </div>
                {activeModalSlip.positionAllow ? (
                  <div className="flex justify-between">
                    <span>ค่าตำแหน่ง:</span>
                    <span className="font-semibold">{Number(activeModalSlip.positionAllow).toLocaleString()} ฿</span>
                  </div>
                ) : null}
                {activeModalSlip.phoneAllow ? (
                  <div className="flex justify-between">
                    <span>ค่าโทรศัพท์:</span>
                    <span className="font-semibold">{Number(activeModalSlip.phoneAllow).toLocaleString()} ฿</span>
                  </div>
                ) : null}
                {activeModalSlip.heatAllow ? (
                  <div className="flex justify-between">
                    <span>ค่าร้อน:</span>
                    <span className="font-semibold">{Number(activeModalSlip.heatAllow).toLocaleString()} ฿</span>
                  </div>
                ) : null}
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
                  <span>รวมรับ (Gross Earning):</span>
                  <span className="text-blue-700">
                    {Number(
                      activeModalSlip.grossIncome ||
                      (activeModalSlip.baseSalary + activeModalSlip.otAmount + activeModalSlip.travelAllow + activeModalSlip.diligence)
                    ).toLocaleString()} ฿
                  </span>
                </div>
              </div>

              {/* Right: รายการหัก (Deduction) */}
              <div className="p-3 space-y-2">
                <div className="font-bold text-rose-800 pb-1.5 border-b border-slate-200 uppercase tracking-wider">
                  รายการหัก (Deduction)
                </div>
                <div className="flex justify-between">
                  <span>ประกันสังคม / Soc. Sec.:</span>
                  <span className="font-semibold text-rose-600">-{Number(activeModalSlip.socialSec).toLocaleString()} ฿</span>
                </div>
                <div className="flex justify-between">
                  <span>หักภาษี ณ ที่จ่าย / Tax:</span>
                  <span className="font-semibold text-rose-600">-{Number(activeModalSlip.tax).toLocaleString()} ฿</span>
                </div>
                <div className="flex justify-between">
                  <span>หักเงินสงเคราะห์ / Welfare:</span>
                  <span className="font-semibold text-rose-600">-{Number(activeModalSlip.welfareDeduct || 30).toLocaleString()} ฿</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
                  <span>รวมหัก (Total Deduction):</span>
                  <span className="text-rose-700">
                    -{Number(
                      activeModalSlip.totalDeduct ||
                      (activeModalSlip.socialSec + activeModalSlip.tax + (activeModalSlip.welfareDeduct || 30))
                    ).toLocaleString()} ฿
                  </span>
                </div>
              </div>
            </div>

            {/* Net Pay Bottom Bar */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-900 font-bold uppercase tracking-wider block">
                  เงินรับสุทธิ (Net Pay)
                </span>
                <span className="text-xs text-blue-600 font-medium">โอนเข้าบัญชีธนาคารพนักงาน</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-blue-700">
                  {Number(activeModalSlip.netPay).toLocaleString()} ฿
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์สลิปเงินเดือน (Print)</span>
              </button>
              <button
                onClick={() => setActiveModalSlip(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BANK PAYROLL TRANSFER EXPORT MODAL */}
      {showBankExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    ส่งออกไฟล์โอนเงินเดือนธนาคาร (Direct Credit)
                  </h3>
                  <p className="text-xs text-slate-500">สำหรับส่งระบบโอนเงินพนักงานอัตโนมัติ</p>
                </div>
              </div>
              <button
                onClick={() => setShowBankExportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  เลือกมาตรฐานรูปแบบธนาคาร:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "KBANK", name: "กสิกรไทย (KBank)", desc: "Direct Credit .txt" },
                    { id: "SCB", name: "ไทยพาณิชย์ (SCB)", desc: "Business Anywhere .txt" },
                    { id: "BBL", name: "กรุงเทพ (BBL)", desc: "Corporate iCash .txt" },
                    { id: "GENERIC_CSV", name: "PromptPay / ทุกธนาคาร", desc: "Universal CSV" },
                  ].map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setSelectedBankFormat(bank.id as any)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        selectedBankFormat === bank.id
                          ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 font-bold shadow-sm"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="font-bold">{bank.name}</div>
                      <div className="text-[10px] opacity-75">{bank.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  เลขที่บัญชีบริษัทต้นทาง (Company Account No.):
                </label>
                <input
                  type="text"
                  value={companyAccount}
                  onChange={(e) => setCompanyAccount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  วันที่ตัดยอดโอนเงิน (Transfer Effective Date):
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">จำนวนรายการที่โอน:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{filteredPayslips.length} พนักงาน</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ยอดเงินโอนสุทธิรวม:</span>
                  <span className="font-black text-blue-600 dark:text-blue-400 text-sm">
                    ฿{totalNet.toLocaleString()} บาท
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">งวดเงินเดือน:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{period}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowBankExportModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDownloadBankFile}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/30 flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดไฟล์โอนเงิน</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH PAYSLIP CARBON PRINT MODAL */}
      {showBatchPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-5xl w-full shadow-2xl my-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  แบบฟอร์มสลิปเงินเดือนคาร์บอน (Batch Slip Print Preview)
                </h3>
                <p className="text-xs text-slate-500">
                  งวดประจำเดือน {period} • แสดงทั้งหมด {filteredPayslips.length} ฉบับ
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>สั่งพิมพ์ทันที (Print All)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBatchPrintModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  ปิด
                </button>
              </div>
            </div>

            {/* List of Printable Payslips */}
            <div className="space-y-8">
              {filteredPayslips.map((slip, idx) => (
                <div
                  key={slip.id}
                  className="p-6 border-2 border-slate-300 rounded-2xl bg-white shadow-sm space-y-4 break-after-page"
                  style={{ pageBreakInside: "avoid" }}
                >
                  {/* Slip Header */}
                  <div className="flex items-center justify-between border-b border-slate-300 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-700 text-white font-black text-lg flex items-center justify-center">
                        J2K
                      </div>
                      <div>
                        <h4 className="font-black text-base text-slate-900 leading-tight">
                          บริษัท เจทูเค เฮ้าส์คีพปิ้ง เซอร์วิส จำกัด
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          ใบแจ้งยอดเงินเดือนและค่าจ้าง (Payslip) • งวด {period}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-mono font-bold text-slate-800">ลำดับที่: {idx + 1}</span>
                      <p className="text-[10px] text-slate-500">โรงงาน: {slip.employee.site?.code || "AAM"}</p>
                    </div>
                  </div>

                  {/* Employee Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px]">รหัสพนักงาน</span>
                      <strong className="font-mono text-slate-800">{slip.employee.code}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ชื่อ-นามสกุล</span>
                      <strong className="text-slate-800">
                        {slip.employee.prefix || ""} {slip.employee.firstName} {slip.employee.lastName}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ตำแหน่ง</span>
                      <strong className="text-slate-800">{slip.employee.position}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">เลขบัญชีธนาคาร</span>
                      <strong className="font-mono text-slate-800">{slip.employee.bankAccount || "-"}</strong>
                    </div>
                  </div>

                  {/* Income vs Deduction Grid */}
                  <div className="grid grid-cols-2 divide-x divide-slate-200 text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-3 space-y-1.5">
                      <div className="font-bold text-blue-800 pb-1 border-b border-slate-200 uppercase text-[11px]">
                        รายการรับ (Earnings)
                      </div>
                      <div className="flex justify-between">
                        <span>เงินเดือน / ฐานค่าจ้าง:</span>
                        <span className="font-semibold">{Number(slip.baseSalary).toLocaleString()} ฿</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ค่าล่วงเวลา (OT 1.5):</span>
                        <span className="font-semibold text-amber-700">
                          {Number(slip.ot15Amount || slip.otAmount || 0).toLocaleString()} ฿
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>ค่าเดินทาง / น้ำมัน:</span>
                        <span className="font-semibold">{Number(slip.travelAllow || 0).toLocaleString()} ฿</span>
                      </div>
                      <div className="flex justify-between">
                        <span>เบี้ยขยัน:</span>
                        <span className="font-semibold text-emerald-700">{Number(slip.diligence || 0).toLocaleString()} ฿</span>
                      </div>
                      {slip.positionAllow ? (
                        <div className="flex justify-between">
                          <span>ค่าตำแหน่ง:</span>
                          <span className="font-semibold">{Number(slip.positionAllow).toLocaleString()} ฿</span>
                        </div>
                      ) : null}
                      <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-900">
                        <span>รวมเงินรับ:</span>
                        <span className="text-blue-700">
                          {Number(
                            slip.grossIncome || (slip.baseSalary + slip.otAmount + slip.travelAllow + slip.diligence)
                          ).toLocaleString()} ฿
                        </span>
                      </div>
                    </div>

                    <div className="p-3 space-y-1.5">
                      <div className="font-bold text-rose-800 pb-1 border-b border-slate-200 uppercase text-[11px]">
                        รายการหัก (Deductions)
                      </div>
                      <div className="flex justify-between">
                        <span>ประกันสังคม 5%:</span>
                        <span className="font-semibold text-rose-600">-{Number(slip.socialSec).toLocaleString()} ฿</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ภาษีหัก ณ ที่จ่าย:</span>
                        <span className="font-semibold text-rose-600">-{Number(slip.tax).toLocaleString()} ฿</span>
                      </div>
                      <div className="flex justify-between">
                        <span>เงินสงเคราะห์:</span>
                        <span className="font-semibold text-rose-600">-{Number(slip.welfareDeduct || 30).toLocaleString()} ฿</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-900">
                        <span>รวมเงินหัก:</span>
                        <span className="text-rose-700">
                          -{Number(slip.totalDeduct || (slip.socialSec + slip.tax + (slip.welfareDeduct || 30))).toLocaleString()} ฿
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Net Pay Bar */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-blue-900 uppercase">ยอดรับสุทธิ (Net Pay)</span>
                      <p className="text-[10px] text-blue-600">รับเงินผ่านการโอนบัญชีธนาคาร</p>
                    </div>
                    <div className="text-xl font-black text-blue-700">
                      ฿{Number(slip.netPay).toLocaleString()} บาท
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
