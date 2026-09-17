"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, Clock, MapPin, Users } from "lucide-react";
import { LiveEmployeeMap, type LiveOperationsSnapshot } from "@/components/map/LiveEmployeeMap";

export default function OperationsOverviewPage() {
  const [snapshot, setSnapshot] = useState<LiveOperationsSnapshot | null>(null);
  const metrics = [
    ["พนักงานทั้งหมด", snapshot?.summary.totalEmployees ?? "—", Users],
    ["กำลังปฏิบัติงาน", snapshot?.summary.working ?? "—", MapPin],
    ["เข้างานสาย", snapshot?.summary.late ?? "—", Clock],
    ["แจ้งเตือน", snapshot?.summary.alerts ?? "—", AlertTriangle],
  ] as const;
  return <div className="mx-auto max-w-7xl space-y-6 pb-20">
    <header className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 p-6 text-white shadow-xl md:flex-row md:items-center">
      <div><span className="text-xs font-bold tracking-wider text-brand-300">OPERATIONS CONTROL CENTER</span><h1 className="text-2xl font-black">ศูนย์ควบคุมการปฏิบัติงาน</h1><p className="mt-1 text-sm text-slate-300">ข้อมูลกำลังคน ไซต์ Geofence และเหตุการณ์ลงเวลาจาก MySQL</p></div>
      <Link href="/operations/planning" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20">วางแผนกำลังคน</Link>
    </header>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{metrics.map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-surface-border bg-surface-card p-5"><Icon className="h-5 w-5 text-brand-600" /><div className="mt-3 text-3xl font-black">{value}</div><div className="text-sm text-content-muted">{label}</div></div>)}</div>
    <LiveEmployeeMap onData={setSnapshot} />
    {snapshot && <section className="overflow-hidden rounded-3xl border border-surface-border bg-surface-card"><div className="border-b border-surface-border p-5 font-bold">สถานะกำลังคนรายไซต์</div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-surface-subtle text-left text-content-muted"><tr><th className="p-3">ไซต์</th><th className="p-3">สถานะ</th><th className="p-3">ต้องการ</th><th className="p-3">วางแผน</th><th className="p-3">ทำงาน</th><th className="p-3">สาย</th><th className="p-3">ลา</th><th className="p-3">ยังไม่ลงเวลา</th></tr></thead><tbody>{snapshot.sites.map((site) => <tr key={site.id} className="border-t border-surface-border"><td className="p-3 font-semibold">{site.name}<div className="text-xs text-content-muted">{site.code}</div></td><td className="p-3">{site.status}</td><td className="p-3">{site.required}</td><td className="p-3">{site.planned}</td><td className="p-3">{site.working}</td><td className="p-3">{site.late}</td><td className="p-3">{site.leave}</td><td className="p-3">{site.notCheckedIn}</td></tr>)}</tbody></table></div></section>}
  </div>;
}
