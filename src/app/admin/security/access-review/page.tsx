"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileCheck,
  AlertTriangle,
  UserX,
  Clock,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/swal";

export default function SecurityAccessReviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/security/access-review");
      if (res.ok) {
        const body = await res.json();
        setData(body);
      } else {
        throw new Error("ไม่สามารถโหลดข้อมูลทบทวนสิทธิ์ได้");
      }
    } catch (err: any) {
      showError("ข้อผิดพลาด", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">
            <FileCheck className="w-4 h-4" />
            <span>Periodic Privileged Access Review</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">ตรวจสอบและทบทวนสิทธิ์ (Access Review)</h1>
          <p className="text-xs text-slate-400 mt-1">
            ตรวจจับบัญชีที่ไม่เคลื่อนไหว (Dormant Accounts), สิทธิ์ชั่วคราวที่หมดอายุ, และการสะสมสิทธิ์เกินความจำเป็น (Privilege Creep)
          </p>
        </div>

        <button
          onClick={loadReview}
          disabled={loading}
          className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-surface-card border border-surface-border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-content-muted uppercase">บัญชีไม่เคลื่อนไหว &gt; 30 วัน</span>
            <UserX className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600">
            {data?.summary?.dormantCount || 0} บัญชี
          </div>
          <p className="text-[11px] text-content-muted">ไม่มีการเข้าสู่ระบบเกิน 30 วันแต่ยังมีสถานะ Active</p>
        </div>

        <div className="p-5 rounded-3xl bg-surface-card border border-surface-border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-content-muted uppercase">สิทธิ์ชั่วคราวที่หมดอายุ</span>
            <Clock className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-600">
            {data?.summary?.expiredRolesCount || 0} รายการ
          </div>
          <p className="text-[11px] text-content-muted">ระบบทำการปิดสถานะเป็น EXPIRED อัตโนมัติ</p>
        </div>

        <div className="p-5 rounded-3xl bg-surface-card border border-surface-border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-content-muted uppercase">ผู้ใช้ที่มีสิทธิ์ระดับสูงซ้ำซ้อน</span>
            <ShieldAlert className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-indigo-600">
            {data?.summary?.excessivePrivilegesCount || 0} คน
          </div>
          <p className="text-[11px] text-content-muted">ถือครองบทบาทระดับบริหาร/Admin มากกว่า 2 บทบาท</p>
        </div>
      </div>

      {/* Dormant Accounts List */}
      <div className="p-5 rounded-3xl bg-surface-card border border-surface-border shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-content-primary flex items-center">
          <UserX className="w-4 h-4 text-amber-600 mr-2" />
          รายชื่อบัญชีที่ไม่เคลื่อนไหว (Dormant Users)
        </h2>

        {data?.dormantUsers?.length === 0 ? (
          <div className="p-6 text-center text-xs text-content-muted">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            ยอดเยี่ยม! ไม่พบบัญชีที่ค้างใช้งานเกินกำหนด
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {data?.dormantUsers?.map((u: any) => (
              <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-content-primary">{u.displayName || u.email}</p>
                  <p className="text-[10px] text-content-muted">
                    เข้าสู่ระบบล่าสุด: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("th-TH") : "ไม่เคยเข้าสู่ระบบ"}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 font-bold">
                    Dormant
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Excessive Privileges List */}
      <div className="p-5 rounded-3xl bg-surface-card border border-surface-border shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-content-primary flex items-center">
          <ShieldAlert className="w-4 h-4 text-indigo-600 mr-2" />
          การถือครองสิทธิ์ระดับสูงซ้ำซ้อน (Privilege Accumulation)
        </h2>

        {data?.excessivePrivileges?.length === 0 ? (
          <div className="p-6 text-center text-xs text-content-muted">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            ไม่พบบัญชีที่มีสิทธิ์ระดับสูงซ้ำซ้อน
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {data?.excessivePrivileges?.map((item: any, i: number) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-content-primary">{item.user.displayName || item.user.email}</p>
                  <p className="text-[10px] text-content-muted">{item.user.email}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {item.highLevelRoles.map((r: string, idx: number) => (
                    <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-700">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
