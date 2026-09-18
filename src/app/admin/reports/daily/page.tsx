"use client";
import { useEffect, useState, useCallback } from "react";
import { Calendar, Users, Clock, AlertTriangle, Send } from "lucide-react";
import { showError, showSuccess } from "@/lib/swal";

type Report = { reportDate: string; tenantName: string; totalEmployees: number; presentCount: number; absentCount: number; lateCount: number; leaveCount: number; otHours: number; otCost: number; estimatedLaborCost: number; outsideGeofenceAlerts: number; missingCheckoutAlerts: number; aiSummaryText?: string };
export default function DailyReportPage() {
  const [date, setDate] = useState(() => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date()));
  const [report, setReport] = useState<Report | null>(null);
  const load = useCallback(async () => { const response = await fetch(`/api/admin/reports/daily?date=${date}`, { cache: "no-store" }); const body = await response.json(); if (response.ok) setReport(body); else showError("โหลดรายงานไม่สำเร็จ", body.error); }, [date]);
  useEffect(() => { load(); }, [load]);
  const send = async () => { const response = await fetch("/api/notifications/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "LINE_NOTIFY" }) }); const body = await response.json(); response.ok && body.success ? showSuccess("ส่งแล้ว", body.message) : showError("ส่งไม่สำเร็จ", body.message); };
  if (!report) return <div className="p-8 text-center">กำลังสร้างรายงานจากข้อมูลจริง...</div>;
  const metrics = [["พนักงาน", report.totalEmployees, Users], ["เข้างาน", report.presentCount, Clock], ["ขาดงาน", report.absentCount, AlertTriangle], ["ลางาน", report.leaveCount, Calendar]] as const;
  return <div className="space-y-5 max-w-6xl mx-auto"><div className="p-6 rounded-3xl bg-slate-900 text-white flex justify-between gap-4"><div><h1 className="text-2xl font-black">รายงานประจำวัน · {report.tenantName}</h1><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-3 text-slate-900 rounded-lg p-2" /></div><button onClick={send} className="flex items-center gap-2"><Send />ส่งผ่านช่องทางที่ตั้งค่า</button></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{metrics.map(([label, value, Icon]) => <div key={label} className="p-5 rounded-2xl border border-surface-border bg-surface-bg"><Icon className="text-brand-600"/><div className="text-3xl font-black">{value}</div><div>{label}</div></div>)}</div>
    <div className="grid md:grid-cols-2 gap-4"><div className="p-5 rounded-2xl border bg-surface-bg">นอก Geofence: <b>{report.outsideGeofenceAlerts}</b><br/>ยังไม่ลงเวลาออก: <b>{report.missingCheckoutAlerts}</b><br/>มาสาย: <b>{report.lateCount}</b></div><div className="p-5 rounded-2xl border bg-surface-bg">ประมาณการค่าแรง: <b>฿{report.estimatedLaborCost.toLocaleString()}</b><br/>ค่า OT: <b>฿{report.otCost.toLocaleString()}</b></div></div>
    <div className="p-5 rounded-2xl border bg-surface-bg">{report.aiSummaryText}</div></div>;
}
