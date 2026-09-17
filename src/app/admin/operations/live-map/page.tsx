"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  RefreshCw,
  Calendar,
  AlertCircle,
  Radio,
  Clock,
  Sparkles,
  ArrowLeft,
  WifiOff,
  Bot,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ExecutiveKpiCards } from "@/components/executive/ExecutiveKpiCards";
import { OperationsAlertPanel } from "@/components/executive/OperationsAlertPanel";
import { SiteWorkforceTable } from "@/components/executive/SiteWorkforceTable";
import { SiteDetailDrawer } from "@/components/executive/SiteDetailDrawer";
import type {
  LiveOperationsResponse,
  SiteSummaryData,
} from "@/server/services/executive-operations.service";

// Dynamic import Leaflet map with ssr: false
const ExecutiveLiveMap = dynamic(
  () =>
    import("@/components/executive/ExecutiveLiveMap").then(
      (mod) => mod.ExecutiveLiveMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[460px] md:h-[580px] rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-500 space-y-3">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">กำลังโหลดแผนที่ดาวเทียมและจุดตรวจการณ์...</span>
      </div>
    ),
  }
);

export default function ExecutiveLiveOperationsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSite, setSelectedSite] = useState<SiteSummaryData | null>(null);

  // Fetch Live Operations Data with React Query (15s auto-polling)
  const {
    data,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery<LiveOperationsResponse>({
    queryKey: ["executive-live-operations", selectedDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDate) params.set("date", selectedDate);
      params.set("skipAudit", "true");

      const res = await fetch(`/api/executive/live-operations?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "ไม่สามารถเชื่อมต่อ Live Operations API ได้");
      }
      return res.json();
    },
    refetchInterval: autoRefresh ? 15000 : false,
    refetchIntervalInBackground: true,
    staleTime: 8000,
  });

  const formattedUpdatedTime = useMemo(() => {
    if (!data?.updatedAt) return "";
    try {
      const d = new Date(data.updatedAt);
      return d.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " น.";
    } catch {
      return "";
    }
  }, [data?.updatedAt]);

  const formattedDateTitle = useMemo(() => {
    const d = selectedDate ? new Date(`${selectedDate}T12:00:00+07:00`) : new Date();
    return d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 lg:p-8 space-y-6 font-sans">
      {/* Top Header Navigation & Live Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/admin/dashboard"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              EXECUTIVE LIVE COMMAND CENTER
            </span>

            {/* Connection issue indicator */}
            {error && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> Connection Problem (แสดงข้อมูลล่าสุด)
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>ศูนย์ควบคุมการปฏิบัติการหน้างานสด (Live Operations)</span>
          </h1>

          <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
            <span>วันที่: <strong>{formattedDateTitle}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand-400" />
              อัปเดตล่าสุด: <strong className="text-slate-200">{formattedUpdatedTime || "-"}</strong>
            </span>
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker Filter */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-2xl px-3 py-1.5 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-brand-400 mr-2 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            />
          </div>

          {/* Auto-Refresh Toggle Button */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "px-3 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm",
              autoRefresh
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
            )}
          >
            <Radio className={cn("w-3.5 h-3.5", autoRefresh ? "text-emerald-400 animate-pulse" : "")} />
            <span>Auto Refresh (15s): <strong>{autoRefresh ? "ON" : "OFF"}</strong></span>
          </button>

          {/* Workforce Planning DSS Link */}
          <Link
            href="/admin/operations/workforce-planning"
            className="px-3.5 py-2 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>วางแผนกำลังคน (DSS) →</span>
          </Link>

          {/* Ask SmartJeff AI Copilot Link */}
          <Link
            href="/admin/executive/copilot"
            className="px-3.5 py-2 rounded-2xl bg-brand-500/25 hover:bg-brand-500/40 border border-brand-500/40 text-brand-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Bot className="w-3.5 h-3.5 text-cyan-300" />
            <span>Ask SmartJeff AI →</span>
          </Link>

          {/* Manual Refresh Button */}
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md disabled:opacity-50"
            title="รีเฟรชข้อมูลเดี๋ยวนี้"
          >
            <RefreshCw className={cn("w-4 h-4", isRefetching ? "animate-spin" : "")} />
          </button>
        </div>
      </div>

      {/* Initial Loading Skeleton */}
      {isLoading && !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse"
              />
            ))}
          </div>
          <div className="h-[500px] rounded-3xl bg-slate-900 border border-slate-800 animate-pulse" />
        </div>
      ) : data ? (
        <>
          {/* 1. Executive KPI Summary Cards */}
          <ExecutiveKpiCards summary={data.summary} />

          {/* 2. Main Live Map and Alerts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Map Canvas (8 cols on desktop) */}
            <div className="lg:col-span-8">
              <ExecutiveLiveMap
                sites={data.sites}
                selectedSite={selectedSite}
                onSelectSite={(site) => setSelectedSite(site)}
              />
            </div>

            {/* Operations Alerts Panel (4 cols on desktop) */}
            <div className="lg:col-span-4">
              <OperationsAlertPanel
                alerts={data.alerts}
                onSelectSite={(siteId) => {
                  const target = data.sites.find((s) => s.id === siteId);
                  if (target) setSelectedSite(target);
                }}
              />
            </div>
          </div>

          {/* 3. Site Workforce Summary Table */}
          <SiteWorkforceTable
            sites={data.sites}
            onSelectSite={(site) => setSelectedSite(site)}
          />

          {/* 4. Slide-out Site Detail Drawer / Bottom Sheet */}
          <SiteDetailDrawer
            site={selectedSite}
            onClose={() => setSelectedSite(null)}
            dateStr={selectedDate || data.date}
          />
        </>
      ) : null}
    </div>
  );
}
