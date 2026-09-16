"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  MapPin,
  ArrowUpRight,
  ShieldAlert,
  FileCheck,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalEmployees: 42,
    checkedInToday: 38,
    lateCount: 3,
    pendingApprovals: 4,
  });

  const [sitesSummary, setSitesSummary] = useState([
    { id: "1", name: "โรงงาน AAM นิคมฯ มาบตาพุด", total: 18, checked: 17, lat: 12.68, lng: 101.17 },
    { id: "2", name: "โรงงานอมตะซิตี้ ระยอง", total: 14, checked: 13, lat: 12.98, lng: 101.10 },
    { id: "3", name: "สำนักงานใหญ่ ชลบุรี", total: 10, checked: 8, lat: 13.36, lng: 100.98 },
  ]);

  const [recentLogs, setRecentLogs] = useState([
    { id: "1", name: "สมชาย เข็มกลัด", site: "มาบตาพุด", time: "07:55 น.", type: "CHECK_IN", status: "WITHIN", approved: true },
    { id: "2", name: "พัดมา วงค์คำ", site: "อมตะซิตี้", time: "08:02 น.", type: "CHECK_IN", status: "OUTSIDE", approved: false },
    { id: "3", name: "วิชัย ใจดี", site: "สำนักงานใหญ่", time: "07:48 น.", type: "CHECK_IN", status: "WITHIN", approved: true },
    { id: "4", name: "นารี รุ่งเรือง", site: "มาบตาพุด", time: "08:15 น.", type: "CHECK_IN", status: "WITHIN", approved: true },
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Executive Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <span className="text-xs font-bold text-brand-400 tracking-wider uppercase">J2K HOUSEKEEPING MANAGEMENT</span>
          <h1 className="text-2xl font-black tracking-tight">แดชบอร์ดสรุปภาพรวมผู้บริหาร</h1>
          <p className="text-sm text-slate-300">
            ติดตามสถานะการปฏิบัติงาน การเข้างานแบบเรียลไทม์ และอนุมัติเวลานอก Geofence
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/attendance"
            className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm px-4 py-2.5 rounded-2xl shadow-md transition-all"
          >
            <FileCheck className="w-4 h-4" />
            <span>อนุมัติเวลา ({stats.pendingApprovals})</span>
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            title: "พนักงานทั้งหมด",
            value: stats.totalEmployees,
            unit: "คน",
            icon: Users,
            color: "text-blue-600 bg-blue-500/10 border-blue-500/20",
          },
          {
            title: "เข้างานวันนี้",
            value: stats.checkedInToday,
            unit: "คน (90%)",
            icon: CheckCircle2,
            color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
          },
          {
            title: "เข้างานสาย",
            value: stats.lateCount,
            unit: "คน",
            icon: Clock,
            color: "text-amber-600 bg-amber-500/10 border-amber-500/20",
          },
          {
            title: "รอยืนยัน Geofence",
            value: stats.pendingApprovals,
            unit: "รายการ",
            icon: ShieldAlert,
            color: "text-rose-600 bg-rose-500/10 border-rose-500/20",
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-3 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-content-muted">{kpi.title}</span>
                <div className={cn("p-2 rounded-xl border", kpi.color)}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-black text-content-primary">{kpi.value}</span>
                <span className="text-xs font-medium text-content-muted ml-2">{kpi.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Site Attendance Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sitesSummary.map((site) => {
          const percent = Math.round((site.checked / site.total) * 100);
          return (
            <div
              key={site.id}
              className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-brand-600">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Geofence Radius 200m</span>
                  </div>
                  <h3 className="font-bold text-content-primary text-sm line-clamp-1">{site.name}</h3>
                </div>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  {percent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-content-muted">
                  <span>เข้างานแล้ว {site.checked} คน</span>
                  <span>ทั้งหมด {site.total} คน</span>
                </div>
                <div className="w-full h-2.5 bg-surface-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Attendance Logs */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-content-primary">รายการลงเวลาล่าสุดวันนี้</h2>
            <p className="text-xs text-content-muted">อัปเดตแบบ Realtime พร้อมผลตรวจสอบพิกัด GPS</p>
          </div>
          <Link
            href="/admin/attendance"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
          >
            <span>ดูทั้งหมด</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-border text-xs text-content-muted font-bold uppercase">
                <th className="py-3 px-4">ชื่อพนักงาน</th>
                <th className="py-3 px-4">ไซต์งาน</th>
                <th className="py-3 px-4">เวลาลงชื่อ</th>
                <th className="py-3 px-4">สถานะ Geofence</th>
                <th className="py-3 px-4 text-right">การอนุมัติ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-xs">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-subtle transition-colors">
                  <td className="py-3.5 px-4 font-bold text-content-primary">{log.name}</td>
                  <td className="py-3.5 px-4 text-content-secondary">{log.site}</td>
                  <td className="py-3.5 px-4 font-semibold text-content-primary">{log.time}</td>
                  <td className="py-3.5 px-4">
                    {log.status === "WITHIN" ? (
                      <span className="inline-flex items-center space-x-1 text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>อยู่ในพื้นที่</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>นอกพื้นที่ (+140m)</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {log.approved ? (
                      <span className="text-xs font-bold text-emerald-600">อนุมัติแล้ว</span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                        รอ HR ตรวจสอบ
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* IP Access Audit Logs */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-content-primary flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-brand-600" />
              <span>ประวัติการเข้าใช้งานระบบ & บันทึก IP Address (Audit Log)</span>
            </h2>
            <p className="text-xs text-content-muted">บันทึก IP Address, Browser User-Agent และเวลาทุกครั้งที่มีการเข้าใช้งานหรือลงเวลา</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-border text-xs text-content-muted font-bold uppercase bg-surface-subtle">
                <th className="py-3 px-4">เวลาปฏิบัติการ</th>
                <th className="py-3 px-4">กิจกรรม (Action)</th>
                <th className="py-3 px-4">ผู้ใช้งาน / บทบาท</th>
                <th className="py-3 px-4">หมายเลข IP Address</th>
                <th className="py-3 px-4 text-right">อุปกรณ์ (User-Agent)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-xs font-mono">
              {[
                { time: "16/09/2026 10:18:42", action: "LOGIN", user: "ผู้ดูแลระบบ (Admin)", ip: "127.0.0.1", agent: "Chrome / Windows 11" },
                { time: "16/09/2026 07:45:12", action: "CHECK_IN", user: "EMP003 - พัดมา วงค์คำ", ip: "182.52.231.14", agent: "Mobile Safari PWA" },
                { time: "16/09/2026 07:42:05", action: "LOGIN", user: "EMP003 - พัดมา วงค์คำ", ip: "182.52.231.14", agent: "Mobile Safari PWA" },
                { time: "16/09/2026 07:40:00", action: "CHECK_IN", user: "EMP001 - สมศรี สุขใจ", ip: "171.96.182.90", agent: "Chrome Mobile" },
              ].map((log, idx) => (
                <tr key={idx} className="hover:bg-surface-subtle transition-colors">
                  <td className="py-3 px-4 font-bold text-content-primary">{log.time}</td>
                  <td className="py-3 px-4">
                    <span className="bg-brand-50 text-brand-700 dark:bg-brand-950/40 px-2 py-0.5 rounded font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans font-semibold text-content-secondary">{log.user}</td>
                  <td className="py-3 px-4 font-bold text-emerald-600">{log.ip}</td>
                  <td className="py-3 px-4 text-right text-content-muted text-[11px] truncate max-w-[200px]">
                    {log.agent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
