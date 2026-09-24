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
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

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
    code: string;
    prefix?: string | null;
    firstName: string;
    lastName: string;
    position: string;
    idCardNo?: string | null;
    startDate?: string | null;
    bankAccount: string | null;
    bankName: string | null;
    site: { name: string; code: string } | null;
  };
}

export default function PayslipPage() {
  const { t, locale } = useLanguage();
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
    <div className="max-w-4xl mx-auto space-y-6 pb-20 font-sans">
      {/* Language Switcher Bar on Top of Payslip */}
      <div className="print:hidden flex items-center justify-between bg-surface-card border border-surface-border p-3 rounded-2xl shadow-sm">
        <span className="text-xs font-bold text-content-secondary flex items-center space-x-1.5">
          <span>🌐</span>
          <span>{t("common.language")}</span>
        </span>
        <LanguageSwitcher variant="pills" />
      </div>

      {/* Header Banner - Hidden in Print */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Official Payslip Portal (J2K Housekeeping)</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">{t("payslip.title")}</h1>
          <p className="text-sm text-slate-300">
            {t("payslip.subtitle")}
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
            <option value="2026-09" className="text-slate-900">2026-09</option>
            <option value="2026-08" className="text-slate-900">2026-08</option>
            <option value="2026-07" className="text-slate-900">2026-07</option>
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
            งวดเงินเดือน {selectedPeriod} ยังไม่ถูกประมวลผล กรุณาเลือกงวดเดือนอื่น หรือสอบถามฝ่าย HR
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Official J2K Payslip Voucher matching Slip sheet */}
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6 print:p-0 print:border-none print:shadow-none print:rounded-none">
            {/* Payslip Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-800 pb-5 gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 leading-tight">
                  บริษัท เจทูเค เฮ้าส์คีพปิ้ง เซอร์วิส จำกัด
                </h2>
                <p className="text-xs font-semibold text-slate-600">
                  J2K Housekeeping Service Co., Ltd.
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  235 หมู่ที่ 4 ตำบลปลวกแดง อำเภอปลวกแดง จังหวัดระยอง 21140 โทรศัพท์ 097-253-9456
                </p>
              </div>

              <div className="flex items-center space-x-2 print:hidden">
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 font-bold text-xs text-slate-700 shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-blue-600" />
                  <span>{t("payslip.print")} (A4)</span>
                </button>
              </div>
            </div>

            {/* Employee Info Header Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block font-medium">{t("payslip.period")}:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedPeriod}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">{t("login.identifier")}:</span>
                <span className="font-mono font-bold text-slate-900 text-sm bg-white px-2 py-0.5 rounded border border-slate-300">
                  {activePayslip.employee.code}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">{t("checkin.employee_name")}:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {activePayslip.employee.prefix || ""} {activePayslip.employee.firstName} {activePayslip.employee.lastName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">{t("payslip.positionAllow")}:</span>
                <span className="font-bold text-slate-900 text-sm">{activePayslip.employee.position}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">{t("checkin.site_name")}:</span>
                <span className="font-bold text-blue-700 text-sm">{activePayslip.employee.site?.name || "AAM"}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">{t("payslip.bankName")}:</span>
                <span className="text-slate-800 font-semibold">{activePayslip.employee.bankName || "ธนาคาร"}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">{t("payslip.bankAccount")}:</span>
                <span className="font-mono text-slate-800">{activePayslip.employee.bankAccount || "-"}</span>
              </div>
            </div>

            {/* Income & Deductions Breakdown (2 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden text-xs">
              {/* Income Column */}
              <div className="p-5 space-y-3 bg-emerald-50/20">
                <h3 className="text-xs font-bold text-emerald-700 flex items-center justify-between border-b border-slate-200 pb-2 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    <span>{t("payslip.grossIncome")}</span>
                  </span>
                  <span className="font-mono text-[10px]">{t("payslip.baht")} (THB)</span>
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t("payslip.baseSalary")}:</span>
                    <span className="font-semibold text-slate-900">
                      {Number(activePayslip.baseSalary).toLocaleString()} ฿
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t("payslip.ot")} ({activePayslip.otHours || 20} hrs):</span>
                    <span className="font-semibold text-amber-700">
                      {Number(activePayslip.ot15Amount || activePayslip.otAmount || 0).toLocaleString()} ฿
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t("payslip.diligence")}:</span>
                    <span className="font-semibold text-emerald-700">
                      {Number(activePayslip.diligence || 0).toLocaleString()} ฿
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t("payslip.travelAllow")}:</span>
                    <span className="font-semibold text-slate-900">
                      {Number(activePayslip.travelAllow || 0).toLocaleString()} ฿
                    </span>
                  </div>
                  {activePayslip.positionAllow ? (
                    <div className="flex justify-between">
                      <span className="text-slate-600">{t("payslip.positionAllow")}:</span>
                      <span className="font-semibold text-slate-900">
                        {Number(activePayslip.positionAllow).toLocaleString()} ฿
                      </span>
                    </div>
                  ) : null}
                  {activePayslip.heatAllow ? (
                    <div className="flex justify-between">
                      <span className="text-slate-600">{t("payslip.heatAllow")}:</span>
                      <span className="font-semibold text-slate-900">
                        {Number(activePayslip.heatAllow).toLocaleString()} ฿
                      </span>
                    </div>
                  ) : null}
                  <div className="border-t border-slate-300 pt-3 flex justify-between font-bold text-sm text-emerald-800">
                    <span>{t("payslip.grossIncome")}:</span>
                    <span>
                      {Number(
                        activePayslip.grossIncome ||
                        (activePayslip.baseSalary + activePayslip.otAmount + activePayslip.diligence + activePayslip.travelAllow)
                      ).toLocaleString()}{" "}
                      ฿
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="p-5 space-y-3 bg-rose-50/20">
                <h3 className="text-xs font-bold text-rose-700 flex items-center justify-between border-b border-slate-200 pb-2 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    <span>{t("payslip.totalDeduct")}</span>
                  </span>
                  <span className="font-mono text-[10px]">{t("payslip.baht")} (THB)</span>
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t("payslip.socialSec")}:</span>
                    <span className="font-semibold text-rose-600">
                      -{Number(activePayslip.socialSec).toLocaleString()} ฿
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t("payslip.tax")}:</span>
                    <span className="font-semibold text-rose-600">
                      -{Number(activePayslip.tax).toLocaleString()} ฿
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t("payslip.welfareDeduct")}:</span>
                    <span className="font-semibold text-rose-600">
                      -{Number(activePayslip.welfareDeduct || 30).toLocaleString()} ฿
                    </span>
                  </div>
                  <div className="border-t border-slate-300 pt-3 flex justify-between font-bold text-sm text-rose-800">
                    <span>{t("payslip.totalDeduct")}:</span>
                    <span>
                      -{Number(
                        activePayslip.totalDeduct ||
                        (activePayslip.socialSec + activePayslip.tax + (activePayslip.welfareDeduct || 30))
                      ).toLocaleString()}{" "}
                      ฿
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Pay Bottom Bar */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-md">
              <div>
                <span className="text-xs font-semibold text-blue-200 uppercase tracking-widest block">
                  {t("payslip.netPay")}
                </span>
                <span className="text-xs text-blue-100">
                  {activePayslip.employee.bankName || "ธนาคาร"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black tracking-tight">
                  {Number(activePayslip.netPay).toLocaleString()} {t("payslip.baht")}
                </span>
              </div>
            </div>

            {/* Footer note */}
            <p className="text-[11px] text-slate-400 text-center italic">
              Official J2K Housekeeping Electronic Document
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
