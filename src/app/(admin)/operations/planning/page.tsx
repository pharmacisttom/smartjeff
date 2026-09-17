"use client";

import { useState } from "react";
import {
  Sparkles,
  Users,
  MapPin,
  TrendingDown,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { showSuccess, showLoading, closeSwal } from "@/lib/swal";
import { autoAssignWorkforce } from "@/lib/operations/auto-assign";

export default function OperationsPlanningPage() {
  const [sites, setSites] = useState([
    { id: "1", code: "AAM", name: "โรงงาน AAM นิคมฯ มาบตาพุด", lat: 12.682, lng: 101.173, requiredCapacity: 8, currentStaffCount: 6 },
    { id: "2", code: "AMATA", name: "โรงงานอมตะซิตี้ ระยอง", lat: 12.981, lng: 101.102, requiredCapacity: 7, currentStaffCount: 7 },
    { id: "3", code: "CHON", name: "สำนักงานใหญ่ ชลบุรี", lat: 13.361, lng: 100.982, requiredCapacity: 6, currentStaffCount: 5 },
    { id: "4", code: "PLUAK", name: "ปลวกแดง โลจิสติกส์ Hub", lat: 12.975, lng: 101.182, requiredCapacity: 4, currentStaffCount: 3 },
  ]);

  const [employees] = useState([
    { id: "EMP001", name: "สมศรี สุขใจ", lat: 12.682, lng: 101.173, currentSiteName: "มาบตาพุด" },
    { id: "EMP002", name: "สมชาย เข็มกลัด", lat: 12.685, lng: 101.178, currentSiteName: "มาบตาพุด" },
    { id: "EMP003", name: "พัดมา วงค์คำ", lat: 12.981, lng: 101.102, currentSiteName: "อมตะซิตี้" },
    { id: "EMP004", name: "วิชัย ใจดี", lat: 13.361, lng: 100.982, currentSiteName: "ชลบุรี" },
    { id: "EMP005", name: "นารี รุ่งเรือง", lat: 12.689, lng: 101.171, currentSiteName: "มาบตาพุด" },
    { id: "EMP006", name: "สร้อยทอง ดีมาก", lat: 12.978, lng: 101.109, currentSiteName: "อมตะซิตี้" },
    { id: "EMP007", name: "กิมเอิน ใจบุญ", lat: 12.684, lng: 101.174, currentSiteName: "ว่าง (สำรอง)" },
    { id: "EMP008", name: "สมใจ รุ่งโรจน์", lat: 12.979, lng: 101.105, currentSiteName: "ว่าง (สำรอง)" },
  ]);

  const [assignmentPlan, setAssignmentPlan] = useState<any>(null);

  const runAutoAssignment = () => {
    showLoading("กำลังคำนวณแผนจัดสรรคนด้วย AI...", "ค้นหาพนักงานที่อยู่ใกล้ไซต์งานมากที่สุด");

    setTimeout(() => {
      const result = autoAssignWorkforce(employees, sites, 5);
      setAssignmentPlan(result);
      closeSwal();
      showSuccess("คำนวณแผนจัดสรรคนสำเร็จ! ⚡", `แนะนำจัดสรรใหม่ ช่วยประหยัดค่าเดินทาง ฿${result.totalSavedCost.toLocaleString()}/เดือน`);
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 p-6 rounded-3xl text-white shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
            <Sparkles className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <span className="text-xs font-bold text-brand-400 tracking-wider uppercase">AI WORKFORCE OPTIMIZATION</span>
            <h1 className="text-2xl font-black tracking-tight">การวางแผนกำลังคนและจัดสรรคนอัตโนมัติ</h1>
            <p className="text-xs text-slate-300">
              วิเคราะห์และจับคู่พนักงานกับโรงงานที่ใกล้ที่สุด ช่วยลดระยะทางและประหยัดค่าเดินทางรวม
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <Link
            href="/admin/operations/workforce-planning"
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-lg transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>เข้าสู่ระบบ Workforce DSS (Phase 8) →</span>
          </Link>

          <button
            onClick={runAutoAssignment}
            className="flex items-center space-x-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-lg transition-all active:scale-95"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>คำนวณแผนจัดสรรคนด่วน (Auto-Assign)</span>
          </button>
        </div>
      </div>

      {/* Optimization Savings Callout */}
      {assignmentPlan && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-surface-card to-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-600 font-bold text-base">
              <CheckCircle2 className="w-6 h-6" />
              <span>ผลการวิเคราะห์ลดค่าใช้จ่ายการเดินทาง (Cost Savings Optimization)</span>
            </div>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              ประหยัดได้ ฿{assignmentPlan.totalSavedCost.toLocaleString()}/เดือน 🎉
            </span>
          </div>
          <p className="text-xs text-content-muted">
            จากแผนเดิม การสลับตัวพนักงานให้เข้าทำงานที่โรงงานใกล้บ้าน สามารถลดระยะทางเดินทางรวมได้{" "}
            <strong className="text-emerald-600 font-bold">{assignmentPlan.totalSavedKm} กม./วัน</strong>
          </p>
        </div>
      )}

      {/* Sites Capacity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sites.map((site) => {
          const deficit = site.requiredCapacity - site.currentStaffCount;
          return (
            <div key={site.id} className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                    {site.code}
                  </span>
                  <h3 className="font-bold text-content-primary text-sm mt-1">{site.name}</h3>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    deficit <= 0
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-amber-50 text-amber-600 border border-amber-200"
                  }`}
                >
                  {deficit <= 0 ? "คนเพียงพอ ✅" : `ขาดพนักงาน ${deficit} คน ⚠️`}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-content-muted bg-surface-subtle p-3 rounded-2xl border border-surface-border">
                <span>ความต้องการ: <strong>{site.requiredCapacity} คน</strong></span>
                <span>ปัจจุบัน: <strong className="text-content-primary">{site.currentStaffCount} คน</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Recommended Assignments Table */}
      {assignmentPlan && (
        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="font-bold text-content-primary text-base">ตารางแนะนำการจัดสรรพนักงานใหม่</h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              {assignmentPlan.assignments.length} รายการแนะนำ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-surface-border text-content-muted font-bold uppercase bg-surface-subtle">
                  <th className="py-3 px-4">ชื่อพนักงาน</th>
                  <th className="py-3 px-4">ไซต์งานที่แนะนำจัดสรร</th>
                  <th className="py-3 px-4">ระยะทางเดินทาง</th>
                  <th className="py-3 px-4">ค่าเดินทางต่อวัน</th>
                  <th className="py-3 px-4 text-right">เหตุผลการจัดสรร AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {assignmentPlan.assignments.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-surface-subtle transition-colors">
                    <td className="py-3.5 px-4 font-bold text-content-primary">{item.employeeName}</td>
                    <td className="py-3.5 px-4 font-semibold text-brand-600">{item.assignedSiteName}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">{item.distanceKm} กม.</td>
                    <td className="py-3.5 px-4 font-bold text-content-primary">฿{item.estimatedCost}</td>
                    <td className="py-3.5 px-4 text-right text-content-muted">{item.reasoning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
