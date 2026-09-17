"use client";

import {
  Building2,
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  Clock,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkforcePlanningKpiCardsProps {
  summary: {
    totalSites: number;
    understaffedSites: number;
    criticalSites: number;
    optimalSites: number;
    overstaffedSites: number;
    totalWorkforceGap: number;
    availableSurplus: number;
    supervisorGaps: number;
    otRiskSites: number;
  };
  className?: string;
}

export function WorkforcePlanningKpiCards({ summary, className }: WorkforcePlanningKpiCardsProps) {
  const cards = [
    {
      id: "totalSites",
      title: "ไซต์งานทั้งหมด",
      value: summary.totalSites,
      unit: "แห่ง",
      subtext: `Optimal ${summary.optimalSites} แห่ง`,
      icon: Building2,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      id: "criticalSites",
      title: "วิกฤต (Critical Shortage)",
      value: summary.criticalSites,
      unit: "แห่ง",
      subtext: "ต่ำกว่า Minimum Workforce",
      icon: ShieldAlert,
      color: "text-rose-400 font-black",
      bg: "bg-rose-500/15 border-rose-500/30 ring-1 ring-rose-500/20",
    },
    {
      id: "understaffedSites",
      title: "ไซต์ที่ขาดคน (Understaffed)",
      value: summary.understaffedSites,
      unit: "แห่ง",
      subtext: "ต่ำกว่า Target ที่กำหนด",
      icon: TrendingDown,
      color: "text-amber-400 font-bold",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      id: "overstaffedSites",
      title: "ไซต์ที่มีคนเกิน (Overstaffed)",
      value: summary.overstaffedSites,
      unit: "แห่ง",
      subtext: `มีคนเกินรวม ${summary.availableSurplus} คน`,
      icon: TrendingUp,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
    },
    {
      id: "optimalSites",
      title: "ไซต์กำลังคนพอดี (Optimal)",
      value: summary.optimalSites,
      unit: "แห่ง",
      subtext: "ตรงตาม Target",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "totalWorkforceGap",
      title: "กำลังคนที่ขาดรวม (Total Gap)",
      value: summary.totalWorkforceGap > 0 ? `-${summary.totalWorkforceGap}` : "0",
      unit: "คน",
      subtext: "ต้องการเสริมกำลังพล",
      icon: Users,
      color: summary.totalWorkforceGap > 0 ? "text-rose-400 font-black" : "text-slate-400",
      bg: summary.totalWorkforceGap > 0 ? "bg-rose-500/10 border-rose-500/20" : "bg-slate-800/40 border-slate-700/40",
    },
    {
      id: "availableSurplus",
      title: "กำลังพลสำรองที่เกลี่ยได้ (Surplus)",
      value: `+${summary.availableSurplus}`,
      unit: "คน",
      subtext: "จากไซต์ที่มีคนเกิน",
      icon: UserCheck,
      color: "text-emerald-400 font-bold",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "supervisorGaps",
      title: "ขาด Supervisor",
      value: summary.supervisorGaps,
      unit: "แห่ง",
      subtext: "ไม่มีหัวหน้างานประจำ",
      icon: AlertTriangle,
      color: summary.supervisorGaps > 0 ? "text-amber-400 font-bold" : "text-slate-400",
      bg: summary.supervisorGaps > 0 ? "bg-amber-500/15 border-amber-500/30" : "bg-slate-800/40 border-slate-700/40",
    },
    {
      id: "otRiskSites",
      title: "ไซต์เสี่ยง OT สูง (> 30%)",
      value: summary.otRiskSites,
      unit: "แห่ง",
      subtext: "พนักงานทำงานหนักต่อเนื่อง",
      icon: Clock,
      color: summary.otRiskSites > 0 ? "text-indigo-400 font-bold" : "text-slate-400",
      bg: summary.otRiskSites > 0 ? "bg-indigo-500/15 border-indigo-500/30" : "bg-slate-800/40 border-slate-700/40",
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3", className)}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={cn(
              "flex flex-col justify-between p-3.5 rounded-2xl border backdrop-blur-md transition-all shadow-md hover:scale-[1.02]",
              card.bg
            )}
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-semibold text-slate-400 truncate">{card.title}</span>
              <Icon className={cn("w-4 h-4 shrink-0", card.color)} />
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className={cn("text-xl font-black tracking-tight", card.color)}>{card.value}</span>
                <span className="text-[10px] text-slate-500 font-medium">{card.unit}</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-1">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
