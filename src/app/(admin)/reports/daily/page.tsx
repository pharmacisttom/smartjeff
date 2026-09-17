"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Calendar,
  Send,
  Users,
  Clock,
  DollarSign,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Download,
} from "lucide-react";
import { showSuccess, showError, showLoading, closeSwal } from "@/lib/swal";

export default function DailyReportHistoryPage() {
  const [report, setReport] = useState({
    reportDate: "2026-09-16",
    tenantName: "J2K Housekeeping Service",
    totalEmployees: 42,
    presentCount: 38,
    absentCount: 2,
    lateCount: 3,
    leaveCount: 2,
    otHours: 14.5,
    otCost: 2175,
    estimatedLaborCost: 19275,
    outsideGeofenceAlerts: 2,
    missingCheckoutAlerts: 1,
    aiSummaryText:
      "📊 ภาพรวมประจำวันที่ 16/09/2026: พนักงานเข้างานคิดเป็น 90% (มาสาย 3 คน, ลา 2 คน) มีชั่วโมง OT รวม 14.5 ชม. พบการเข้างานนอกรัศมี Geofence 2 รายการ ควรตรวจสอบกับหัวหน้าไซต์งานกลุ่มนิคมฯ มาบตาพุด",
  });

  const [dispatching, setDispatching] = useState(false);

  const handleManualDispatch = async () => {
    setDispatching(true);
    showLoading("กำลังส่งรายงานสรุปผล...", "กระจายข่าวสารผ่าน LINE, Telegram และ Email");

    try {
      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "LINE_NOTIFY",
          token: "MOCK_TOKEN",
        }),
      });

      closeSwal();
      await showSuccess(
        "ส่งรายงานประจำวันสำเร็จ! 🚀",
        "ระบบกระจายข้อความสรุปผลพร้อม AI Insight ผ่านทุกช่องทางที่กำหนดเรียบร้อยแล้ว"
      );
    } catch (e: any) {
      closeSwal();
      showError("เกิดข้อผิดพลาด", e.message || "ไม่สามารถส่งรายงานได้");
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <span className="text-xs font-bold text-brand-400 tracking-wider uppercase">EXECUTIVE DAILY REPORT</span>
          <h1 className="text-2xl font-black tracking-tight">รายงานสรุปผลการดำเนินงานประจำวัน</h1>
          <p className="text-xs text-slate-300">
            สรุปภาพรวมพนักงานเข้างาน, ชั่วโมง OT, ค่าใช้จ่ายประมาณการ และการเตือนผิดปกติประจำวัน
          </p>
        </div>

        <button
          onClick={handleManualDispatch}
          disabled={dispatching}
          className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-lg transition-all active:scale-95 self-start md:self-center"
        >
          <Send className="w-4 h-4 text-amber-300" />
          <span>ส่งรายงานด่วนเข้า LINE / Telegram</span>
        </button>
      </div>

      {/* AI Executive Summary Card */}
      <div className="bg-gradient-to-r from-brand-500/10 via-surface-card to-indigo-500/10 border border-brand-500/30 rounded-3xl p-6 space-y-3 shadow-sm">
        <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400 font-bold text-sm">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>AI Executive Summary & Insight</span>
        </div>
        <p className="text-sm font-medium text-content-primary leading-relaxed">
          {report.aiSummaryText}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>เข้างานวันนี้</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {report.presentCount} / {report.totalEmployees} คน
          </div>
          <p className="text-[11px] text-content-muted">อัตราการมาทำงาน {Math.round((report.presentCount / report.totalEmployees) * 100)}%</p>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>เข้างานสาย</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-600">{report.lateCount} คน</div>
          <p className="text-[11px] text-content-muted">เกินเวลาเข้างานปกติ 15 นาที</p>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>OT ชั่วโมงรวม</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-indigo-600">{report.otHours} ชม.</div>
          <p className="text-[11px] text-indigo-600 font-bold">คิดเป็นเงิน OT ฿{report.otCost.toLocaleString()}</p>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ค่าใช้จ่ายประมาณการวันนี้</span>
            <DollarSign className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">
            ฿{report.estimatedLaborCost.toLocaleString()}
          </div>
          <p className="text-[11px] text-content-muted">รวมค่าแรงรายวัน + OT</p>
        </div>
      </div>

      {/* Anomalies Alert Section */}
      <div className="bg-surface-card border border-rose-500/20 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-base font-bold text-content-primary flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>การลงเวลาผิดปกติที่ต้องตรวจสอบ (Anomalies)</span>
          </h2>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
            {report.outsideGeofenceAlerts + report.missingCheckoutAlerts} รายการ
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 space-y-1">
            <span className="font-bold text-amber-900 dark:text-amber-200 block">
              📍 ลงเวลานอกพิกัด Geofence: {report.outsideGeofenceAlerts} รายการ
            </span>
            <p className="text-amber-700 dark:text-amber-300">
              พนักงานลงชื่อเข้างานห่างจากจุดศูนย์กลางเกินรัศมี 200m (รอหัวหน้างานอนุมัติ)
            </p>
          </div>

          <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-200 space-y-1">
            <span className="font-bold text-rose-900 dark:text-rose-200 block">
              🔍 ไม่พบการเช็คเอาท์ออกงาน: {report.missingCheckoutAlerts} รายการ
            </span>
            <p className="text-rose-700 dark:text-rose-300">
              พนักงานสิ้นสุดกะเวลาแต่ไม่ได้ลงชื่อออกระบบ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
