"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Clock,
  AlertTriangle,
  UserMinus,
  MapPin,
  RefreshCw,
  Shield,
  Layers,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  reportDate: string;
  tenantName: string;
  totalEmployees: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
  outsideGeofenceAlerts: number;
  missingCheckoutAlerts: number;
  estimatedLaborCost: number;
  security?: {
    totalUsers: number;
    totalRoles: number;
    activeSessions: number;
    mfaCoveragePercent: number;
    pendingReviews: number;
  };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load dashboard");
      setData(body);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load dashboard");
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (error) return <div className="p-5 rounded-2xl bg-red-50 text-red-700">{error}</div>;
  if (!data) return <div className="p-8 text-center text-xs text-content-muted animate-pulse">กำลังสรุปข้อมูลจาก MySQL...</div>;

  const cards = [
    ["พนักงานทั้งหมด", data.totalEmployees, Users],
    ["เข้างานวันนี้", data.presentCount, Clock],
    ["ลางาน", data.leaveCount, UserMinus],
    ["ขาดงาน", data.absentCount, AlertTriangle],
    ["มาสาย", data.lateCount, Clock],
    ["นอก Geofence", data.outsideGeofenceAlerts, MapPin],
    ["ยังไม่ลงเวลาออก", data.missingCheckoutAlerts, AlertTriangle],
  ] as const;

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl border border-white/10">
        <div>
          <div className="text-xs text-indigo-400 font-bold uppercase tracking-widest">{data.reportDate}</div>
          <h1 className="text-3xl font-black mt-1">{data.tenantName}</h1>
          <p className="mt-1 text-xs text-slate-400">ข้อมูลสดจากฐานข้อมูล SmartJeff Enterprise Operations</p>
        </div>
        <button
          onClick={load}
          className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all w-fit"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Security Governance Tile (Requirement 92) */}
      {data.security && (
        <div className="p-5 rounded-3xl bg-surface-card border border-surface-border shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-surface-border pb-2">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                ความปลอดภัยและการกำกับดูแลสิทธิ์ (Security Governance)
              </h2>
            </div>
            <Link
              href="/admin/security/roles"
              className="text-[11px] font-bold text-brand-600 hover:underline flex items-center space-x-1"
            >
              <span>จัดการสิทธิ์</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3 rounded-2xl bg-surface-subtle/60 border border-surface-border">
              <span className="text-[10px] text-content-muted font-bold block">ผู้ใช้งานทั้งหมด</span>
              <span className="text-xl font-black text-content-primary">{data.security.totalUsers}</span>
            </div>

            <div className="p-3 rounded-2xl bg-surface-subtle/60 border border-surface-border">
              <span className="text-[10px] text-content-muted font-bold block">บทบาทในระบบ</span>
              <span className="text-xl font-black text-indigo-600">{data.security.totalRoles}</span>
            </div>

            <div className="p-3 rounded-2xl bg-surface-subtle/60 border border-surface-border">
              <span className="text-[10px] text-content-muted font-bold block">Session Active</span>
              <span className="text-xl font-black text-emerald-600">{data.security.activeSessions}</span>
            </div>

            <div className="p-3 rounded-2xl bg-surface-subtle/60 border border-surface-border">
              <span className="text-[10px] text-content-muted font-bold block">MFA Coverage</span>
              <span className="text-xl font-black text-content-primary">{data.security.mfaCoveragePercent}%</span>
            </div>

            <div className="p-3 rounded-2xl bg-surface-subtle/60 border border-surface-border">
              <span className="text-[10px] text-content-muted font-bold block">Access Review รอดำเนินการ</span>
              <span className="text-xl font-black text-amber-600">{data.security.pendingReviews}</span>
            </div>
          </div>
        </div>
      )}

      {/* Operational Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([label, value, Icon]) => (
          <div key={label} className="p-5 rounded-2xl bg-surface-card border border-surface-border shadow-sm">
            <Icon className="text-brand-600 w-5 h-5" />
            <div className="text-3xl font-black mt-3 text-content-primary">{value}</div>
            <div className="text-xs text-content-muted font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Financial Estimates */}
      <div className="p-5 rounded-2xl bg-surface-card border border-surface-border shadow-sm">
        <div className="text-xs text-content-muted font-medium">ประมาณการค่าแรงจากอัตรารายวันของผู้มาปฏิบัติงาน</div>
        <div className="text-2xl font-black text-emerald-600 mt-1">
          ฿{data.estimatedLaborCost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
}
