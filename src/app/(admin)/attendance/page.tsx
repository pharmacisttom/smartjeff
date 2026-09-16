"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, MapPin, ShieldAlert, User, Search, Filter } from "lucide-react";
import { formatThaiDate } from "@/lib/utils";

interface PendingApproval {
  id: string;
  employeeCode: string;
  employeeName: string;
  position: string;
  siteName: string;
  type: string;
  time: string;
  date: string;
  distance: number;
  reason: string;
}

const INITIAL_PENDINGS: PendingApproval[] = [
  { id: "att-1", employeeCode: "EMP003", employeeName: "พัดมา วงค์คำ", position: "พนักงานทำความสะอาด", siteName: "บริษัท เอเอเอ็ม อินดัสเตรียล จำกัด", type: "CHECK_IN", time: "07:42", date: "2026-09-16", distance: 340, reason: "ลงเวลานอกรัศมี Geofence (340 เมตรจากพิกัดโรงงาน)" },
  { id: "att-2", employeeCode: "EMP005", employeeName: "พรทิพย์ สว่างอรุณ", position: "แม่บ้านประจำอาคาร", siteName: "โรงงาน ABPR 1 (อมตะซิตี้)", type: "CHECK_IN", time: "07:55", date: "2026-09-16", distance: 410, reason: "สลับไปช่วยงานโซน B นอกรัศมีหลัก" },
  { id: "att-3", employeeCode: "EMP012", employeeName: "เกรียงไกร สมบูรณ์", position: "สายกวาด", siteName: "โรงงานแบตเตอรี่ อีสเทิร์นซีบอร์ด", type: "OT_IN", time: "16:30", date: "2026-09-15", distance: 280, reason: "ขออนุมัติ OT พิเศษนอกพื้นที่" },
];

export default function AdminAttendancePage() {
  const [items, setItems] = useState(INITIAL_PENDINGS);

  const handleApprove = (id: string) => {
    alert("อนุมัติการลงเวลาเรียบร้อยแล้ว");
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleReject = (id: string) => {
    alert("ปฏิเสธการลงเวลาเรียบร้อยแล้ว");
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="bg-surface-bg rounded-2xl p-4 md:p-6 shadow-sm border border-surface-border">
        <h1 className="text-xl md:text-2xl font-bold text-content-primary">อนุมัติการลงเวลาปฏิบัติงาน (Attendance Approvals)</h1>
        <p className="text-xs md:text-sm text-content-secondary mt-0.5">
          รายการลงเวลานอกรัศมี Geofence หรือคำร้องขอแก้ไขเวลาที่รอการอนุมัติจากผู้ดูแลระบบ / HR
        </p>
      </div>

      <div className="bg-surface-bg rounded-2xl border border-surface-border overflow-hidden">
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <span className="font-semibold text-sm text-content-primary">
            รายการรอการอนุมัติ ({items.length})
          </span>
          <button
            onClick={() => {
              alert("อนุมัติรายการทั้งหมดเรียบร้อยแล้ว");
              setItems([]);
            }}
            disabled={items.length === 0}
            className="px-3 py-1.5 rounded-xl bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            อนุมัติทั้งหมด (Bulk Approve)
          </button>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center text-content-muted text-xs">
            🎉 ไม่มีรายการค้างรออนุมัติ การลงเวลาทั้งหมดได้รับการตรวจสอบเรียบร้อยแล้ว
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {items.map((item) => (
              <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-subtle transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                      {item.employeeCode}
                    </span>
                    <span className="font-semibold text-sm text-content-primary">{item.employeeName}</span>
                    <span className="text-xs text-content-muted">({item.position})</span>
                  </div>

                  <p className="text-xs text-content-secondary flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-500" />
                    <span>{item.siteName}</span>
                    <span className="text-amber-600 font-semibold">(ห่าง {item.distance} ม.)</span>
                  </p>

                  <p className="text-xs font-medium text-rose-600 flex items-center space-x-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>สาเหตุ: {item.reason}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2 self-end md:self-center">
                  <button
                    onClick={() => handleReject(item.id)}
                    className="flex items-center space-x-1 px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>ปฏิเสธ</span>
                  </button>

                  <button
                    onClick={() => handleApprove(item.id)}
                    className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>อนุมัติ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
