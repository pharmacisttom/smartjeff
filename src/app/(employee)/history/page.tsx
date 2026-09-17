"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, MapPin, Search } from "lucide-react";

interface AttendanceRecord {
  id: string; type: string; timestamp: string; siteName: string;
  isWithinGeofence: boolean; isApproved: boolean; distance: number;
}

export default function HistoryPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/attendance/me?search=${encodeURIComponent(search)}`, { signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load attendance history");
        setRecords(body.records || []);
        setError(null);
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Unable to load attendance history");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search]);

  return <div className="space-y-4 max-w-4xl mx-auto">
    <div className="bg-surface-bg rounded-2xl p-5 border border-surface-border">
      <h1 className="text-2xl font-bold text-content-primary">ประวัติการลงเวลา</h1>
      <div className="relative mt-4">
        <Search className="absolute left-3 top-3 w-4 h-4 text-content-muted" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาสถานที่ทำงาน" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-border bg-surface-bg" />
      </div>
    </div>
    {error && <div className="p-4 rounded-xl bg-red-50 text-red-700">{error}</div>}
    {loading ? <div className="p-8 text-center text-content-muted">กำลังโหลดข้อมูลจากระบบ...</div> : records.length === 0 ?
      <div className="p-8 text-center bg-surface-bg border border-surface-border rounded-2xl">ยังไม่มีข้อมูลการลงเวลา</div> :
      <div className="space-y-3">{records.map((record) => <div key={record.id} className="p-4 bg-surface-bg border border-surface-border rounded-2xl flex justify-between gap-4">
        <div><div className="font-bold text-content-primary">{record.type}</div><div className="text-sm text-content-secondary">{new Date(record.timestamp).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</div><div className="text-xs text-content-muted flex items-center mt-1"><MapPin className="w-3 h-3 mr-1" />{record.siteName} · {Math.round(record.distance)} เมตร</div></div>
        <div className={record.isApproved ? "text-emerald-600" : "text-amber-600"}>{record.isApproved ? <CheckCircle2 /> : <AlertCircle />}</div>
      </div>)}</div>}
  </div>;
}
