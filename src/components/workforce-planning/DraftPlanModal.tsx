"use client";

import { useState } from "react";
import { X, FileText, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  SiteStaffingSummary,
  WorkforceCandidate,
} from "@/server/services/workforce-planning.service";
import { showSuccess, showError } from "@/lib/swal";

interface DraftPlanModalProps {
  isOpen: boolean;
  targetSite: SiteStaffingSummary | null;
  candidates: WorkforceCandidate[];
  onClose: () => void;
  onSuccess: () => void;
}

export function DraftPlanModal({
  isOpen,
  targetSite,
  candidates,
  onClose,
  onSuccess,
}: DraftPlanModalProps) {
  const [reason, setReason] = useState("เสริมกำลังพลแก้ปัญหาการขาดแคลนพนักงานประจำไซต์งานตามระบบ DSS Phase 8");
  const [planDate, setPlanDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !targetSite || candidates.length === 0) return null;

  const sourceSiteId = candidates[0].currentSiteId;
  const sourceSiteName = candidates[0].currentSiteName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/workforce-planning/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planDate,
          sourceSiteId,
          targetSiteId: targetSite.id,
          reason,
          employeeIds: candidates.map((c) => c.employeeId),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showSuccess(
          "สร้างแผนจัดสรรกำลังคนร่างสำเร็จ!",
          `แผนร่าง (DRAFT) สำหรับย้ายพนักงาน ${candidates.length} คน ถูกบันทึกเรียบร้อยแล้ว รอการอนุมัติจากผู้บริหาร`
        );
        onSuccess();
        onClose();
      } else {
        showError("เกิดข้อผิดพลาด", data.error?.message || "ไม่สามารถบันทึกแผนร่างได้");
      }
    } catch (err: any) {
      showError("เกิดข้อผิดพลาด", err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>สร้างแผนร่างจัดสรรกำลังคน (Create Workforce Draft Plan)</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-lg">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1">วันที่ต้องการให้มีผลบังคับใช้ (Effective Date)</label>
            <input
              type="date"
              value={planDate}
              onChange={(e) => setPlanDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block">ไซต์ต้นทาง (Source)</span>
              <span className="font-bold text-white text-xs truncate block">{sourceSiteName}</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block">ไซต์ปลายทาง (Target)</span>
              <span className="font-bold text-emerald-400 text-xs truncate block">{targetSite.name}</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">
              พนักงานที่ถูกเลือก ({candidates.length} คน)
            </label>
            <div className="max-h-32 overflow-y-auto space-y-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800">
              {candidates.map((c) => (
                <div key={c.employeeId} className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>👤 {c.name} ({c.position})</span>
                  <span className="text-slate-500 font-mono">{c.distanceKm} กม.</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">เหตุผลและความจำเป็น (Business Justification)</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-brand-500 resize-none"
              required
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300">
            *ระบบจะไม่สั่งย้ายพนักงานในทันที แผนนี้จะอยู่ในสถานะ <strong>DRAFT</strong> เพื่อรอให้ Site Manager และผู้บริหารพิจารณาอนุมัติ
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md transition-all disabled:opacity-50"
            >
              {submitting ? "กำลังบันทึก..." : "บันทึกแผนร่าง (Save Draft)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
