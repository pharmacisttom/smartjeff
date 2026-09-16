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
} from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showLoading, closeSwal, showToast } from "@/lib/swal";

interface Payslip {
  id: string;
  period: string;
  baseSalary: number;
  otHours: number;
  otAmount: number;
  travelAllow: number;
  diligence: number;
  otherIncome: number;
  tax: number;
  socialSec: number;
  otherDeduct: number;
  netPay: number;
  employee: {
    code: string;
    firstName: string;
    lastName: string;
    position: string;
    site?: { name: string };
  };
}

export default function AdminPayrollPage() {
  const [period, setPeriod] = useState<string>("2026-09");
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      showLoading("กำลังประมวลผลคำนวณเงินเดือน...", `คำนวณยอดสุทธิ ประกันสังคม ภาษี สำหรับงวด ${period}`);

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
    if (payslips.length === 0) return;

    const exportData = payslips.map((p, idx) => ({
      ลำดับ: idx + 1,
      รหัสพนักงาน: p.employee.code,
      ชื่อพนักงาน: `${p.employee.firstName} ${p.employee.lastName}`,
      ตำแหน่ง: p.employee.position,
      ไซต์งาน: p.employee.site?.name || "สำนักงานใหญ่",
      เงินเดือนพื้นฐาน: Number(p.baseSalary),
      ชั่วโมงOT: p.otHours,
      เงินOT: Number(p.otAmount),
      เบี้ยขยัน: Number(p.diligence),
      ค่าเดินทาง: Number(p.travelAllow),
      หักประกันสังคม: Number(p.socialSec),
      หักภาษี: Number(p.tax),
      ยอดสุทธิ: Number(p.netPay),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Payroll_${period}`);
    XLSX.writeFile(workbook, `SMARTO_Payroll_${period}.xlsx`);

    showToast("ส่งออกไฟล์ Excel เรียบร้อยแล้ว", "success");
  };

  // Calculate Totals
  const totalBase = payslips.reduce((acc, curr) => acc + Number(curr.baseSalary), 0);
  const totalOT = payslips.reduce((acc, curr) => acc + Number(curr.otAmount), 0);
  const totalNet = payslips.reduce((acc, curr) => acc + Number(curr.netPay), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-brand-300 text-xs font-semibold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Payroll Engine Console</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">ศูนย์คำนวณเงินเดือนพนักงาน</h1>
          <p className="text-sm text-slate-300">
            คำนวณเงินเดือนอัตโนมัติตามสถิติการลงเวลา ค่า OT เบี้ยขยัน และส่งออกรายงาน Excel
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunPayroll}
            disabled={calculating}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <Calculator className="w-4 h-4" />
            <span>{calculating ? "กำลังคำนวณ..." : "ประมวลผลเงินเดือนงวดนี้"}</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between">
          <span className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
            {message}
          </span>
          <button onClick={() => setMessage(null)} className="text-emerald-700 font-bold">ปิด</button>
        </div>
      )}

      {/* Control Bar & Summary Cards */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-card border border-surface-border p-4 rounded-3xl shadow-sm">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-brand-600 ml-2" />
          <span className="text-xs font-bold text-content-secondary">งวดคำนวณเงินเดือน:</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary font-bold text-sm outline-none"
          >
            <option value="2026-09">กันยายน 2026 (2026-09)</option>
            <option value="2026-08">สิงหาคม 2026 (2026-08)</option>
            <option value="2026-07">กรกฎาคม 2026 (2026-07)</option>
          </select>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={payslips.length === 0}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-surface-border bg-surface-bg hover:bg-surface-subtle text-content-primary font-bold text-xs transition-all disabled:opacity-40"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>ส่งออกรายงาน Excel</span>
        </button>
      </div>

      {/* KPI Metric Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-content-muted">ยอดจ่ายสุทธิรวม (Total Net Payment)</span>
          <p className="text-2xl font-black text-brand-600">{totalNet.toLocaleString()} ฿</p>
          <span className="text-[11px] text-content-muted">จำนวน {payslips.length} รายการ</span>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-content-muted">รวมฐานเงินเดือน (Total Base Salary)</span>
          <p className="text-2xl font-black text-content-primary">{totalBase.toLocaleString()} ฿</p>
          <span className="text-[11px] text-content-muted">เงินเดือนตั้งต้นก่อนบวก/หัก</span>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-content-muted">รวมเงินค่า OT (Total Overtime)</span>
          <p className="text-2xl font-black text-amber-600">{totalOT.toLocaleString()} ฿</p>
          <span className="text-[11px] text-content-muted">คำนวณจากชั่วโมง OT สะสม</span>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-content-muted animate-pulse">
            กำลังโหลดข้อมูลสลิปเงินเดือนงวด {period}...
          </div>
        ) : payslips.length === 0 ? (
          <div className="py-16 text-center text-content-muted space-y-2">
            <Calculator className="w-12 h-12 mx-auto text-content-muted/40" />
            <p className="font-bold text-sm text-content-primary">ยังไม่มีการประมวลผลเงินเดือนงวดนี้</p>
            <p className="text-xs">กดปุ่ม "ประมวลผลเงินเดือนงวดนี้" ด้านบนเพื่อคำนวณยอดเงินสดของพนักงานทุกคน</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-xs text-content-muted font-bold uppercase bg-surface-subtle">
                  <th className="py-3.5 px-4">ชื่อพนักงาน</th>
                  <th className="py-3.5 px-4">ตำแหน่ง/ไซต์</th>
                  <th className="py-3.5 px-4 text-right">เงินเดือนฐาน</th>
                  <th className="py-3.5 px-4 text-right">ค่า OT</th>
                  <th className="py-3.5 px-4 text-right">เบี้ยขยัน</th>
                  <th className="py-3.5 px-4 text-right">หักประกันสังคม</th>
                  <th className="py-3.5 px-4 text-right">ยอดรับสุทธิ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs">
                {payslips.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-content-primary">
                        {p.employee.firstName} {p.employee.lastName}
                      </div>
                      <span className="text-[11px] text-content-muted font-mono">{p.employee.code}</span>
                    </td>
                    <td className="py-3.5 px-4 text-content-secondary">
                      <div>{p.employee.position}</div>
                      <span className="text-[10px] text-content-muted">{p.employee.site?.name || "สำนักงานใหญ่"}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-content-primary">
                      {Number(p.baseSalary).toLocaleString()} ฿
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-amber-600">
                      +{Number(p.otAmount).toLocaleString()} ฿
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                      +{Number(p.diligence).toLocaleString()} ฿
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-rose-600">
                      -{Number(p.socialSec).toLocaleString()} ฿
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-black text-brand-600 text-sm">
                        {Number(p.netPay).toLocaleString()} ฿
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
