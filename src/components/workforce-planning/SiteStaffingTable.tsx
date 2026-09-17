"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Users,
  ChevronRight,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteStaffingSummary } from "@/server/services/workforce-planning.service";

interface SiteStaffingTableProps {
  sites: SiteStaffingSummary[];
  selectedSite: SiteStaffingSummary | null;
  onSelectSite: (site: SiteStaffingSummary) => void;
  className?: string;
}

export function SiteStaffingTable({
  sites,
  selectedSite,
  onSelectSite,
  className,
}: SiteStaffingTableProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"name" | "gap" | "working" | "target" | "risk">("gap");
  const [sortAsc, setSortAsc] = useState(true); // default shortage first
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const matchSearch =
        site.name.toLowerCase().includes(search.toLowerCase()) ||
        site.code.toLowerCase().includes(search.toLowerCase()) ||
        (site.location && site.location.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      if (filterStatus === "UNDERSTAFFED") {
        return site.status === "UNDERSTAFFED" || site.status === "CRITICAL_SHORTAGE";
      }
      if (filterStatus === "CRITICAL") {
        return site.status === "CRITICAL_SHORTAGE" || site.riskLevel === "CRITICAL";
      }
      if (filterStatus === "OPTIMAL") return site.status === "OPTIMAL";
      if (filterStatus === "OVERSTAFFED") return site.status === "OVERSTAFFED";
      if (filterStatus === "NO_SUPERVISOR") {
        return site.requiresSupervisor && !site.supervisorPresent;
      }
      if (filterStatus === "HIGH_OT") {
        return site.working > 0 && site.ot / site.working >= 0.3;
      }

      return true;
    });
  }, [sites, search, filterStatus]);

  const sortedSites = useMemo(() => {
    return [...filteredSites].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortBy === "name") {
        valA = a.name;
        valB = b.name;
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (sortBy === "working") {
        valA = a.working;
        valB = b.working;
      } else if (sortBy === "target") {
        valA = a.target;
        valB = b.target;
      } else if (sortBy === "risk") {
        const riskRank: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        valA = riskRank[a.riskLevel] || 0;
        valB = riskRank[b.riskLevel] || 0;
      } else {
        // gap
        valA = a.gap;
        valB = b.gap;
      }

      return sortAsc ? valA - valB : valB - valA;
    });
  }, [filteredSites, sortBy, sortAsc]);

  const totalPages = Math.ceil(sortedSites.length / pageSize) || 1;
  const paginatedSites = sortedSites.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (col: "name" | "gap" | "working" | "target" | "risk") => {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(col === "gap"); // for gap, start with ascending (most negative first)
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3" />
            CRITICAL
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            HIGH
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: string, gap: number) => {
    if (status === "CRITICAL_SHORTAGE") {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-600/30 text-rose-300 border border-rose-500/40">
          วิกฤต ({gap})
        </span>
      );
    }
    if (status === "UNDERSTAFFED") {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          ขาดคน ({gap})
        </span>
      );
    }
    if (status === "OVERSTAFFED") {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          คนเกิน (+{gap})
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        พอดี (Optimal)
      </span>
    );
  };

  return (
    <div className={cn("bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4", className)}>
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-400" />
            <span>ตารางวิเคราะห์กำลังพลและความเสี่ยงรายไซต์ (Site Staffing & Gap Analysis)</span>
          </h3>
          <p className="text-xs text-slate-400">
            วิเคราะห์เปรียบเทียบกำลังคนทำงานจริงกับเป้าหมาย (Target) และเกณฑ์ขั้นต่ำ (Minimum)
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-56 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อไซต์, รหัส, ที่ตั้ง..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-brand-500"
            />
          </div>

          {/* Filter Status Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
            {[
              { key: "ALL", label: "ทั้งหมด" },
              { key: "UNDERSTAFFED", label: "ขาดคน" },
              { key: "CRITICAL", label: "วิกฤต" },
              { key: "OPTIMAL", label: "พอดี" },
              { key: "OVERSTAFFED", label: "คนเกิน" },
              { key: "NO_SUPERVISOR", label: "ขาด Sup" },
              { key: "HIGH_OT", label: "เสี่ยง OT" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setFilterStatus(f.key);
                  setPage(1);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition-all",
                  filterStatus === f.key
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Canvas */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => toggleSort("name")}>
                <div className="flex items-center gap-1">
                  <span>ไซต์งาน (Site)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-2 text-center">ขั้นต่ำ (Min)</th>
              <th className="py-3 px-2 text-center cursor-pointer hover:text-white" onClick={() => toggleSort("target")}>
                <div className="flex items-center justify-center gap-1">
                  <span>เป้าหมาย (Target)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-2 text-center cursor-pointer hover:text-white" onClick={() => toggleSort("working")}>
                <div className="flex items-center justify-center gap-1">
                  <span>กำลังทำงาน</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-2 text-center">ลา</th>
              <th className="py-3 px-2 text-center">OT</th>
              <th className="py-3 px-3 text-center cursor-pointer hover:text-white" onClick={() => toggleSort("gap")}>
                <div className="flex items-center justify-center gap-1">
                  <span>ส่วนต่าง (Gap)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-2 text-center">Supervisor</th>
              <th className="py-3 px-3 text-center cursor-pointer hover:text-white" onClick={() => toggleSort("risk")}>
                <div className="flex items-center justify-center gap-1">
                  <span>ระดับความเสี่ยง</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">สถานะ</th>
              <th className="py-3 px-2 text-right">ดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {paginatedSites.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-500 font-medium">
                  ไม่พบข้อมูลไซต์งานที่ตรงกับเงื่อนไขการค้นหา
                </td>
              </tr>
            ) : (
              paginatedSites.map((site) => {
                const isSelected = selectedSite?.id === site.id;
                return (
                  <tr
                    key={site.id}
                    onClick={() => onSelectSite(site)}
                    className={cn(
                      "hover:bg-slate-800/50 transition-colors cursor-pointer group",
                      isSelected && "bg-brand-950/40 border-l-4 border-l-brand-500"
                    )}
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-white group-hover:text-brand-300 transition-colors">
                        {site.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {site.code} {site.location ? `• ${site.location}` : ""}
                      </div>
                    </td>

                    <td className="py-3 px-2 text-center font-mono font-medium text-slate-300">
                      {site.minimum}
                    </td>

                    <td className="py-3 px-2 text-center font-mono font-bold text-white">
                      {site.target}
                    </td>

                    <td className="py-3 px-2 text-center font-mono font-bold text-emerald-400">
                      {site.working}
                    </td>

                    <td className="py-3 px-2 text-center font-mono text-purple-300">
                      {site.leave > 0 ? site.leave : "-"}
                    </td>

                    <td className="py-3 px-2 text-center font-mono text-cyan-300">
                      {site.ot > 0 ? site.ot : "-"}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-black text-xs">
                      <span
                        className={cn(
                          site.gap < 0 ? "text-rose-400" : site.gap > 0 ? "text-cyan-400" : "text-emerald-400"
                        )}
                      >
                        {site.gap > 0 ? `+${site.gap}` : site.gap}
                      </span>
                    </td>

                    <td className="py-3 px-2 text-center">
                      {site.requiresSupervisor ? (
                        site.supervisorPresent ? (
                          <span className="text-emerald-400 text-xs font-bold" title="มี Supervisor ลงเวลา">✓ มี</span>
                        ) : (
                          <span className="text-rose-400 text-xs font-black animate-pulse" title="ไม่มี Supervisor">⚠️ ขาด</span>
                        )
                      ) : (
                        <span className="text-slate-500 text-xs">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">{getRiskBadge(site.riskLevel)}</td>

                    <td className="py-3 px-3 text-center">{getStatusBadge(site.status, site.gap)}</td>

                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSite(site);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-brand-600 text-slate-300 hover:text-white transition-all text-[11px] font-bold"
                      >
                        วางแผน →
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
        <div>
          แสดง <strong>{paginatedSites.length}</strong> จาก <strong>{sortedSites.length}</strong> ไซต์
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
          >
            ย้อนกลับ
          </button>
          <span className="px-2 text-white font-mono">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}
