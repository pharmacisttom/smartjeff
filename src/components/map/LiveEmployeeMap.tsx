"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AlertTriangle, MapPin, RefreshCw, Users } from "lucide-react";
import type { OperationsSite } from "./EnterpriseMapClient";

const EnterpriseMap = dynamic(() => import("./EnterpriseMapClient"), {
  ssr: false,
  loading: () => <div className="h-[520px] animate-pulse rounded-2xl bg-surface-subtle" />,
});

export interface LiveOperationsSnapshot {
  summary: {
    activeSites: number;
    totalEmployees: number;
    working: number;
    late: number;
    leave: number;
    notCheckedIn: number;
    ot: number;
    alerts: number;
    planned: number;
    genderBreakdown?: {
      male: number;
      female: number;
      other: number;
      unspecified: number;
    };
  };
  sites: OperationsSite[];
  generatedAt: string;
}

export function LiveEmployeeMap({ onData }: { onData?: (data: LiveOperationsSnapshot) => void }) {
  const [data, setData] = useState<LiveOperationsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const response = await fetch("/api/executive/live-operations", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "โหลดข้อมูลแผนที่ไม่สำเร็จ");
      setData(body);
      setError(null);
      onData?.(body);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "โหลดข้อมูลแผนที่ไม่สำเร็จ");
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const gb = data?.summary.genderBreakdown;

  return (
    <section className="space-y-4 rounded-3xl border border-surface-border bg-surface-card p-5 shadow-sm font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-black text-lg text-content-primary">
            <MapPin className="h-5 w-5 text-brand-600" />
            แผนที่ปฏิบัติการและกระจายกำลังคน
          </div>
          <p className="text-xs text-content-muted">
            แสดงสัญลักษณ์เพศและสถานะปฏิบัติงานจาก MySQL · อัปเดตทุก 30 วินาที
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-xl p-2 hover:bg-surface-subtle text-content-secondary transition-colors"
          aria-label="รีเฟรชแผนที่"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      ) : data ? (
        <>
          <EnterpriseMap sites={data.sites} />

          {/* Gender & Status Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-surface-border">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-content-primary flex items-center gap-1">
                <Users className="h-4 w-4 text-brand-600" /> สัดส่วนเพศพนักงาน:
              </span>
              <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 font-semibold text-blue-700 dark:text-blue-400">
                ชาย ♂: {gb?.male ?? 0}
              </span>
              <span className="rounded-lg bg-pink-500/10 px-2.5 py-1 font-semibold text-pink-700 dark:text-pink-400">
                หญิง ♀: {gb?.female ?? 0}
              </span>
              {(gb?.other ?? 0) > 0 && (
                <span className="rounded-lg bg-purple-500/10 px-2.5 py-1 font-semibold text-purple-700 dark:text-purple-400">
                  อื่น ๆ: {gb?.other}
                </span>
              )}
              {(gb?.unspecified ?? 0) > 0 && (
                <span className="rounded-lg bg-slate-500/10 px-2.5 py-1 font-semibold text-slate-700 dark:text-slate-400">
                  ไม่ระบุ: {gb?.unspecified}
                </span>
              )}
            </div>

            <div className="text-[11px] text-content-muted">
              ไซต์มีพิกัด {data.sites.filter((site) => site.lat != null && site.lng != null).length}/{data.sites.length} · อัปเดตล่าสุด {new Date(data.generatedAt).toLocaleTimeString("th-TH")}
            </div>
          </div>
        </>
      ) : (
        <div className="h-[520px] animate-pulse rounded-2xl bg-surface-subtle" />
      )}
    </section>
  );
}
