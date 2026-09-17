"use client";

import { useState } from "react";
import {
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Search,
  Check,
  FileCheck,
  MapPin,
  Clock,
} from "lucide-react";
import { showSuccess, showError, showLoading, closeSwal } from "@/lib/swal";
import { verifyTravelExpenseClaim } from "@/lib/expenses/verify";

export default function AdminExpenseAuditPage() {
  const [claims, setClaims] = useState([
    {
      id: "TE-2026-0041",
      employeeName: "สมศรี สุขใจ",
      siteName: "โรงงาน AAM นิคมฯ มาบตาพุด",
      date: "16/09/2026",
      claimedKm: 12.5,
      actualGpsKm: 12.4,
      amount: 62.5,
      matchScore: 1.0,
      hasAnomalies: false,
      anomalies: [],
      status: "SUBMITTED",
    },
    {
      id: "TE-2026-0042",
      employeeName: "พัดมา วงค์คำ",
      siteName: "โรงงานอมตะซิตี้ ระยอง",
      date: "15/09/2026",
      claimedKm: 18.5,
      actualGpsKm: 12.4,
      amount: 92.5,
      matchScore: 0.65,
      hasAnomalies: true,
      anomalies: [
        {
          type: "DISTANCE_MISMATCH",
          message: "ระยะทางขอเบิก (18.5 กม.) แตกต่างจากระยะทาง GPS ล็อกอินจริง (12.4 กม.) เกิน 30%",
        },
      ],
      status: "SUBMITTED",
    },
    {
      id: "TE-2026-0043",
      employeeName: "สร้อยทอง ดีมาก",
      siteName: "โรงงานอมตะซิตี้ ระยอง",
      date: "14/09/2026",
      claimedKm: 14.2,
      actualGpsKm: 14.1,
      amount: 71.0,
      matchScore: 0.85,
      hasAnomalies: true,
      anomalies: [
        {
          type: "ENDPOINT_MISMATCH",
          message: "จุดปลายทางในแผนต่างจากตำแหน่งสแกนเข้างานจริง 540 เมตร",
        },
      ],
      status: "SUBMITTED",
    },
  ]);

  const handleApprove = (id: string, name: string, amount: number) => {
    setClaims(
      claims.map((c) => (c.id === id ? { ...c, status: "APPROVED" } : c))
    );
    showSuccess("อนุมัติค่าเดินทางสำเร็จ! ✅", `อนุมัติจ่ายค่าเดินทางจำนวน ฿${amount} ให้ ${name} เรียบร้อยแล้ว`);
  };

  const handleReject = (id: string, name: string) => {
    setClaims(
      claims.map((c) => (c.id === id ? { ...c, status: "REJECTED" } : c))
    );
    showSuccess("ปฏิเสธรายการแล้ว", `ปฏิเสธการขอเบิกค่าเดินทางของ ${name} เรียบร้อยแล้ว`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 p-6 rounded-3xl text-white shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-brand-400 tracking-wider uppercase">TRAVEL EXPENSE AUDIT</span>
            <h1 className="text-2xl font-black tracking-tight">ตรวจสอบและอนุมัติค่าเดินทาง (GPS Audit Console)</h1>
            <p className="text-xs text-slate-300">
              เปรียบเทียบระยะทางขอเบิกกับประวัติ GPS เช็คอินจริง ป้องกันการเบิกเกินจริงหรือซ้ำซ้อน
            </p>
          </div>
        </div>
      </div>

      {/* Claims List Table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <h2 className="text-base font-bold text-content-primary">รายการขอเบิกค่าเดินทางรอตรวจสอบ</h2>
          <span className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
            {claims.filter((c) => c.status === "SUBMITTED").length} รายการรออนุมัติ
          </span>
        </div>

        <div className="space-y-4">
          {claims.map((c) => (
            <div
              key={c.id}
              className={`bg-surface-subtle border rounded-3xl p-5 space-y-3 transition-all ${
                c.hasAnomalies ? "border-amber-500/40 bg-amber-500/5" : "border-surface-border"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border/60 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                      {c.id}
                    </span>
                    <h3 className="font-bold text-content-primary text-sm">{c.employeeName}</h3>
                    <span className="text-xs text-content-muted">({c.siteName})</span>
                  </div>
                  <p className="text-xs text-content-muted">วันที่เดินทาง: {c.date}</p>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      c.matchScore >= 0.9
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : "bg-amber-50 text-amber-600 border-amber-200"
                    }`}
                  >
                    GPS Match Score: {Math.round(c.matchScore * 100)}%
                  </span>

                  <span className="text-base font-black text-emerald-600">฿{c.amount}</span>
                </div>
              </div>

              {/* Distances comparison */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-surface-card p-2.5 rounded-xl border border-surface-border">
                  <span className="text-content-muted block text-[11px]">ระยะทางขอเบิก:</span>
                  <strong className="text-content-primary font-bold">{c.claimedKm} กม.</strong>
                </div>

                <div className="bg-surface-card p-2.5 rounded-xl border border-surface-border">
                  <span className="text-content-muted block text-[11px]">ระยะทาง GPS จริง:</span>
                  <strong className="text-emerald-600 font-bold">{c.actualGpsKm} กม.</strong>
                </div>

                <div className="bg-surface-card p-2.5 rounded-xl border border-surface-border col-span-2 sm:col-span-1">
                  <span className="text-content-muted block text-[11px]">ผลการตรวจสอบ:</span>
                  <strong className={c.hasAnomalies ? "text-amber-600" : "text-emerald-600"}>
                    {c.hasAnomalies ? "พบข้อสงสัย" : "ตรงกับ GPS ปกติ"}
                  </strong>
                </div>
              </div>

              {/* Anomalies Box if present */}
              {c.hasAnomalies && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 p-3 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>คำเตือนการตรวจสอบ GPS:</span>
                  </div>
                  {c.anomalies.map((a: any, idx) => (
                    <p key={idx} className="text-amber-700 dark:text-amber-300 text-[11px] pl-5">
                      • {a.message}
                    </p>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-1">
                {c.status === "SUBMITTED" ? (
                  <>
                    <button
                      onClick={() => handleReject(c.id, c.employeeName)}
                      className="flex items-center space-x-1 px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all active:scale-95"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>ปฏิเสธ</span>
                    </button>

                    <button
                      onClick={() => handleApprove(c.id, c.employeeName, c.amount)}
                      className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-all active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>อนุมัติจ่ายค่าเดินทาง</span>
                    </button>
                  </>
                ) : (
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      c.status === "APPROVED" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {c.status === "APPROVED" ? "อนุมัติเรียบร้อยแล้ว ✅" : "ปฏิเสธแล้ว ❌"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
