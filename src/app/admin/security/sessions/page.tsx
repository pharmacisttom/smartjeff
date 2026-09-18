"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Layers,
  ShieldAlert,
  Search,
  RefreshCw,
  LogOut,
  Laptop,
  Smartphone,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showConfirm } from "@/lib/swal";

interface SessionItem {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  accountType: string;
  primaryRole: string;
  deviceInfo: string;
  ipAddress: string;
  authStrength: string;
  status: string;
  loginAt: string;
  lastSeenAt: string;
  expiresAt: string;
}

export default function SecuritySessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [revoking, setRevoking] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/security/sessions", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      } else {
        const data = await res.json();
        throw new Error(data.message || "ดึงข้อมูล Session ไม่สำเร็จ");
      }
    } catch (err: any) {
      console.error(err);
      showError("ข้อผิดพลาด", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Revoke single session
  const handleRevokeSession = async (session: SessionItem) => {
    const confirmed = await showConfirm(
      "ยืนยันการตัด Session?",
      `คุณต้องการตัดการเชื่อมต่อของผู้ใช้ "${session.userName}" บนเครื่อง "${session.deviceInfo}" หรือไม่? ผู้ใช้จะถูกบังคับให้ออกจากระบบทันที`
    );
    if (!confirmed) return;

    try {
      setRevoking(true);
      const res = await fetch(`/api/security/sessions/${session.id}/revoke`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "ไม่สามารถตัด Session ได้");
      showSuccess("สำเร็จ", data.message);
      loadSessions();
    } catch (err: any) {
      showError("ข้อผิดพลาด", err.message);
    } finally {
      setRevoking(false);
    }
  };

  // Revoke all sessions across the system
  const handleRevokeAllSessions = async () => {
    const confirmed = await showConfirm(
      "คำเตือนความปลอดภัย: ยกเลิกทุก Session?",
      "คุณต้องการบังคับออกจากระบบทุกบัญชีผู้ใช้ในระบบทั้งหมดหรือไม่? (ยกเว้น Session ปัจจุบันของคุณ)"
    );
    if (!confirmed) return;

    try {
      setRevoking(true);
      const res = await fetch("/api/security/sessions/revoke-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "ไม่สามารถยกเลิกทุก Session ได้");
      showSuccess("สำเร็จ", data.message);
      loadSessions();
    } catch (err: any) {
      showError("ข้อผิดพลาด", err.message);
    } finally {
      setRevoking(false);
    }
  };

  const filteredSessions = sessions.filter(
    (s) =>
      s.userName.toLowerCase().includes(search.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      s.deviceInfo.toLowerCase().includes(search.toLowerCase()) ||
      s.primaryRole.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = sessions.filter((s) => s.status === "ACTIVE").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Layers className="w-4 h-4" />
            <span>Active Session Governance & Device Trust</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">จัดการ Session ผู้ใช้งาน (Session Admin)</h1>
          <p className="text-xs text-slate-400 mt-1">
            ตรวจติดตามการเข้าสู่ระบบแบบ Real-time บังคับ Re-login และตัดสิทธิ์ Session ที่ต้องสงสัย
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadSessions}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>

          <button
            onClick={handleRevokeAllSessions}
            disabled={revoking || activeCount === 0}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>บังคับออกจากระบบทั้งหมด</span>
          </button>
        </div>
      </div>

      {/* Stats and Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-surface-card border border-surface-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-content-muted block font-bold uppercase">Session ที่เปิดใช้งาน</span>
            <span className="text-2xl font-black text-emerald-600">{activeCount} รายการ</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500/30" />
        </div>

        <div className="p-4 rounded-3xl bg-surface-card border border-surface-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-content-muted block font-bold uppercase">Session ที่ถูกเพิกถอน</span>
            <span className="text-2xl font-black text-rose-600">
              {sessions.filter((s) => s.status === "REVOKED").length} รายการ
            </span>
          </div>
          <XCircle className="w-8 h-8 text-rose-500/30" />
        </div>

        <div className="md:col-span-2 flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้ใช้, อีเมล, บทบาท หรืออุปกรณ์..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-surface-border bg-surface-card text-content-primary text-xs outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border bg-surface-subtle/50 text-content-muted font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4">ผู้ใช้งาน</th>
                <th className="py-3.5 px-4">บทบาทหลัก</th>
                <th className="py-3.5 px-4">อุปกรณ์ & เบราว์เซอร์</th>
                <th className="py-3.5 px-4">IP Address (Masked)</th>
                <th className="py-3.5 px-4">เวลาเข้าสู่ระบบ</th>
                <th className="py-3.5 px-4">สถานะ</th>
                <th className="py-3.5 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-content-muted animate-pulse">
                    กำลังโหลดประวัติ Session...
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-content-muted">
                    ไม่พบ Session ในระบบ
                  </td>
                </tr>
              ) : (
                filteredSessions.map((s) => {
                  const isActive = s.status === "ACTIVE";
                  return (
                    <tr key={s.id} className="hover:bg-surface-subtle/40 transition-colors">
                      {/* User info */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-content-primary">{s.userName}</p>
                          <p className="text-[10px] text-content-muted font-mono">{s.userEmail}</p>
                        </div>
                      </td>

                      {/* Primary Role */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[11px] px-2.5 py-0.5 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 border border-brand-500/20">
                          {s.primaryRole}
                        </span>
                      </td>

                      {/* Device info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2 text-content-secondary">
                          <Laptop className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[200px]" title={s.deviceInfo}>
                            {s.deviceInfo}
                          </span>
                        </div>
                      </td>

                      {/* Masked IP */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] text-content-secondary bg-surface-subtle px-2 py-0.5 rounded-md border border-surface-border">
                          {s.ipAddress}
                        </span>
                      </td>

                      {/* Login Time */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] text-content-muted">
                          {new Date(s.loginAt).toLocaleString("th-TH")}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>ใช้งานอยู่</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md">
                            <span>ถูกเพิกถอน</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isActive && (
                          <button
                            onClick={() => handleRevokeSession(s)}
                            disabled={revoking}
                            className="px-3 py-1 rounded-xl text-[11px] font-bold text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 transition-all border border-rose-500/20 active:scale-95"
                          >
                            ตัด Session
                          </button>
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
    </div>
  );
}
