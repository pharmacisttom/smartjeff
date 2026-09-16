"use client";

import { useState } from "react";
import { formatThaiDate, formatTime } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Clock, MapPin, Calendar, Search, Filter } from "lucide-react";

interface HistoryRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  otIn?: string;
  otOut?: string;
  siteName: string;
  isWithinGeofence: boolean;
  status: "APPROVED" | "PENDING" | "REJECTED";
}

const MOCK_HISTORY: HistoryRecord[] = [
  { id: "1", date: "2026-09-16", checkIn: "07:22", checkOut: "16:05", otIn: "16:15", otOut: "18:30", siteName: "บริษัท เอเอเอ็ม อินดัสเตรียล จำกัด (AAM)", isWithinGeofence: true, status: "APPROVED" },
  { id: "2", date: "2026-09-15", checkIn: "07:28", checkOut: "16:00", siteName: "บริษัท เอเอเอ็ม อินดัสเตรียล จำกัด (AAM)", isWithinGeofence: true, status: "APPROVED" },
  { id: "3", date: "2026-09-14", checkIn: "07:35", checkOut: "16:10", otIn: "16:30", otOut: "19:00", siteName: "บริษัท เอเอเอ็ม อินดัสเตรียล จำกัด (AAM)", isWithinGeofence: true, status: "APPROVED" },
  { id: "4", date: "2026-09-13", checkIn: "07:42", checkOut: "16:02", siteName: "บริษัท เอเอเอ็ม อินดัสเตรียล จำกัด (AAM)", isWithinGeofence: false, status: "PENDING" },
  { id: "5", date: "2026-09-12", checkIn: "07:15", checkOut: "16:00", siteName: "บริษัท เอเอเอ็ม อินดัสเตรียล จำกัด (AAM)", isWithinGeofence: true, status: "APPROVED" },
];

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = MOCK_HISTORY.filter((item) => item.date.includes(searchTerm) || item.siteName.includes(searchTerm));

  return (
    <div className="space-y-4 max-w-md mx-auto md:max-w-4xl">
      <div className="bg-surface-bg rounded-2xl p-4 md:p-6 shadow-sm border border-surface-border">
        <h1 className="text-xl md:text-2xl font-bold text-content-primary">ประวัติการลงเวลาปฏิบัติงาน</h1>
        <p className="text-xs md:text-sm text-content-secondary mt-0.5">
          แสดงรายการเข้า-ออกงาน และการทำ OT ย้อนหลังสำหรับพนักงาน
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface-bg p-3 rounded-2xl border border-surface-border flex items-center space-x-2">
        <Search className="w-4 h-4 text-content-muted ml-2" />
        <input
          type="text"
          placeholder="ค้นหาตามวันที่ หรือ โรงงาน..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-none text-content-primary"
        />
      </div>

      {/* History Cards */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div key={item.id} className="bg-surface-bg rounded-2xl p-4 border border-surface-border shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-content-primary">
                <Calendar className="w-4 h-4 text-brand-500" />
                <span>{formatThaiDate(item.date)}</span>
              </div>
              {item.status === "APPROVED" && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
                  อนุมัติแล้ว ✅
                </span>
              )}
              {item.status === "PENDING" && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600">
                  รออนุมัติ (นอกพื้นที่)
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 bg-surface-subtle p-3 rounded-xl text-xs">
              <div>
                <span className="text-content-muted block text-[10px]">เวลาเข้างาน:</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">🟢 {item.checkIn} น.</span>
              </div>
              <div>
                <span className="text-content-muted block text-[10px]">เวลาเลิกงาน:</span>
                <span className="font-mono font-bold text-blue-600 text-sm">🔵 {item.checkOut} น.</span>
              </div>

              {item.otIn && (
                <div className="col-span-2 pt-2 border-t border-surface-border flex justify-between text-[11px]">
                  <span>OT: <strong className="font-mono text-amber-600">🟠 {item.otIn}</strong> ถึง <strong className="font-mono text-slate-700">🔴 {item.otOut}</strong></span>
                  <span className="text-brand-600 font-semibold">(2.25 ชม.)</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-content-muted">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-brand-500" />
                <span>{item.siteName}</span>
              </span>
              {item.isWithinGeofence ? (
                <span className="text-emerald-600 font-medium">ในพื้นที่</span>
              ) : (
                <span className="text-amber-600 font-medium">นอกรัศมี</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
