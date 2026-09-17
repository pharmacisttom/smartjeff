"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  AlertTriangle,
  UserMinus,
  MapPin,
  RefreshCw,
  Home,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  PieChart,
} from "lucide-react";
import { LiveEmployeeMap } from "@/components/map/LiveEmployeeMap";

interface PriorityCheckItem {
  id: string;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
  title: string;
  description: string;
  reason: string;
  ruleApplied: string;
  actionUrl: string;
}

interface DashboardData {
  reportDate: string;
  tenantName: string;
  totalEmployees: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
  outsideGeofenceAlerts: number;
  missingCheckoutAlerts: number;
  estimatedLaborCost: number;
  genderBreakdown?: {
    male: number;
    female: number;
    other: number;
    unspecified: number;
  };
  priorityChecks?: PriorityCheckItem[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<PriorityCheckItem | null>(null);

  const load = async () => {
    try {
      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "ไม่สามารถโหลดข้อมูลผู้บริหารได้");
      setData(body);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ไม่สามารถโหลดข้อมูลผู้บริหารได้");
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (error)
    return (
      <div className="p-6 rounded-2xl bg-rose-50 text-rose-700 font-semibold border border-rose-200">
        {error}
      </div>
    );

  if (!data)
    return (
      <div className="p-12 text-center text-content-muted font-medium animate-pulse">
        กำลังประมวลผลข้อมูลผู้บริหารและวิเคราะห์อัลกอริทึมจาก MySQL...
      </div>
    );

  const cards = [
    ["พนักงานทั้งหมด", data.totalEmployees, Users, "text-blue-600 bg-blue-500/10"],
    ["เข้างานวันนี้", data.presentCount, Clock, "text-emerald-600 bg-emerald-500/10"],
    ["ลางาน", data.leaveCount, UserMinus, "text-purple-600 bg-purple-500/10"],
    ["ขาดงาน", data.absentCount, AlertTriangle, "text-rose-600 bg-rose-500/10"],
    ["มาสาย", data.lateCount, Clock, "text-amber-600 bg-amber-500/10"],
    ["นอก Geofence", data.outsideGeofenceAlerts, MapPin, "text-rose-600 bg-rose-500/10"],
    ["ยังไม่ลงเวลาออก", data.missingCheckoutAlerts, AlertTriangle, "text-amber-600 bg-amber-500/10"],
  ] as const;

  const gb = data.genderBreakdown;
  const checks = data.priorityChecks || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-brand-300">
            ศูนย์บัญชาการผู้บริหาร (Executive Command Center)
          </div>
          <h1 className="mt-1 text-3xl font-black">{data.tenantName}</h1>
          <p className="mt-1 text-xs text-slate-300">
            ประจำวันที่ {data.reportDate} · ข้อมูลเรียลไทม์ผ่าน Service/API จาก MySQL
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/20 transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> รีเฟรช
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            <Home className="h-4 w-4" /> หน้าหลัก
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(([label, value, Icon, style]) => (
          <div key={label} className="p-5 rounded-2xl bg-surface-card border border-surface-border shadow-sm">
            <div className={`inline-flex rounded-xl p-2.5 ${style}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-3xl font-black mt-3 text-content-primary">{value.toLocaleString("th-TH")}</div>
            <div className="text-xs text-content-muted mt-1 font-medium">{label}</div>
          </div>
        ))}

        <div className="p-5 rounded-2xl bg-surface-card border border-surface-border shadow-sm col-span-2 md:col-span-1">
          <div className="text-xs text-content-muted font-medium">ประมาณการค่าแรงวันนี้</div>
          <div className="text-2xl font-black mt-2 text-brand-700 dark:text-brand-400">
            ฿{data.estimatedLaborCost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-content-muted mt-1">คำนวณจาก Daily Rate ของผู้เข้างาน</p>
        </div>
      </div>

      {/* "สิ่งที่ควรตรวจสอบวันนี้" (Daily Priority Checks with "ดูเหตุผล") */}
      <section className="rounded-3xl border border-surface-border bg-surface-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div>
            <h2 className="text-lg font-black text-content-primary flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              สิ่งที่ควรตรวจสอบวันนี้ (Daily Priority Checks)
            </h2>
            <p className="text-xs text-content-muted">
              ข้อเสนอแนะอัจฉริยะที่คำนวณจาก Exception & Alert Rules โดยแสดงเหตุผลที่อธิบายได้ (Explainable Intelligence)
            </p>
          </div>
        </div>

        {checks.length === 0 ? (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            ไม่พบเหตุการณ์ผิดปกติร้ายแรง การปฏิบัติงานวันนี้อยู่ในเกณฑ์ปกติ
          </div>
        ) : (
          <div className="space-y-3">
            {checks.map((chk) => (
              <div
                key={chk.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-border bg-surface-bg p-4 hover:border-brand-500/50 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        chk.severity === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-700 dark:text-rose-400"
                          : chk.severity === "HIGH"
                          ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                          : "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                      }`}
                    >
                      {chk.severity}
                    </span>
                    <h3 className="font-bold text-sm text-content-primary truncate">{chk.title}</h3>
                  </div>
                  <p className="text-xs text-content-muted">{chk.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedReason(chk)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 transition-colors"
                  >
                    <HelpCircle className="h-3.5 w-3.5" /> ดูเหตุผล
                  </button>

                  <Link
                    href={chk.actionUrl}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-brand-700 transition-colors"
                  >
                    <span>จัดการ</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Employee Gender Analytics Card */}
      <section className="rounded-3xl border border-surface-border bg-surface-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div>
            <h2 className="text-lg font-black text-content-primary flex items-center gap-2">
              <PieChart className="h-5 w-5 text-brand-600" />
              การกระจายกำลังคนตามเพศ (Employee Gender Analytics)
            </h2>
            <p className="text-xs text-content-muted">
              สถิติจำนวนพนักงานจำแนกตามเพศจากข้อมูล MySQL (ห้ามใช้เพศเป็นเกณฑ์ตัดสินประเมินหรือลงโทษ)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <div className="text-xs font-bold text-blue-700 dark:text-blue-400">ชาย (MALE) ♂</div>
            <div className="text-3xl font-black mt-2 text-blue-900 dark:text-blue-200">{gb?.male ?? 0}</div>
            <div className="text-[10px] text-content-muted mt-1">คิดเป็น {data.totalEmployees ? Math.round(((gb?.male ?? 0) / data.totalEmployees) * 100) : 0}%</div>
          </div>

          <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/20">
            <div className="text-xs font-bold text-pink-700 dark:text-pink-400">หญิง (FEMALE) ♀</div>
            <div className="text-3xl font-black mt-2 text-pink-900 dark:text-pink-200">{gb?.female ?? 0}</div>
            <div className="text-[10px] text-content-muted mt-1">คิดเป็น {data.totalEmployees ? Math.round(((gb?.female ?? 0) / data.totalEmployees) * 100) : 0}%</div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <div className="text-xs font-bold text-purple-700 dark:text-purple-400">อื่น ๆ (OTHER) 👤</div>
            <div className="text-3xl font-black mt-2 text-purple-900 dark:text-purple-200">{gb?.other ?? 0}</div>
            <div className="text-[10px] text-content-muted mt-1">คิดเป็น {data.totalEmployees ? Math.round(((gb?.other ?? 0) / data.totalEmployees) * 100) : 0}%</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-500/10 border border-slate-500/20">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-400">ไม่ระบุ (UNSPECIFIED) 👤</div>
            <div className="text-3xl font-black mt-2 text-slate-900 dark:text-slate-200">{gb?.unspecified ?? 0}</div>
            <div className="text-[10px] text-content-muted mt-1">คิดเป็น {data.totalEmployees ? Math.round(((gb?.unspecified ?? 0) / data.totalEmployees) * 100) : 0}%</div>
          </div>
        </div>
      </section>

      {/* Live Map Section */}
      <LiveEmployeeMap />

      {/* Modal for "ดูเหตุผล" */}
      {selectedReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg space-y-4 rounded-3xl border border-surface-border bg-surface-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-black text-base text-content-primary flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-brand-600" /> เหตุผลและหลักการของระบบแนะนำ
              </h3>
              <button
                onClick={() => setSelectedReason(null)}
                className="rounded-xl p-1 text-content-muted hover:bg-surface-subtle"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-content-secondary">
              <div>
                <strong>หัวข้อ:</strong> {selectedReason.title}
              </div>
              <div>
                <strong>เหตุผลวิเคราะห์ (Rationale):</strong>
                <p className="mt-1 rounded-xl bg-surface-bg p-3 text-content-primary font-medium border border-surface-border">
                  {selectedReason.reason}
                </p>
              </div>
              <div>
                <strong>กฎที่ใช้คำนวณ (Rule Applied):</strong>
                <p className="mt-1 font-mono text-[11px] text-brand-600 dark:text-brand-400">
                  {selectedReason.ruleApplied}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedReason(null)}
                className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
