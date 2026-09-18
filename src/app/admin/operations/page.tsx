"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Users,
  Clock,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Navigation,
  CheckCircle2,
  Home,
} from "lucide-react";
import { LiveEmployeeMap } from "@/components/map/LiveEmployeeMap";
import { RoutePlayback } from "@/components/map/RoutePlayback";

export default function OperationsOverviewPage() {
  const [siteCoverage, setSiteCoverage] = useState([
    { id: "1", name: "โรงงาน AAM นิคมฯ มาบตาพุด", required: 8, current: 6, percent: 75 },
    { id: "2", name: "โรงงานอมตะซิตี้ ระยอง", required: 7, current: 7, percent: 100 },
    { id: "3", name: "สำนักงานใหญ่ ชลบุรี", required: 6, current: 5, percent: 83 },
    { id: "4", name: "ปลวกแดง โลจิสติกส์ Hub", required: 4, current: 3, percent: 75 },
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <span className="text-xs font-bold text-brand-400 tracking-wider uppercase">OPERATIONS CONTROL CENTER</span>
          <h1 className="text-2xl font-black tracking-tight">ศูนย์ควบคุมการปฏิบัติงานและเส้นทางเดินทาง</h1>
          <p className="text-xs text-slate-300">
            ติดตามตำแหน่งพนักงานเรียลไทม์ วางแผนกำลังคนรายไซต์งาน และตรวจสอบค่าเดินทาง (GPS Audit)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/admin/dashboard"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 shadow-sm transition-all active:scale-95"
            title="กลับไปยังหน้าแรกแดชบอร์ด"
          >
            <Home className="w-4 h-4 text-brand-400" />
            <span>กลับหน้าแรก</span>
          </Link>

          <Link
            href="/operations/planning"
            className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>จัดสรรกำลังคนอัตโนมัติ (Auto-Assign)</span>
          </Link>
        </div>
      </div>

      {/* Operations KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>พนักงานปฏิบัติงาน</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">40 คน</div>
          <p className="text-[11px] text-emerald-600 font-bold">กำลังทำงาน 35 คน (87.5%)</p>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>เข้างานสาย</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-600">3 คน</div>
          <p className="text-[11px] text-content-muted">สายเกิน 15 นาที</p>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ค่าเดินทางวันนี้รวม</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">฿1,240</div>
          <p className="text-[11px] text-content-muted">เฉลี่ย ฿31/คน/วัน (อัตรา ฿5/กม.)</p>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>แจ้งเตือนผิดปกติ</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-600">3 รายการ</div>
          <p className="text-[11px] text-rose-600 font-bold">ระยะเบิกไม่ตรง GPS จริง</p>
        </div>
      </div>

      {/* Main 2 Column Grid: Live Map & Site Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Live Employee Map (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <LiveEmployeeMap />
          <RoutePlayback />
        </div>

        {/* Right: Site Coverage & Expenses Audit (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Site Coverage Breakdown */}
          <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-bold text-content-primary text-base">ความเพียงพอของกำลังคน (Site Coverage)</h3>
              <Link href="/operations/planning" className="text-xs font-bold text-brand-600 flex items-center">
                <span>จัดแผน</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {siteCoverage.map((site) => (
                <div key={site.id} className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-content-primary">{site.name}</span>
                    <span className={site.percent === 100 ? "text-emerald-600" : "text-amber-600"}>
                      {site.current} / {site.required} คน ({site.percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-subtle rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        site.percent === 100 ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${site.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Anomalies & Travel Expense Audit Widget */}
          <div className="bg-surface-card border border-rose-500/30 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center space-x-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>ผลตรวจค่าเดินทางผิดปกติ (GPS Audit)</span>
              </div>
              <Link href="/admin/expenses" className="text-xs font-bold text-rose-600 flex items-center">
                <span>ตรวจทั้งหมด</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 p-3 rounded-2xl space-y-1">
                <div className="flex items-center justify-between font-bold text-rose-900 dark:text-rose-200">
                  <span>พัดมา วงค์คำ (อมตะซิตี้)</span>
                  <span className="text-rose-600">ต่างกัน 32%</span>
                </div>
                <p className="text-[11px] text-rose-700 dark:text-rose-300">
                  ขอเบิก 18.5 กม. แต่พิกัด GPS คำนวณได้เพียง 12.4 กม.
                </p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 p-3 rounded-2xl space-y-1">
                <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                  <span>สร้อยทอง ดีมาก (อมตะซิตี้)</span>
                  <span className="text-amber-600">ต่างกัน 540m</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  จุดปลายทางตามแผนต่างจากพิกัดสแกนเข้างานจริง
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
