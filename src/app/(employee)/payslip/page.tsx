"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  Calendar,
  Building,
  User,
  CreditCard,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    bankAccount: string | null;
    bankName: string | null;
    site: { name: string } | null;
  };
}

export default function PayslipPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("2026-09");
  const [activePayslip, setActivePayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPayslips = async (periodStr: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/payroll?period=${periodStr}`);
      const data = await res.json();
      if (res.ok) {
        setPayslips(data.payslips || []);
        if (data.payslips && data.payslips.length > 0) {
          setActivePayslip(data.payslips[0]);
        } else {
          setActivePayslip(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips(selectedPeriod);
  }, [selectedPeriod]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-800 via-slate-900 to-brand-900 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-brand-300 text-xs font-semibold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure Payslip Portal</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">สลิปเงินเดือน (Payslip)</h1>
          <p className="text-sm text-slate-300">
            ตรวจสอบรายละเอียดเงินเดือน ค่าล่วงเวลา (OT) เบี้ยขยัน และรายการหักภาษี/ประกันสังคม
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10">
          <Calendar className="w-4 h-4 text-brand-300 ml-2" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-transparent text-white font-bold text-sm outline-none px-2 py-1 cursor-pointer"
          >
            <option value="2026-09" className="text-slate-900">กันยายน 2026</option>
            <option value="2026-08" className="text-slate-900">สิงหาคม 2026</option>
            <option value="2026-07" className="text-slate-900">กรกฎาคม 2026</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-content-muted animate-pulse">
          กำลังโหลดข้อมูลสลิปเงินเดือน...
        </div>
      ) : !activePayslip ? (
        <div className="bg-surface-card border border-surface-border rounded-3xl p-12 text-center space-y-3">
          <FileText className="w-12 h-12 mx-auto text-content-muted/50" />
          <h3 className="text-lg font-bold text-content-primary">ไม่พบสลิปเงินเดือนในงวดนี้</h3>
          <p className="text-sm text-content-muted max-w-sm mx-auto">
            งวดเงินเดือน {selectedPeriod} ยังไม่ถูกประมวลผลหรือออกสลิป กรุณาเลือกงวดเดือนอื่น หรือสอบถามฝ่าย HR
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Printable Payslip Voucher */}
          <div className="bg-surface-card border border-surface-border rounded-3xl p-6 sm:p-8 shadow-lg space-y-6 print:p-0 print:border-none print:shadow-none">
            {/* Payslip Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-surface-border pb-6 gap-4">
              <div>
                <span className="text-xs font-bold text-brand-600 tracking-wider uppercase">J2K HOUSEKEEPING CO., LTD.</span>
                <h2 className="text-xl font-black text-content-primary">ใบแจ้งยอดเงินเดือน (PAYSLIP)</h2>
                <p className="text-xs text-content-muted">งวดประจำเดือน: {selectedPeriod}</p>
              </div>

              <div className="flex items-center space-x-2 print:hidden">
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-surface-border bg-surface-bg hover:bg-surface-subtle font-bold text-xs text-content-primary shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4 text-brand-600" />
                  <span>พิมพ์สลิป</span>
                </button>
              </div>
            </div>

            {/* Employee Info Header Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface-subtle p-4 rounded-2xl border border-surface-border/50 text-xs">
              <div>
                <span className="text-content-muted block font-medium">รหัสพนักงาน:</span>
                <span className="font-bold text-content-primary text-sm">{activePayslip.employee.code}</span>
              </div>
              <div>
                <span className="text-content-muted block font-medium">ชื่อ-นามสกุล:</span>
                <span className="font-bold text-content-primary text-sm">
                  {activePayslip.employee.firstName} {activePayslip.employee.lastName}
                </span>
              </div>
              <div>
                <span className="text-content-muted block font-medium">ตำแหน่ง:</span>
                <span className="font-bold text-content-primary text-sm">{activePayslip.employee.position}</span>
              </div>
              <div>
                <span className="text-content-muted block font-medium">สังกัดไซต์งาน:</span>
                <span className="font-bold text-content-primary text-sm">
                  {activePayslip.employee.site?.name || "สำนักงานใหญ่"}
                </span>
              </div>
            </div>

            {/* Income & Deductions Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Income Column */}
              <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-emerald-600 flex items-center space-x-2 border-b border-emerald-500/10 pb-2">
                  <DollarSign className="w-4 h-4" />
                  <span>รายได้ (EARNINGS)</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-content-secondary">เงินเดือนพื้นฐาน (Base Salary)</span>
                    <span className="font-bold text-content-primary">
                      {Number(activePayslip.baseSalary).toLocaleString()} บาท
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-secondary">ค่าล่วงเวลา ({activePayslip.otHours} ชม.)</span>
                    <span className="font-bold text-content-primary">
                      {Number(activePayslip.otAmount).toLocaleString()} บาท
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-secondary">เบี้ยขยัน (Diligence Allowance)</span>
                    <span className="font-bold text-content-primary">
                      {Number(activePayslip.diligence).toLocaleString()} บาท
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-secondary">ค่าเดินทาง (Travel Allowance)</span>
                    <span className="font-bold text-content-primary">
                      {Number(activePayslip.travelAllow).toLocaleString()} บาท
                    </span>
                  </div>
                  <div className="border-t border-emerald-500/20 pt-2 flex justify-between font-bold text-sm text-emerald-700 dark:text-emerald-400">
                    <span>รวมรายได้ทั้งหมด</span>
                    <span>
                      {(
                        Number(activePayslip.baseSalary) +
                        Number(activePayslip.otAmount) +
                        Number(activePayslip.diligence) +
                        Number(activePayslip.travelAllow)
                      ).toLocaleString()}{" "}
                      บาท
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-rose-600 flex items-center space-x-2 border-b border-rose-500/10 pb-2">
                  <CreditCard className="w-4 h-4" />
                  <span>รายการหัก (DEDUCTIONS)</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-content-secondary">หัก ประกันสังคม (Social Security)</span>
                    <span className="font-bold text-content-primary">
                      {Number(activePayslip.socialSec).toLocaleString()} บาท
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-secondary">หัก ภาษี ณ ที่จ่าย (Withholding Tax)</span>
                    <span className="font-bold text-content-primary">
                      {Number(activePayslip.tax).toLocaleString()} บาท
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-secondary">รายการหักอื่นๆ</span>
                    <span className="font-bold text-content-primary">
                      {Number(activePayslip.otherDeduct).toLocaleString()} บาท
                    </span>
                  </div>
                  <div className="border-t border-rose-500/20 pt-2 flex justify-between font-bold text-sm text-rose-700 dark:text-rose-400">
                    <span>รวมรายการหักทั้งหมด</span>
                    <span>
                      {(
                        Number(activePayslip.socialSec) +
                        Number(activePayslip.tax) +
                        Number(activePayslip.otherDeduct)
                      ).toLocaleString()}{" "}
                      บาท
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Net Pay Banner */}
            <div className="bg-gradient-to-r from-brand-600 to-indigo-700 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-brand-200 uppercase tracking-wider">
                  NET PAYMENT (ยอดโอนเข้าบัญชีสุทธิ)
                </span>
                <p className="text-xs text-brand-100">
                  โอนเข้าบัญชี: {activePayslip.employee.bankName || "ธนาคารกสิกรไทย"}{" "}
                  {activePayslip.employee.bankAccount || "xxx-x-x1234-x"}
                </p>
              </div>

              <div className="text-right">
                <span className="text-3xl font-black tracking-tight">
                  {Number(activePayslip.netPay).toLocaleString()} ฿
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
