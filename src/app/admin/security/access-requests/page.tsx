"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/swal";

interface AccessRequestItem {
  id: string;
  userId: string;
  user: {
    id: string;
    displayName: string;
    email: string;
  };
  targetRoleId: string | null;
  permissionCode: string | null;
  scopeType: string;
  scopeId: string | null;
  reason: string;
  durationDays: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
}

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [form, setForm] = useState({
    targetRoleId: "",
    scopeType: "GLOBAL",
    scopeId: "",
    durationDays: 30,
    reason: "",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [reqsRes, rolesRes] = await Promise.all([
        fetch("/api/security/access-requests"),
        fetch("/api/security/roles"),
      ]);

      if (reqsRes.ok) {
        const d = await reqsRes.json();
        setRequests(d.requests || []);
      }
      if (rolesRes.ok) {
        const d = await rolesRes.json();
        setRolesList(d.roles || []);
      }
    } catch (err: any) {
      showError("ข้อผิดพลาด", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit Access Request
  const handleSubmitRequest = async () => {
    if (!form.reason.trim()) {
      showError("ข้อมูลไม่ครบถ้วน", "กรุณาระบุเหตุผลความจำเป็นในการขอสิทธิ์");
      return;
    }

    try {
      const res = await fetch("/api/security/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "ส่งคำขอไม่สำเร็จ");

      showSuccess("สำเร็จ", data.message);
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      showError("ข้อผิดพลาด", err.message);
    }
  };

  // Review request (Approve / Reject)
  const handleReview = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/security/access-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          status,
          reviewNote: status === "APPROVED" ? "อนุมัติโดย Security Admin" : "ปฏิเสธคำขอ",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "ดำเนินการไม่สำเร็จ");

      showSuccess("สำเร็จ", data.message);
      loadData();
    } catch (err: any) {
      showError("ข้อผิดพลาด", err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">
            <FileText className="w-4 h-4" />
            <span>Privileged Access Management (PAM) Workflow</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">คำขอสิทธิ์การใช้งาน (Access Requests)</h1>
          <p className="text-xs text-slate-400 mt-1">
            กระบวนการขออนุมัติสิทธิ์ชั่วคราวตามหลัก Just-In-Time Access (JIT) พร้อมบันทึกหลักฐาน
          </p>
        </div>

        <button
          onClick={() => {
            setForm({
              targetRoleId: rolesList[0]?.id || "",
              scopeType: "GLOBAL",
              scopeId: "",
              durationDays: 30,
              reason: "",
            });
            setShowCreateModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>ยื่นคำขอสิทธิ์ใหม่</span>
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border bg-surface-subtle/50 text-content-muted font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4">ผู้ยื่นคำขอ</th>
                <th className="py-3.5 px-4">บทบาทที่ขอ</th>
                <th className="py-3.5 px-4">ขอบเขต & ระยะเวลา</th>
                <th className="py-3.5 px-4">เหตุผลความจำเป็น</th>
                <th className="py-3.5 px-4">สถานะ</th>
                <th className="py-3.5 px-4 text-right">การพิจารณา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-content-muted animate-pulse">
                    กำลังโหลดคำขอสิทธิ์...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-content-muted">
                    ไม่พบรายการคำขอสิทธิ์
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const roleObj = rolesList.find((r) => r.id === req.targetRoleId);
                  return (
                    <tr key={req.id} className="hover:bg-surface-subtle/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-content-primary">{req.user.displayName}</p>
                        <p className="text-[10px] text-content-muted font-mono">{req.user.email}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-brand-600">
                          {roleObj?.nameTh || req.permissionCode || "N/A"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] bg-surface-subtle px-2 py-0.5 rounded border border-surface-border">
                          {req.scopeType}
                        </span>
                        <span className="block text-[10px] text-content-muted mt-0.5">
                          ระยะเวลา {req.durationDays} วัน
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="line-clamp-2 text-content-secondary">{req.reason}</p>
                        <span className="text-[9px] text-content-muted">
                          ยื่นเมื่อ: {new Date(req.createdAt).toLocaleDateString("th-TH")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {req.status === "PENDING" && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3" />
                            <span>รอพิจารณา</span>
                          </span>
                        )}
                        {req.status === "APPROVED" && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>อนุมัติแล้ว</span>
                          </span>
                        )}
                        {req.status === "REJECTED" && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-md">
                            <XCircle className="w-3 h-3" />
                            <span>ปฏิเสธ</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {req.status === "PENDING" && (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleReview(req.id, "APPROVED")}
                              className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-sm"
                            >
                              อนุมัติ
                            </button>
                            <button
                              onClick={() => handleReview(req.id, "REJECTED")}
                              className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 transition-all border border-rose-500/20"
                            >
                              ปฏิเสธ
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-card border border-surface-border rounded-3xl p-6 shadow-2xl space-y-4 font-sans">
            <h2 className="text-base font-bold text-content-primary flex items-center">
              <Plus className="w-5 h-5 mr-2 text-brand-600" />
              ยื่นขอสิทธิ์การใช้งานชั่วคราว (Access Request)
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">บทบาทที่ต้องการขอ (Role)</label>
                <select
                  value={form.targetRoleId}
                  onChange={(e) => setForm({ ...form, targetRoleId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary text-xs outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {rolesList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nameTh} ({r.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">ขอบเขตข้อมูล (Scope)</label>
                <select
                  value={form.scopeType}
                  onChange={(e) => setForm({ ...form, scopeType: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary text-xs outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="GLOBAL">GLOBAL (ทุกข้อมูล)</option>
                  <option value="SITE">SITE (เฉพาะไซต์)</option>
                  <option value="DEPARTMENT">DEPARTMENT (เฉพาะแผนก)</option>
                  <option value="PROJECT">PROJECT (เฉพาะโครงการ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">ระยะเวลาที่ต้องการใช้งาน (วัน)</label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={form.durationDays}
                  onChange={(e) => setForm({ ...form, durationDays: parseInt(e.target.value, 10) || 30 })}
                  className="w-full px-3.5 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary text-xs outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">เหตุผลความจำเป็นในการขอสิทธิ์</label>
                <textarea
                  rows={3}
                  placeholder="ระบุเหตุผลและภารกิจที่ต้องใช้สิทธิ์นี้..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary text-xs outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl border border-surface-border text-xs font-bold text-content-secondary hover:bg-surface-subtle"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSubmitRequest}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md"
              >
                ส่งคำขอ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
