"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  Send,
  Home,
  BarChart3,
  DollarSign,
  MapPin,
  Sparkles,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/lib/swal";

interface Report {
  reportDate: string;
  tenantName: string;
  totalEmployees: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
  otHours: number;
  otCost: number;
  estimatedLaborCost: number;
  outsideGeofenceAlerts: number;
  missingCheckoutAlerts: number;
  aiSummaryText?: string;
}

export default function AdminReportsPage() {
  const [date, setDate] = useState(() =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date())
  );
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/reports/daily?date=${date}`, { cache: "no-store" });
      const body = await response.json();
      if (response.ok) {
        setReport(body);
      } else {
        showError("โหลดรายงานไม่สำเร็จ", body.error || "เกิดข้อผิดพลาด");
      }
    } catch (err: any) {
      showError("ข้อผิดพลาด", err.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSendReport = async () => {
    try {
      setSending(true);
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "LINE_NOTIFY" }),
      });
      const body = await response.json();
      if (response.ok && body.success) {
        showSuccess("ส่งสำเร็จ", body.message || "ส่งรายงานสรุปทาง LINE เรียบร้อยแล้ว");
      } else {
        showError("ส่งไม่สำเร็จ", body.message || "ไม่สามารถส่งรายงานได้");
      }
    } catch (err: any) {
      showError("เกิดข้อผิดพลาด", err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Executive Analytics & Intelligence</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">รายงานและสถิติผู้บริหาร (Executive Reports)</h1>
          <p className="text-xs text-slate-400 mt-1">
            สรุปข้อมูลสถิติการปฏิบัติงาน กำลังคน ต้นทุนค่าแรง และสัญญาณแจ้งเตือนอัตโนมัติประจำวัน
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/dashboard"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 shadow-sm transition-all active:scale-95"
            title="กลับไปยังหน้าแรกแดชบอร์ด"
          >
            <Home className="w-4 h-4 text-brand-400" />
            <span>กลับหน้าแรก</span>
          </Link>

          <button
            onClick={handleSendReport}
            disabled={sending}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? "กำลังส่ง..." : "ส่งรายงาน LINE"}</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">เลือกวันที่รายงาน:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={load}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>

        {report && (
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            หน่วยงาน: <span className="font-bold text-slate-900 dark:text-white">{report.tenantName}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 dark:text-slate-500 animate-pulse">
          กำลังคำนวณและสร้างรายงานประจำวันจากข้อมูลจริงในระบบ...
        </div>
      ) : !report ? (
        <div className="p-8 text-center text-xs text-slate-500">ไม่พบข้อมูลรายงานในวันที่เลือก</div>
      ) : (
        <>
          {/* Main KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold">พนักงานทั้งหมด</span>
                <Users className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {report.totalEmployees}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">คนในสังกัด</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold">เข้างานวันนี้</span>
                <Clock className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {report.presentCount}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                คิดเป็น {report.totalEmployees > 0 ? Math.round((report.presentCount / report.totalEmployees) * 100) : 0}% ของทั้งหมด
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold">ขาดงาน / ยังไม่เข้า</span>
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
                {report.absentCount}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">คน</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold">ลางาน / ลาพักร้อน</span>
                <Calendar className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {report.leaveCount}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">ได้รับอนุมัติแล้ว</span>
            </div>
          </div>

          {/* Cost & Geofence Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alerts & Compliance */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />
                การปฏิบัติตามกฎและพิกัดงาน (Compliance & Geofence)
              </h2>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-300">สแกนอยู่นอกพื้นที่พิกัด (Outside Geofence)</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{report.outsideGeofenceAlerts} รายการ</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-300">ยังไม่ลงเวลาออก (Missing Checkout)</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{report.missingCheckoutAlerts} คน</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-300">เข้างานสายเกินกำหนด (Late Count)</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{report.lateCount} คน</span>
                </div>
              </div>
            </div>

            {/* Financial & Wage Estimates */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <DollarSign className="w-4 h-4 text-emerald-500 mr-2" />
                ประมาณการต้นทุนค่าแรงประจำวัน (Labor Cost)
              </h2>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-300">ประมาณการค่าแรงพื้นฐาน</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ฿{report.estimatedLaborCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-300">
                    ชั่วโมง OT รวม ({report.otHours} ชม.)
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                    ฿{report.otCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200">รวมค่าแรงและ OT โดยประมาณ</span>
                  <span className="font-black text-emerald-700 dark:text-emerald-300 text-base">
                    ฿{(report.estimatedLaborCost + report.otCost).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Executive Summary Card */}
          {report.aiSummaryText && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <Sparkles className="w-4 h-4 text-brand-500 mr-2" />
                บทสรุปผู้บริหารอัตโนมัติ (AI Executive Summary)
              </h2>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {report.aiSummaryText}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
