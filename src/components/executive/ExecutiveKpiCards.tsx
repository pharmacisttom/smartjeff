"use client";

import {
  Building2,
  Users,
  Briefcase,
  Clock,
  CalendarOff,
  UserX,
  Zap,
  AlertTriangle,
  Home,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExecutiveKpiCardsProps {
  summary: {
    totalSites: number;
    activeSites: number;
    emptySites: number;
    alertSites: number;
    totalEmployees: number;
    working: number;
    late: number;
    leave: number;
    absent: number;
    ot: number;
  };
  className?: string;
}

export function ExecutiveKpiCards({ summary, className }: ExecutiveKpiCardsProps) {
  const cards = [
    {
      id: "totalSites",
      title: "ไซต์งานทั้งหมด",
      value: summary.totalSites,
      unit: "แห่ง",
      subtext: `Active ${summary.activeSites} แห่ง`,
      icon: Building2,
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      id: "activeSites",
      title: "ไซต์ที่กำลังปฏิบัติงาน",
      value: summary.activeSites,
      unit: "แห่ง",
      subtext: summary.totalSites > 0 ? `${Math.round((summary.activeSites / summary.totalSites) * 100)}% ของไซต์ทั้งหมด` : "0%",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "totalEmployees",
      title: "พนักงานประจำไซต์",
      value: summary.totalEmployees,
      unit: "คน",
      subtext: "กำลังพลทั้งหมดในระบบ",
      icon: Users,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      id: "working",
      title: "กำลังทำงาน (Working)",
      value: summary.working,
      unit: "คน",
      subtext: summary.totalEmployees > 0 ? `${Math.round((summary.working / summary.totalEmployees) * 100)}% Utilization` : "0%",
      icon: Briefcase,
      color: "text-emerald-400 font-bold",
      bg: "bg-emerald-500/15 border-emerald-500/30 ring-1 ring-emerald-500/20",
    },
    {
      id: "absent",
      title: "ยังไม่ลงเวลา (Absent)",
      value: summary.absent,
      unit: "คน",
      subtext: "ยังไม่มี Check-in วันนี้",
      icon: UserX,
      color: "text-slate-400",
      bg: "bg-slate-800/40 border-slate-700/40",
    },
    {
      id: "late",
      title: "มาสาย (Late)",
      value: summary.late,
      unit: "คน",
      subtext: "เกินเวลาเข้างาน > 15 นาที",
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      id: "leave",
      title: "พนักงานลา (Leave)",
      value: summary.leave,
      unit: "คน",
      subtext: "ใบลาอนุมัติแล้ว",
      icon: CalendarOff,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      id: "ot",
      title: "กำลังทำ OT",
      value: summary.ot,
      unit: "คน",
      subtext: "Active OT ตอนนี้",
      icon: Zap,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
    },
    {
      id: "emptySites",
      title: "ไซต์ไม่มีพนักงาน",
      value: summary.emptySites,
      unit: "แห่ง",
      subtext: "ไม่มีการลงเวลาทำงาน",
      icon: Home,
      color: summary.emptySites > 0 ? "text-rose-500 font-bold" : "text-slate-400",
      bg: summary.emptySites > 0 ? "bg-rose-500/10 border-rose-500/30" : "bg-slate-800/30 border-slate-700/30",
    },
    {
      id: "alertSites",
      title: "ไซต์ที่มี Alert",
      value: summary.alertSites,
      unit: "แห่ง",
      subtext: "มีความผิดปกติหน้างาน",
      icon: AlertTriangle,
      color: summary.alertSites > 0 ? "text-amber-400 font-bold" : "text-slate-400",
      bg: summary.alertSites > 0 ? "bg-amber-500/15 border-amber-500/30 ring-1 ring-amber-500/20" : "bg-slate-800/30 border-slate-700/30",
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3", className)}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={cn(
              "p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between select-none shadow-sm hover:shadow-md",
              card.bg
            )}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-semibold text-slate-300 truncate tracking-tight">
                {card.title}
              </span>
              <Icon className={cn("w-4 h-4 shrink-0", card.color)} />
            </div>

            <div className="flex items-baseline gap-1.5 my-0.5">
              <span className={cn("text-2xl font-black tracking-tight", card.color)}>
                {card.value.toLocaleString()}
              </span>
              <span className="text-[11px] font-medium text-slate-400">{card.unit}</span>
            </div>

            <div className="text-[10px] text-slate-400 font-medium truncate">
              {card.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
}
