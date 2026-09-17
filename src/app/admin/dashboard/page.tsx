"use client";

import { useEffect, useState } from "react";
import { Users, Clock, AlertTriangle, UserMinus, MapPin, RefreshCw } from "lucide-react";

interface DashboardData { reportDate: string; tenantName: string; totalEmployees: number; presentCount: number; absentCount: number; lateCount: number; leaveCount: number; outsideGeofenceAlerts: number; missingCheckoutAlerts: number; estimatedLaborCost: number }

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    try { const response = await fetch("/api/admin/dashboard", { cache: "no-store" }); const body = await response.json(); if (!response.ok) throw new Error(body.error || "Unable to load dashboard"); setData(body); setError(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load dashboard"); }
  };
  useEffect(() => { load(); }, []);
  if (error) return <div className="p-5 rounded-2xl bg-red-50 text-red-700">{error}</div>;
  if (!data) return <div className="p-8 text-center">กำลังสรุปข้อมูลจาก MySQL...</div>;
  const cards = [
    ["พนักงานทั้งหมด", data.totalEmployees, Users], ["เข้างานวันนี้", data.presentCount, Clock],
    ["ลางาน", data.leaveCount, UserMinus], ["ขาดงาน", data.absentCount, AlertTriangle],
    ["มาสาย", data.lateCount, Clock], ["นอก Geofence", data.outsideGeofenceAlerts, MapPin],
    ["ยังไม่ลงเวลาออก", data.missingCheckoutAlerts, AlertTriangle],
  ] as const;
  return <div className="space-y-6 max-w-6xl mx-auto">
    <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-brand-900 text-white flex justify-between"><div><div className="text-sm opacity-70">{data.reportDate}</div><h1 className="text-3xl font-black">{data.tenantName}</h1><p className="mt-1 opacity-80">ข้อมูลสดจากฐานข้อมูล SmartJeff</p></div><button onClick={load} className="p-3"><RefreshCw /></button></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{cards.map(([label, value, Icon]) => <div key={label} className="p-5 rounded-2xl bg-surface-bg border border-surface-border"><Icon className="text-brand-600" /><div className="text-3xl font-black mt-3">{value}</div><div className="text-sm text-content-muted">{label}</div></div>)}</div>
    <div className="p-5 rounded-2xl bg-surface-bg border border-surface-border"><div className="text-sm text-content-muted">ประมาณการค่าแรงจากอัตรารายวันของผู้มาปฏิบัติงาน</div><div className="text-2xl font-bold">฿{data.estimatedLaborCost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</div></div>
  </div>;
}
