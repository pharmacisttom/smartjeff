"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Users,
  ChevronRight,
  MapPin,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteSummaryData } from "@/server/services/executive-operations.service";

interface SiteWorkforceTableProps {
  sites: SiteSummaryData[];
  onSelectSite: (site: SiteSummaryData) => void;
  className?: string;
}

export function SiteWorkforceTable({
  sites,
  onSelectSite,
  className,
}: SiteWorkforceTableProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"name" | "assigned" | "working" | "utilization">("utilization");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const matchSearch =
        site.name.toLowerCase().includes(search.toLowerCase()) ||
        site.code.toLowerCase().includes(search.toLowerCase()) ||
        (site.location && site.location.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      if (filterStatus === "ACTIVE") return site.status === "ACTIVE";
      if (filterStatus === "LOW_STAFF") return site.status === "LOW_STAFF";
      if (filterStatus === "EMPTY") return site.status === "EMPTY";
      if (filterStatus === "OT") return site.flags.otActive;
      if (filterStatus === "ALERT") return site.flags.alert;

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
      } else if (sortBy === "assigned") {
        valA = a.assignedEmployees;
        valB = b.assignedEmployees;
      } else if (sortBy === "working") {
        valA = a.working;
        valB = b.working;
      } else {
        valA = a.utilization;
        valB = b.utilization;
      }

      return sortAsc ? valA - valB : valB - valA;
    });
  }, [filteredSites, sortBy, sortAsc]);

  const totalPages = Math.ceil(sortedSites.length / pageSize) || 1;
  const paginatedSites = sortedSites.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (col: "name" | "assigned" | "working" | "utilization") => {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(false);
    }
  };

  const formatTime = (iso?: string | null) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.";
    } catch {
      return "-";
    }
  };

  return (
    <div
      className={cn(
        "bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4",
        className
      )}
    >
      {/* Table Top Controls: Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-400" />
            <span>ภาพรวมกำลังคนรายไซต์ (Site Workforce Overview)</span>
          </h3>
          <p className="text-xs text-slate-400">
            แสดงข้อมูลสถานะและกำลังพลประจำแต่ละไซต์งาน ({filteredSites.length} จาก {sites.length} ไซต์)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัสไซต์, ที่ตั้ง..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 w-52 sm:w-60"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-[11px] font-bold overflow-x-auto">
            {[
              { key: "ALL", label: "ทั้งหมด" },
              { key: "ACTIVE", label: "ปกติ" },
              { key: "LOW_STAFF", label: "คนน้อย" },
              { key: "EMPTY", label: "ว่าง" },
              { key: "OT", label: "OT" },
              { key: "ALERT", label: "Alert" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setFilterStatus(f.key);
                  setPage(1);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all whitespace-nowrap",
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

      {/* Table View */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-bold select-none">
              <th
                onClick={() => toggleSort("name")}
                className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>ไซต์งาน (Site)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("assigned")}
                className="py-3 px-2 text-center cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>ประจำ</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("working")}
                className="py-3 px-2 text-center cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>ทำงาน</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-2 text-center">สาย</th>
              <th className="py-3 px-2 text-center">ลา</th>
              <th className="py-3 px-2 text-center">ยังไม่ลงเวลา</th>
              <th className="py-3 px-2 text-center">OT</th>
              <th
                onClick={() => toggleSort("utilization")}
                className="py-3 px-3 cursor-pointer hover:text-white transition-colors min-w-[140px]"
              >
                <div className="flex items-center gap-1">
                  <span>Utilization</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-2 text-center">สถานะ</th>
              <th className="py-3 px-3 text-right">Check-in ล่าสุด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedSites.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500">
                  ไม่พบข้อมูลไซต์งานที่ตรงกับเงื่อนไขค้นหา
                </td>
              </tr>
            ) : (
              paginatedSites.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => onSelectSite(s)}
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                >
                  {/* Site Name & Code */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-brand-300 border border-slate-700">
                        {s.code}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-white group-hover:text-brand-300 transition-colors truncate max-w-[200px]">
                          {s.name}
                        </div>
                        {s.location && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {s.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Assigned */}
                  <td className="py-3 px-2 text-center font-bold text-slate-300">
                    {s.assignedEmployees}
                  </td>

                  {/* Working */}
                  <td className="py-3 px-2 text-center font-black text-emerald-400">
                    {s.working}
                  </td>

                  {/* Late */}
                  <td className="py-3 px-2 text-center font-medium text-amber-400">
                    {s.late > 0 ? s.late : "-"}
                  </td>

                  {/* Leave */}
                  <td className="py-3 px-2 text-center font-medium text-purple-400">
                    {s.leave > 0 ? s.leave : "-"}
                  </td>

                  {/* Absent */}
                  <td className="py-3 px-2 text-center font-medium text-slate-400">
                    {s.absent > 0 ? s.absent : "-"}
                  </td>

                  {/* OT */}
                  <td className="py-3 px-2 text-center font-medium text-cyan-400">
                    {s.ot > 0 ? s.ot : "-"}
                  </td>

                  {/* Utilization Progress */}
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-300">{s.utilization}%</span>
                        <span className="text-slate-500">
                          {s.working}/{s.assignedEmployees}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            s.utilization >= 80
                              ? "bg-emerald-500"
                              : s.utilization >= 50
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          )}
                          style={{ width: `${s.utilization}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-2 text-center">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap",
                        s.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : s.status === "LOW_STAFF"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : s.status === "EMPTY"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : s.status === "OT_ACTIVE"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          : "bg-rose-500 text-white"
                      )}
                    >
                      {s.status}
                    </span>
                  </td>

                  {/* Last Check-in */}
                  <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {formatTime(s.lastCheckIn)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
          <div>
            หน้า {page} จาก {totalPages} ({filteredSites.length} รายการ)
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              ก่อนหน้า
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
