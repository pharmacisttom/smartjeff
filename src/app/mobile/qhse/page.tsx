"use client";

import Link from "next/link";
import {
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  Camera,
  ClipboardCheck,
  Eye,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function MobileQHSEHubPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 p-4 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-3xl p-6 text-white shadow-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-white" />
            <span className="font-bold text-lg">SmartJeff QHSE</span>
          </div>
          <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">Field Safety</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight">ศูนย์ความปลอดภัยหน้างาน</h1>
        <p className="text-xs text-red-100 opacity-90 leading-relaxed">
          ความปลอดภัยของทุกคนคือสิ่งสำคัญสูงสุด ร่วมกันรายงานสภาพที่ไม่ปลอดภัย เหตุการณ์เกือบเกิดเหตุ และอุบัติการณ์ทันที
        </p>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/mobile/safety?type=INCIDENT"
          className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center hover:bg-slate-50 transition-colors"
        >
          <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 mb-2">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="font-bold text-sm text-slate-800 dark:text-slate-100">แจ้งอุบัติการณ์</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Report Incident</div>
        </Link>

        <Link
          href="/mobile/safety?type=NEAR_MISS"
          className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center hover:bg-slate-50 transition-colors"
        >
          <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="font-bold text-sm text-slate-800 dark:text-slate-100">แจ้ง Near Miss</div>
          <div className="text-[11px] text-slate-400 mt-0.5">เกือบเกิดเหตุ / เตือนภัย</div>
        </Link>

        <Link
          href="/mobile/safety?type=UNSAFE_CONDITION"
          className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center hover:bg-slate-50 transition-colors"
        >
          <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 mb-2">
            <Camera className="w-6 h-6" />
          </div>
          <div className="font-bold text-sm text-slate-800 dark:text-slate-100">ถ่ายภาพจุดอันตราย</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Safety Observation</div>
        </Link>

        <Link
          href="/mobile/inspections"
          className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center hover:bg-slate-50 transition-colors"
        >
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 mb-2">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div className="font-bold text-sm text-slate-800 dark:text-slate-100">ตรวจความปลอดภัย</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Field Inspection</div>
        </Link>
      </div>

      {/* Safety Policy Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          หลักการรายงานความปลอดภัยแบบ No-Blame
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          ระบบ SmartJeff ให้ความสำคัญกับการเรียนรู้และการป้องกันเชิงระบบ การรายงานเหตุการณ์ความปลอดภัยหรือ Near Miss จะไม่ถูกใช้เพื่อการลงโทษบุคคล และสามารถเลือกรายงานแบบไม่เปิดเผยตัวตน (Anonymous) ได้
        </p>
      </div>

      {/* Admin Link */}
      <div className="pt-2">
        <Link
          href="/admin/qhse"
          className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
        >
          <span>เข้าสู่หน้าแดชบอร์ด QHSE ผู้บริหาร</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
