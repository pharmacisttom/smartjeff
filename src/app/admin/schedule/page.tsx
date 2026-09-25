"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Clock,
  Users,
  Building2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  ArrowRightLeft,
  UserPlus,
  Download,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Printer,
  Info,
  Phone,
  ShieldAlert,
  MapPin,
  RefreshCw,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showConfirm } from "@/lib/swal";

interface DayMeta {
  day: number;
  dateStr: string;
  dayOfWeek: number;
  weekNumber: number;
}

interface ShiftInfo {
  id?: string;
  dayNum: number;
  shiftType: string; // DAY, OT, OFF, LEAVE, RELIEF
  workHours: number;
  otHours: number;
  totalHours: number;
  isRelief?: boolean;
  assignedSiteId?: string;
  assignedSiteName?: string;
  homeSiteName?: string;
  note?: string | null;
}

interface ScheduledEmployee {
  id: string;
  code: string;
  prefix: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string;
  phone: string | null;
  nationality: string;
  siteId: string;
  site?: { id: string; code: string; name: string };
  isHomeSite: boolean;
  shifts: Record<number, ShiftInfo>;
  w1Hours: number;
  w2Hours: number;
  w3Hours: number;
  w4Hours: number;
  w5Hours: number;
  totalHours: number;
  otHours: number;
  workingDays: number;
}

interface SiteOption {
  id: string;
  code: string;
  name: string;
  estateName?: string | null;
  workStart: number;
  workEnd: number;
  otStart?: number | null;
  otEnd?: number | null;
  _count: { employees: number };
}

interface DailyStat {
  scheduledCount: number;
  reliefCount: number;
  offCount: number;
  leaveCount: number;
  staffNames: string[];
  reliefStaff: { name: string; homeSite: string }[];
}

const THAI_DAY_NAMES = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const THAI_FULL_DAY_NAMES = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];

export default function AdminWorkforceSchedulePage() {
  // Navigation & Filter States
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    // Default to Sep 2026 or current date
    return new Date(2026, 8, 1);
  });
  const [activeTab, setActiveTab] = useState<"ROSTER" | "CALENDAR">("ROSTER");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Data States
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [activeSite, setActiveSite] = useState<SiteOption | null>(null);
  const [employees, setEmployees] = useState<ScheduledEmployee[]>([]);
  const [days, setDays] = useState<DayMeta[]>([]);
  const [dailyStats, setDailyStats] = useState<Record<number, DailyStat>>({});
  const [summary, setSummary] = useState<any>(null);

  // Modals
  const [showReliefModal, setShowReliefModal] = useState(false);
  const [showAutoGenerateModal, setShowAutoGenerateModal] = useState(false);
  const [showCellEditModal, setShowCellEditModal] = useState(false);

  // Relief Modal States
  const [reliefDateStr, setReliefDateStr] = useState<string>("");
  const [reliefReason, setReliefReason] = useState("ทดแทนพนักงานขาดงาน");
  const [reliefWorkersList, setReliefWorkersList] = useState<any[]>([]);
  const [selectedReliefWorkerId, setSelectedReliefWorkerId] = useState("");
  const [loadingReliefWorkers, setLoadingReliefWorkers] = useState(false);
  const [submittingRelief, setSubmittingRelief] = useState(false);

  // Cell Edit Modal States
  const [editingCell, setEditingCell] = useState<{
    employeeId: string;
    employeeName: string;
    dayNum: number;
    dateStr: string;
    shiftType: string;
    workHours: number;
    otHours: number;
    note: string;
  } | null>(null);

  // Auto-generate Form States
  const [autoGenSaturday, setAutoGenSaturday] = useState(true);
  const [autoGenOt, setAutoGenOt] = useState(false);
  const [autoGenOverwrite, setAutoGenOverwrite] = useState(false);
  const [submittingAutoGen, setSubmittingAutoGen] = useState(false);

  // Format YYYY-MM
  const monthKey = useMemo(() => {
    const y = currentMonthDate.getFullYear();
    const m = String(currentMonthDate.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, [currentMonthDate]);

  // Advance Month Buttons (Current + 3 Months Ahead)
  const advanceMonthOptions = useMemo(() => {
    const base = new Date(2026, 8, 1); // 2026-09 base
    return [0, 1, 2, 3].map((offset) => {
      const d = new Date(base.getFullYear(), base.getMonth() + offset, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const key = `${y}-${m}`;
      const label = d.toLocaleDateString("th-TH", { month: "short", year: "numeric" });
      const badge = offset === 0 ? "เดือนนี้" : `+${offset} ด.`;
      return { date: d, key, label, badge, offset };
    });
  }, []);

  // Fetch Schedule Data
  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("month", monthKey);
      if (selectedSiteId) params.set("siteId", selectedSiteId);

      const res = await fetch(`/api/schedule?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setSites(data.sites || []);
        setActiveSite(data.activeSite || null);
        if (!selectedSiteId && data.activeSite?.id) {
          setSelectedSiteId(data.activeSite.id);
        }
        setEmployees(data.employees || []);
        setDays(data.days || []);
        setDailyStats(data.dailyStats || {});
        setSummary(data.summary || null);
      } else {
        showError(data.message || "ไม่สามารถโหลดข้อมูลตารางกะได้");
      }
    } catch (e: any) {
      console.error(e);
      showError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  }, [monthKey, selectedSiteId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Navigate Previous / Next Month
  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Open Relief Modal
  const handleOpenReliefModal = async (dateStr?: string) => {
    const targetDate = dateStr || days[0]?.dateStr || `${monthKey}-01`;
    setReliefDateStr(targetDate);
    setSelectedReliefWorkerId("");
    setShowReliefModal(true);

    try {
      setLoadingReliefWorkers(true);
      const res = await fetch(`/api/schedule/available-relief-workers?targetSiteId=${selectedSiteId}&date=${targetDate}`);
      const data = await res.json();
      if (res.ok) {
        setReliefWorkersList(data.workers || []);
        if (data.workers && data.workers[0]) {
          setSelectedReliefWorkerId(data.workers[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReliefWorkers(false);
    }
  };

  // Submit Relief Worker
  const handleSubmitRelief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReliefWorkerId || !selectedSiteId || !reliefDateStr) {
      showError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      setSubmittingRelief(true);
      const res = await fetch("/api/schedule/relief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedReliefWorkerId,
          targetSiteId: selectedSiteId,
          dateStr: reliefDateStr,
          shiftType: "RELIEF",
          workHours: 8,
          otHours: 1.5,
          reason: reliefReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showSuccess("ส่งกำลังเสริมสำเร็จ!", data.message);
        setShowReliefModal(false);
        fetchSchedule();
      } else {
        showError(data.message || "ไม่สามารถเสริมกำลังคนได้");
      }
    } catch (e: any) {
      showError(e.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSubmittingRelief(false);
    }
  };

  // Submit Auto-Generate
  const handleSubmitAutoGen = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingAutoGen(true);
      const res = await fetch("/api/schedule/auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: selectedSiteId,
          month: monthKey,
          includeSaturdayWork: autoGenSaturday,
          includeOt: autoGenOt,
          overwrite: autoGenOverwrite,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showSuccess("สร้างตารางกะสำเร็จ!", data.message);
        setShowAutoGenerateModal(false);
        fetchSchedule();
      } else {
        showError(data.message || "ไม่สามารถสร้างตารางกะได้");
      }
    } catch (e: any) {
      showError(e.message || "เกิดข้อผิดพลาดในการสร้างตาราง");
    } finally {
      setSubmittingAutoGen(false);
    }
  };

  // Click Cell to Quick Edit
  const handleCellClick = (emp: ScheduledEmployee, day: DayMeta) => {
    const existing = emp.shifts[day.day];
    setEditingCell({
      employeeId: emp.id,
      employeeName: emp.fullName,
      dayNum: day.day,
      dateStr: day.dateStr,
      shiftType: existing ? existing.shiftType : "DAY",
      workHours: existing ? existing.workHours : 8,
      otHours: existing ? existing.otHours : 0,
      note: existing?.note || "",
    });
    setShowCellEditModal(true);
  };

  // Submit Cell Quick Edit
  const handleSaveCell = async (shiftType: string, workHours: number, otHours: number) => {
    if (!editingCell) return;
    try {
      const res = await fetch("/api/schedule/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: editingCell.employeeId,
          dateStr: editingCell.dateStr,
          shiftType,
          siteId: selectedSiteId,
          workHours,
          otHours,
          note: editingCell.note,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowCellEditModal(false);
        fetchSchedule();
      } else {
        showError(data.message || "ไม่สามารถแก้ไขกะได้");
      }
    } catch (e: any) {
      showError(e.message || "เกิดข้อผิดพลาด");
    }
  };

  // Filtered employees by search
  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q)
    );
  }, [employees, search]);

  return (
    <div className="max-w-[1500px] mx-auto space-y-6 pb-24 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-800/40">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold uppercase tracking-widest">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Smart Workforce Roster (J2K Housekeeping)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            ระบบจัดกำลังคนล่วงหน้ารายเดือน & ชั่วโมงทำงาน
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-3xl leading-relaxed">
            วางแผนจัดกะล่วงหน้า 3 เดือน ติดตามชั่วโมงทำงานรายสัปดาห์ (Week 1 - 5) และบริหารการยืมตัวเสริมกำลังคนข้ามโรงงานเมื่อมีพนักงานขาดหรือลา
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Cross-site Relief Button */}
          <button
            onClick={() => handleOpenReliefModal()}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-4 py-2.5 rounded-2xl shadow-lg transition-all active:scale-95 text-xs cursor-pointer border border-purple-400/30"
            title="ยืมตัวพนักงานจากโรงงานอื่นมาเสริมทัพ"
          >
            <ArrowRightLeft className="w-4 h-4 text-purple-200" />
            <span>+ เสริมพนักงานข้ามโรงงาน</span>
          </button>

          {/* Auto-Generate Button */}
          <button
            onClick={() => setShowAutoGenerateModal(true)}
            className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-4 py-2.5 rounded-2xl shadow-md transition-all active:scale-95 text-xs cursor-pointer backdrop-blur-sm"
            title="สร้างตารางกะทั้งเดือนอัตโนมัติ"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>สร้างตารางอัตโนมัติ</span>
          </button>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 bg-white text-slate-900 font-bold px-4 py-2.5 rounded-2xl hover:bg-slate-100 shadow-md transition-all active:scale-95 text-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-700" />
            <span>พิมพ์ตาราง</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Factory Selector & 3-Month Planning Tabs */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-surface-card border border-surface-border p-4 rounded-3xl shadow-sm">
        {/* Factory Dropdown */}
        <div className="flex items-center space-x-2 w-full lg:w-96">
          <Building2 className="w-5 h-5 text-brand-600 shrink-0" />
          <div className="flex-1">
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-surface-border bg-surface-subtle text-content-primary text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name} ({s._count.employees} คน)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3-Month Advance Planning Navigation Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-border text-content-secondary cursor-pointer transition-colors"
            title="เดือนก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {advanceMonthOptions.map((opt) => {
            const isSelected = opt.key === monthKey;
            return (
              <button
                key={opt.key}
                onClick={() => setCurrentMonthDate(opt.date)}
                className={cn(
                  "flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  isSelected
                    ? "bg-brand-600 text-white shadow-md ring-2 ring-brand-500/30 scale-102"
                    : "bg-surface-subtle hover:bg-surface-border text-content-primary"
                )}
              >
                <span>{opt.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    isSelected ? "bg-white/20 text-white" : "bg-surface-border text-content-muted"
                  )}
                >
                  {opt.badge}
                </span>
              </button>
            );
          })}

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-border text-content-secondary cursor-pointer transition-colors"
            title="เดือนถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* View Switcher & Search */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center bg-surface-subtle p-1 rounded-2xl border border-surface-border">
            <button
              onClick={() => setActiveTab("ROSTER")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                activeTab === "ROSTER" ? "bg-surface-card text-brand-600 shadow-xs" : "text-content-muted hover:text-content-primary"
              )}
            >
              ตารางจัดกะรายบุคคล
            </button>
            <button
              onClick={() => setActiveTab("CALENDAR")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                activeTab === "CALENDAR" ? "bg-surface-card text-brand-600 shadow-xs" : "text-content-muted hover:text-content-primary"
              )}
            >
              ปฏิทินโรงงาน
            </button>
          </div>

          <div className="relative w-44 hidden md:block">
            <Search className="w-3.5 h-3.5 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-surface-border bg-surface-subtle text-content-primary outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Weekly Hours & Staffing Analytics Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-surface-card border border-surface-border p-4 rounded-3xl space-y-1 shadow-sm">
            <span className="text-xs text-content-muted font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-600" />
              ชั่วโมงรวมทั้งเดือน
            </span>
            <p className="text-2xl font-black text-content-primary">{summary.totalScheduledHours} ชม.</p>
            <span className="text-[11px] text-content-muted">เฉลี่ย ~{summary.averageWeeklyHours} ชม./คน/สัปดาห์</span>
          </div>

          <div className="bg-surface-card border border-surface-border p-4 rounded-3xl space-y-1 shadow-sm">
            <span className="text-xs text-content-muted font-bold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              ชั่วโมงโอทีสะสม (OT)
            </span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{summary.totalOtHours} ชม.</p>
            <span className="text-[11px] text-amber-600 font-medium">กะพิเศษและงานเร่งด่วน</span>
          </div>

          <div className="bg-surface-card border border-surface-border p-4 rounded-3xl space-y-1 shadow-sm">
            <span className="text-xs text-content-muted font-bold flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              พนักงานประจำไซต์
            </span>
            <p className="text-2xl font-black text-content-primary">{summary.homeStaffCount} คน</p>
            <span className="text-[11px] text-emerald-600 font-medium">สังกัดโรงงานนี้โดยตรง</span>
          </div>

          <div className="bg-surface-card border border-surface-border p-4 rounded-3xl space-y-1 shadow-sm">
            <span className="text-xs text-content-muted font-bold flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-purple-600" />
              พนักงานยืมตัวเสริมทัพ
            </span>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{summary.reliefStaffCount} คน</p>
            <span className="text-[11px] text-purple-600 font-medium">เสริมจากโรงงานอื่น</span>
          </div>

          <div className="bg-surface-card border border-surface-border p-4 rounded-3xl space-y-1 shadow-sm col-span-2 md:col-span-1">
            <span className="text-xs text-content-muted font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              สถานะอัตรากำลังคน
            </span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">พร้อมปฏิบัติงาน</p>
            <span className="text-[11px] text-content-muted">ตารางกะได้รับการเผยแพร่</span>
          </div>
        </div>
      )}

      {/* Main Content: TAB 1 - Monthly Roster Matrix Table */}
      {activeTab === "ROSTER" && (
        <div className="bg-surface-card border border-surface-border rounded-3xl shadow-sm overflow-hidden space-y-3 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
            <div>
              <h2 className="text-base font-black text-content-primary flex items-center gap-2">
                <span>ตารางจัดกะการทำงานประจำเดือน:</span>
                <span className="text-brand-600 font-mono underline decoration-brand-500/30">
                  {currentMonthDate.toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600">
                  โรงงาน: {activeSite?.name || activeSite?.code || "ไม่ระบุ"}
                </span>
              </h2>
              <p className="text-xs text-content-muted mt-0.5">
                คลิกที่ช่องวันที่เพื่อเปลี่ยนกะการทำงาน (D=กะปกติ 8h, OT=กะโอที 9.5h, OFF=วันหยุด, LV=วันลา, SUB=ยืมตัวเสริมกำลังคน)
              </p>
            </div>

            {/* Shift Legend Badges */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <span>D</span> = ปกติ (8h)
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <span>OT</span> = กะ+โอที (9.5h)
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
                <span>OFF</span> = วันหยุด
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                <span>LV</span> = วันลา
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                <span>SUB</span> = ยืมตัวเสริมทัพ
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-content-muted animate-pulse font-medium">
              กำลังโหลดตารางกะรายเดือนและคำนวณชั่วโมงรายสัปดาห์...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-20 text-center text-content-muted space-y-3">
              <Users className="w-12 h-12 mx-auto text-content-muted/40" />
              <p className="font-bold text-base text-content-primary">ไม่พบข้อมูลพนักงานในโรงงานนี้</p>
              <p className="text-xs text-content-muted">
                สามารถคลิกปุ่ม &quot;+ เสริมพนักงานข้ามโรงงาน&quot; ด้านบน เพื่อยืมตัวพนักงานจากไซต์อื่นมาช่วยงานได้
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs">
                <thead>
                  {/* Row 1: Header Day Numbers */}
                  <tr className="border-b border-surface-border bg-surface-subtle text-[11px] font-bold text-content-muted">
                    <th className="py-2.5 px-3 text-left sticky left-0 bg-surface-subtle z-10 w-48 min-w-[190px]">
                      พนักงาน
                    </th>
                    {days.map((d) => (
                      <th
                        key={d.day}
                        className={cn(
                          "py-2 px-1 min-w-[32px]",
                          d.dayOfWeek === 0 ? "bg-rose-500/10 text-rose-600" : ""
                        )}
                      >
                        {d.day}
                      </th>
                    ))}
                    {/* Weekly Hours Headers */}
                    <th className="py-2 px-2 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 min-w-[50px]">W1</th>
                    <th className="py-2 px-2 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 min-w-[50px]">W2</th>
                    <th className="py-2 px-2 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 min-w-[50px]">W3</th>
                    <th className="py-2 px-2 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 min-w-[50px]">W4</th>
                    <th className="py-2 px-2 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 min-w-[50px]">W5</th>
                    <th className="py-2 px-3 bg-brand-500/15 text-brand-700 dark:text-brand-300 min-w-[65px] font-black">
                      รวม (ชม.)
                    </th>
                  </tr>

                  {/* Row 2: Header Day of Week */}
                  <tr className="border-b border-surface-border text-[10px] text-content-muted font-semibold bg-surface-subtle/50">
                    <th className="py-1 px-3 text-left sticky left-0 bg-surface-subtle/50 z-10">
                      (วัน จันทร์-อาทิตย์)
                    </th>
                    {days.map((d) => (
                      <th
                        key={d.day}
                        className={cn(
                          "py-1 px-1",
                          d.dayOfWeek === 0 ? "text-rose-600 font-bold" : ""
                        )}
                      >
                        {THAI_DAY_NAMES[d.dayOfWeek]}
                      </th>
                    ))}
                    <th colSpan={5} className="py-1 px-2 text-center text-indigo-600">
                      สรุปชั่วโมงทำงานแต่ละสัปดาห์
                    </th>
                    <th className="py-1 px-2 text-center text-brand-600 font-bold">โอที</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-surface-border">
                  {filteredEmployees.map((emp) => {
                    return (
                      <tr key={emp.id} className="hover:bg-surface-subtle/50 transition-colors">
                        {/* Employee Info Column */}
                        <td className="py-2.5 px-3 text-left sticky left-0 bg-surface-card hover:bg-surface-subtle/80 z-10 shadow-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1.5">
                              <p className="font-bold text-content-primary text-xs leading-tight truncate max-w-[140px]">
                                {emp.fullName}
                              </p>
                              {!emp.isHomeSite && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 shrink-0 border border-purple-500/30">
                                  ยืมตัว
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1.5 text-[10px] text-content-muted font-mono">
                              <span>{emp.code}</span>
                              <span>•</span>
                              <span className="truncate max-w-[90px]">{emp.position}</span>
                            </div>
                          </div>
                        </td>

                        {/* 1..31 Shift Days */}
                        {days.map((d) => {
                          const shift = emp.shifts[d.day];
                          const type = shift?.shiftType;
                          const isSunday = d.dayOfWeek === 0;

                          return (
                            <td
                              key={d.day}
                              onClick={() => handleCellClick(emp, d)}
                              className={cn(
                                "py-2 px-0.5 cursor-pointer transition-transform hover:scale-110",
                                isSunday ? "bg-rose-500/5" : ""
                              )}
                              title={`${emp.fullName} วันที่ ${d.day}: ${type || "ยังไม่ระบุกะ"}`}
                            >
                              {type === "DAY" ? (
                                <span className="inline-block w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] leading-6 border border-emerald-500/30 shadow-2xs">
                                  D
                                </span>
                              ) : type === "OT" ? (
                                <span className="inline-block w-6 h-6 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px] leading-6 border border-amber-500/30 shadow-2xs">
                                  OT
                                </span>
                              ) : type === "OFF" ? (
                                <span className="inline-block w-6 h-6 rounded-lg bg-slate-500/10 text-slate-400 font-bold text-[9px] leading-6">
                                  OFF
                                </span>
                              ) : type === "LEAVE" ? (
                                <span className="inline-block w-6 h-6 rounded-lg bg-rose-500/15 text-rose-600 font-bold text-[9px] leading-6 border border-rose-500/30">
                                  LV
                                </span>
                              ) : type === "RELIEF" || shift?.isRelief ? (
                                <span className="inline-block w-6 h-6 rounded-lg bg-purple-600 text-white font-bold text-[9px] leading-6 shadow-xs" title={shift?.note || "ยืมตัวเสริมกำลังคน"}>
                                  SUB
                                </span>
                              ) : (
                                <span className="inline-block w-6 h-6 rounded-lg border border-dashed border-surface-border text-slate-300 text-[10px] leading-6">
                                  -
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Weekly Hours Columns */}
                        <td className={cn("py-2 px-1 font-mono font-semibold text-xs", emp.w1Hours > 48 ? "text-amber-600 bg-amber-500/10 font-bold" : "text-content-secondary")}>
                          {emp.w1Hours}
                        </td>
                        <td className={cn("py-2 px-1 font-mono font-semibold text-xs", emp.w2Hours > 48 ? "text-amber-600 bg-amber-500/10 font-bold" : "text-content-secondary")}>
                          {emp.w2Hours}
                        </td>
                        <td className={cn("py-2 px-1 font-mono font-semibold text-xs", emp.w3Hours > 48 ? "text-amber-600 bg-amber-500/10 font-bold" : "text-content-secondary")}>
                          {emp.w3Hours}
                        </td>
                        <td className={cn("py-2 px-1 font-mono font-semibold text-xs", emp.w4Hours > 48 ? "text-amber-600 bg-amber-500/10 font-bold" : "text-content-secondary")}>
                          {emp.w4Hours}
                        </td>
                        <td className={cn("py-2 px-1 font-mono font-semibold text-xs", emp.w5Hours > 48 ? "text-amber-600 bg-amber-500/10 font-bold" : "text-content-secondary")}>
                          {emp.w5Hours}
                        </td>

                        {/* Total Monthly Hours */}
                        <td className="py-2 px-3 font-mono font-black text-brand-600 dark:text-brand-400 bg-brand-500/10 text-xs">
                          {emp.totalHours}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Main Content: TAB 2 - Factory Calendar View */}
      {activeTab === "CALENDAR" && (
        <div className="bg-surface-card border border-surface-border rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <h2 className="text-base font-black text-content-primary">
                ปฏิทินกำลังคนประจำวัน: {currentMonthDate.toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
              </h2>
              <p className="text-xs text-content-muted">
                แสดงจำนวนพนักงานที่เข้ากะจริงในแต่ละวัน รายชื่อพนักงาน และการเสริมกำลังคนข้ามโรงงาน
              </p>
            </div>

            <button
              onClick={() => handleOpenReliefModal()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เสริมคนวันที่มีคนขาด</span>
            </button>
          </div>

          {/* 7-Column Monthly Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Calendar Day Header */}
            {THAI_FULL_DAY_NAMES.map((name, i) => (
              <div
                key={name}
                className={cn(
                  "p-2 text-center text-xs font-bold rounded-xl border border-surface-border",
                  i === 0 ? "bg-rose-500/10 text-rose-600" : "bg-surface-subtle text-content-secondary"
                )}
              >
                {name}
              </div>
            ))}

            {/* Empty padding before day 1 */}
            {Array.from({ length: days[0]?.dayOfWeek || 0 }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[110px] bg-surface-subtle/20 rounded-2xl border border-surface-border/40" />
            ))}

            {/* Days in Month */}
            {days.map((d) => {
              const stat = dailyStats[d.day] || { scheduledCount: 0, reliefCount: 0, offCount: 0, leaveCount: 0, staffNames: [], reliefStaff: [] };
              const isSunday = d.dayOfWeek === 0;

              return (
                <div
                  key={d.day}
                  onClick={() => handleOpenReliefModal(d.dateStr)}
                  className={cn(
                    "min-h-[110px] p-2.5 rounded-2xl border transition-all hover:shadow-md cursor-pointer flex flex-col justify-between space-y-1.5",
                    isSunday
                      ? "bg-rose-500/5 border-rose-500/20"
                      : stat.scheduledCount > 0
                      ? "bg-surface-card border-surface-border hover:border-brand-500/40"
                      : "bg-surface-subtle/40 border-surface-border"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs",
                        isSunday ? "bg-rose-500 text-white font-black" : "bg-surface-subtle text-content-primary"
                      )}
                    >
                      {d.day}
                    </span>

                    {/* Staff Scheduled Counter */}
                    {stat.scheduledCount > 0 ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        {stat.scheduledCount} คน
                      </span>
                    ) : (
                      <span className="text-[10px] text-content-muted">วันหยุด</span>
                    )}
                  </div>

                  {/* Relief Worker Tag if any */}
                  {stat.reliefCount > 0 && (
                    <div className="bg-purple-600/15 border border-purple-500/30 rounded-lg p-1 text-[10px] text-purple-700 dark:text-purple-300 font-bold space-y-0.5">
                      <div className="flex items-center gap-1">
                        <ArrowRightLeft className="w-3 h-3 text-purple-600" />
                        <span>มีคนยืมตัว +{stat.reliefCount} คน</span>
                      </div>
                      {stat.reliefStaff.map((rf, idx) => (
                        <p key={idx} className="truncate text-[9px] text-purple-600">
                          • {rf.name} ({rf.homeSite})
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Staff Names Snippet */}
                  <div className="text-[10px] text-content-muted space-y-0.5">
                    {stat.staffNames.slice(0, 3).map((name, i) => (
                      <p key={i} className="truncate leading-tight">
                        • {name}
                      </p>
                    ))}
                    {stat.staffNames.length > 3 && (
                      <p className="text-[9px] text-brand-600 font-bold leading-tight">
                        +{stat.staffNames.length - 3} คน...
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: Cross-Site Relief Worker Modal */}
      {showReliefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-card border border-surface-border rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden text-content-primary">
            <div className="flex items-center justify-between p-6 border-b border-surface-border bg-gradient-to-r from-purple-900 to-indigo-950 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-purple-300 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg">เสริมพนักงานจากโรงงานอื่น (Cross-Site Relief)</h3>
                  <p className="text-xs text-purple-200">
                    ยืมตัวพนักงานที่มีสถานะว่าง/วันหยุดมาเสริมทัพทดแทนคนขาดหรือคนลา
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReliefModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRelief} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                <p className="text-content-secondary font-bold">
                  โรงงานเป้าหมาย: <strong className="text-purple-700 dark:text-purple-300">{activeSite?.code} - {activeSite?.name}</strong>
                </p>
                <p className="text-content-muted text-[11px] mt-0.5">
                  นิคมฯ: {activeSite?.estateName || "ไม่ระบุ"}
                </p>
              </div>

              {/* Date Selector */}
              <div>
                <label className="block font-bold text-content-secondary mb-1">
                  วันที่ต้องการเสริมกำลังคน *
                </label>
                <input
                  type="date"
                  required
                  value={reliefDateStr}
                  onChange={(e) => {
                    setReliefDateStr(e.target.value);
                    handleOpenReliefModal(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary font-bold outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                />
              </div>

              {/* Reason Selector */}
              <div>
                <label className="block font-bold text-content-secondary mb-1">
                  เหตุผลในการขอยืมตัว *
                </label>
                <select
                  value={reliefReason}
                  onChange={(e) => setReliefReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary font-bold outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="ทดแทนพนักงานขาดงาน">ทดแทนพนักงานขาดงาน (Absent Replacement)</option>
                  <option value="ทดแทนพนักงานลาป่วย/ลากิจ">ทดแทนพนักงานลาป่วย/ลากิจ (Sick/Casual Leave)</option>
                  <option value="เสริมทีมงานบิ๊กคลีนนิ่ง/งานเร่งด่วน">เสริมทีมงานบิ๊กคลีนนิ่ง / งานเร่งด่วน (Urgent OT)</option>
                  <option value="เสริมกำลังคนตามคำสั่งลูกค้า">เสริมกำลังคนตามคำสั่งลูกค้า (Customer Request)</option>
                </select>
              </div>

              {/* Worker Selection List */}
              <div className="space-y-1.5">
                <label className="block font-bold text-content-secondary">
                  เลือกพนักงานจากโรงงานอื่นที่พร้อมปฏิบัติงาน *
                </label>

                {loadingReliefWorkers ? (
                  <div className="py-8 text-center text-content-muted animate-pulse">
                    กำลังค้นหาพนักงานที่ว่างในวันที่ระบุ...
                  </div>
                ) : reliefWorkersList.length === 0 ? (
                  <div className="py-6 text-center text-content-muted border border-surface-border rounded-2xl p-4">
                    ไม่พบพนักงานว่างจากโรงงานอื่นในวันนี้
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-2 border border-surface-border rounded-2xl p-2 bg-surface-subtle/30">
                    {reliefWorkersList.map((w) => (
                      <label
                        key={w.id}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all",
                          selectedReliefWorkerId === w.id
                            ? "bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/30"
                            : "bg-surface-card border-surface-border hover:border-purple-300"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="reliefWorker"
                            checked={selectedReliefWorkerId === w.id}
                            onChange={() => setSelectedReliefWorkerId(w.id)}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <div>
                            <p className="font-bold text-content-primary text-xs">{w.fullName}</p>
                            <p className="text-[11px] text-content-muted">
                              สังกัดเดิม: <strong className="text-content-primary">{w.homeSiteCode}</strong> ({w.estateName})
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-md",
                              w.isRecommended ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/15 text-amber-700"
                            )}
                          >
                            {w.statusOnDate}
                          </span>
                          {w.phone && (
                            <p className="text-[10px] text-content-muted font-mono mt-0.5">📞 {w.phone}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setShowReliefModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-subtle hover:bg-surface-border font-bold text-content-secondary cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingRelief || !selectedReliefWorkerId}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submittingRelief ? "กำลังบันทึก..." : "ยืนยันส่งพนักงานเสริมทัพ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Auto-Generate Schedule Modal */}
      {showAutoGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-card border border-surface-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-content-primary">
            <div className="p-6 border-b border-surface-border bg-surface-subtle/50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg">สร้างตารางกะอัตโนมัติทั้งเดือน</h3>
                  <p className="text-xs text-content-muted">
                    จัดกะงานมาตรฐาน จันทร์-เสาร์ และกำหนดวันอาทิตย์เป็นวันหยุด (OFF)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAutoGenerateModal(false)}
                className="w-8 h-8 rounded-full bg-surface-subtle hover:bg-surface-border flex items-center justify-center text-content-muted cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAutoGen} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-brand-700 dark:text-brand-300">
                  เป้าหมาย: {activeSite?.name} ({activeSite?.code})
                </p>
                <p className="text-content-muted">
                  เดือนที่จัดกะ: <strong>{currentMonthDate.toLocaleDateString("th-TH", { month: "long", year: "numeric" })}</strong> ({days.length} วัน)
                </p>
              </div>

              <div className="space-y-3 p-3 bg-surface-subtle rounded-2xl border border-surface-border">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoGenSaturday}
                    onChange={(e) => setAutoGenSaturday(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600"
                  />
                  <span>
                    <strong>รวมวันเสาร์เป็นวันทำงานปกติ</strong> (หากไม่เลือก วันเสาร์จะเป็นวันหยุด OFF)
                  </span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoGenOt}
                    onChange={(e) => setAutoGenOt(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600"
                  />
                  <span>
                    <strong>กำหนดโอที 1.5 ชม. ทุกวันทำงาน</strong> (รวม 9.5 ชม./วัน)
                  </span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoGenOverwrite}
                    onChange={(e) => setAutoGenOverwrite(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <span className="text-rose-600">
                    <strong>เขียนทับกะเดิมที่มีอยู่แล้ว</strong> (ไม่รวมวันลาและรายการยืมตัว)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setShowAutoGenerateModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-subtle hover:bg-surface-border font-bold text-content-secondary cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingAutoGen}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submittingAutoGen ? "กำลังสร้างตาราง..." : "ยืนยันสร้างตารางกะ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Quick Edit Single Shift Cell */}
      {showCellEditModal && editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-card border border-surface-border rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden text-content-primary">
            <div className="p-4 border-b border-surface-border bg-surface-subtle flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-content-primary">{editingCell.employeeName}</h4>
                <p className="text-[11px] text-content-muted">
                  วันที่ {editingCell.dayNum} ({editingCell.dateStr})
                </p>
              </div>
              <button
                onClick={() => setShowCellEditModal(false)}
                className="w-7 h-7 rounded-full bg-surface-subtle hover:bg-surface-border flex items-center justify-center text-content-muted cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-2.5 text-xs">
              <p className="font-bold text-content-secondary">เลือกประเภทกะการทำงาน:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSaveCell("DAY", 8, 0)}
                  className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-500/20 text-center cursor-pointer transition-all active:scale-95"
                >
                  ☀️ ปกติ (8h)
                </button>
                <button
                  onClick={() => handleSaveCell("OT", 8, 1.5)}
                  className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-500/20 text-center cursor-pointer transition-all active:scale-95"
                >
                  ⚡ ปกติ+OT (9.5h)
                </button>
                <button
                  onClick={() => handleSaveCell("OFF", 0, 0)}
                  className="p-2.5 rounded-xl border border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-500/20 text-center cursor-pointer transition-all active:scale-95"
                >
                  🏖️ วันหยุด (OFF)
                </button>
                <button
                  onClick={() => handleSaveCell("LEAVE", 0, 0)}
                  className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold hover:bg-rose-500/20 text-center cursor-pointer transition-all active:scale-95"
                >
                  🩺 วันลา (LEAVE)
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setShowCellEditModal(false);
                    handleOpenReliefModal(editingCell.dateStr);
                  }}
                  className="w-full p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-500/20 text-center cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>ขอยืมตัวพนักงานเสริมวันนี้</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
