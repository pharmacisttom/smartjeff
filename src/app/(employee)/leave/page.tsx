"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  PlusCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Send,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/swal";

interface LeaveItem {
  id: string;
  type: "SICK" | "PERSONAL" | "VACATION" | "OT";
  startDate: string;
  endDate: string;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  SICK: { label: "ลาป่วย", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  PERSONAL: { label: "ลากิจ", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  VACATION: { label: "พักร้อน", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  OT: { label: "ขอทำ OT", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; class: string }> = {
  PENDING: { label: "รอพิจารณา", icon: AlertCircle, class: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  APPROVED: { label: "อนุมัติแล้ว", icon: CheckCircle2, class: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  REJECTED: { label: "ไม่อนุมัติ", icon: XCircle, class: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
};

export default function LeavePage() {
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    type: "SICK",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
  });

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/leaves");
      const data = await res.json();
      if (res.ok) {
        setLeaves(data.leaves || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showSuccess("ยื่นคำขอสำเร็จ!", data.message || "ระบบบันทึกรายการยื่นขอลา/ทำ OT เรียบร้อยแล้ว (รอการอนุมัติ)");
        setShowModal(false);
        setForm({
          type: "SICK",
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date().toISOString().split("T")[0],
          reason: "",
        });
        fetchLeaves();
      } else {
        showError("เกิดข้อผิดพลาด", data.message || "ไม่สามารถยื่นแบบฟอร์มได้");
      }
    } catch (err: any) {
      showError("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-800 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center space-x-2 text-brand-200 text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Leave & Overtime Portal</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">ขอลา & ขออนุมัติทำ OT</h1>
          <p className="text-sm text-brand-100 max-w-md">
            ยื่นคำขอลาป่วย ลากิจ พักร้อน หรือลงทะเบียนขอทำล่วงเวลาออนไลน์ได้สะดวก 24 ชั่วโมง
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="relative z-10 flex items-center justify-center space-x-2 bg-white text-brand-700 font-bold px-5 py-3 rounded-2xl hover:bg-brand-50 transition-all shadow-md active:scale-95"
        >
          <PlusCircle className="w-5 h-5 text-brand-600" />
          <span>ยื่นใบลา / ขอ OT</span>
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 text-brand-800 text-sm font-medium flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-brand-600 font-bold">ปิด</button>
        </div>
      )}

      {/* Quota Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "ลาป่วยคงเหลือ", days: "30 วัน", badge: "ใช้ไป 2 วัน", bg: "from-amber-500/10 to-amber-500/5", text: "text-amber-600" },
          { title: "ลากิจคงเหลือ", days: "6 วัน", badge: "ใช้ไป 1 วัน", bg: "from-blue-500/10 to-blue-500/5", text: "text-blue-600" },
          { title: "พักร้อนคงเหลือ", days: "6 วัน", badge: "ใช้ไป 0 วัน", bg: "from-emerald-500/10 to-emerald-500/5", text: "text-emerald-600" },
          { title: "OT สะสมเดือนนี้", days: "12 ชม.", badge: "อนุมัติแล้ว", bg: "from-purple-500/10 to-purple-500/5", text: "text-purple-600" },
        ].map((stat, idx) => (
          <div
            key={idx}
            className={cn(
              "p-4 rounded-2xl border border-surface-border bg-gradient-to-br bg-surface-card space-y-2 shadow-sm",
              stat.bg
            )}
          >
            <p className="text-xs font-semibold text-content-muted">{stat.title}</p>
            <p className={cn("text-2xl font-black tracking-tight", stat.text)}>{stat.days}</p>
            <span className="inline-block text-[11px] font-medium text-content-secondary bg-surface-subtle px-2 py-0.5 rounded-full">
              {stat.badge}
            </span>
          </div>
        ))}
      </div>

      {/* Leave History List */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-content-primary">ประวัติการขอลา & ทำ OT</h2>
          </div>
          <span className="text-xs text-content-muted">ทั้งหมด {leaves.length} รายการ</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-content-muted text-sm animate-pulse">
            กำลังโหลดข้อมูลประวัติการขอลา...
          </div>
        ) : leaves.length === 0 ? (
          <div className="py-12 text-center text-content-muted space-y-2">
            <Calendar className="w-12 h-12 mx-auto text-content-muted/50" />
            <p className="font-medium text-sm">ยังไม่มีรายการขอลาหรือทำ OT</p>
            <p className="text-xs text-content-muted">กดปุ่ม "ยื่นใบลา / ขอ OT" ด้านบนเพื่อสร้างรายการใหม่</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map((item) => {
              const typeInfo = TYPE_LABELS[item.type] || { label: item.type, color: "bg-gray-100 text-gray-700" };
              const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-surface-border bg-surface-bg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-hover hover:border-brand-300"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full border", typeInfo.color)}>
                        {typeInfo.label}
                      </span>
                      <span className="text-xs text-content-muted flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-content-muted" />
                        {new Date(item.startDate).toLocaleDateString("th-TH")} -{" "}
                        {new Date(item.endDate).toLocaleDateString("th-TH")}
                      </span>
                    </div>
                    {item.reason && (
                      <p className="text-sm font-medium text-content-primary">
                        เหตุผล: <span className="font-normal text-content-secondary">{item.reason}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    <span
                      className={cn(
                        "inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold",
                        statusInfo.class
                      )}
                    >
                      <StatusIcon className="w-4 h-4" />
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Submit Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-lg font-bold text-content-primary">ยื่นแบบฟอร์มขอลา / ทำ OT</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-content-muted hover:text-content-primary font-bold text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">ประเภทการยื่น</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-border bg-surface-bg text-content-primary font-medium text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="SICK">ลาป่วย (Sick Leave)</option>
                  <option value="PERSONAL">ลากิจ (Personal Leave)</option>
                  <option value="VACATION">ลาพักร้อน (Vacation Leave)</option>
                  <option value="OT">ขอทำงานล่วงเวลา (Overtime)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-content-secondary mb-1">วันที่เริ่มต้น</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-content-secondary mb-1">วันที่สิ้นสุด</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-bg text-content-primary text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">เหตุผลการขอลา / รายละเอียด OT</label>
                <textarea
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="ระบุเหตุผลความจำเป็น..."
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-border bg-surface-bg text-content-primary text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-content-secondary hover:bg-surface-subtle transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 shadow-md transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? "กำลังยื่นคำขอ..." : "ส่งคำขอ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
