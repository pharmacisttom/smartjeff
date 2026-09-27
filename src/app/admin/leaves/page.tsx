"use client";

import { useState, useEffect } from "react";
import {
  CalendarOff,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Users,
  Building,
  Calendar,
  AlertCircle,
  FileText,
  Sparkles,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import Swal from "sweetalert2";
import { showToast, showSuccess, showError } from "@/lib/swal";

interface LeaveRecord {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  employee: {
    id: string;
    code: string;
    prefix?: string | null;
    firstName: string;
    lastName: string;
    position: string;
    phone?: string | null;
    site?: { id: string; name: string; code: string } | null;
  };
}

const TYPE_CONFIG: Record<string, { label: string; badgeClass: string; icon: any }> = {
  SICK: {
    label: "ลาป่วย",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
    icon: AlertCircle,
  },
  PERSONAL: {
    label: "ลากิจ",
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
    icon: CalendarOff,
  },
  VACATION: {
    label: "พักร้อน",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
    icon: CheckCircle2,
  },
  OT: {
    label: "ขอทำ OT",
    badgeClass: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30",
    icon: Clock,
  },
};

export default function AdminLeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [siteFilter, setSiteFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<LeaveRecord | null>(null);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/leaves");
      const data = await res.json();
      if (res.ok) {
        setLeaves(data.leaves || []);
      }
    } catch (e) {
      console.error("Failed to fetch leaves:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
    const isApprove = newStatus === "APPROVED";

    const confirm = await Swal.fire({
      title: isApprove ? "ยืนยันการอนุมัติคำขอ?" : "ยืนยันการไม่อนุมัติคำขอ?",
      text: isApprove
        ? "ระบบจะปรับสถานะเป็นอนุมัติ และบันทึกลงประวัติเวลาทำงานของพนักงาน"
        : "กรุณายืนยันการปฏิเสธคำขอนี้",
      icon: isApprove ? "question" : "warning",
      showCancelButton: true,
      confirmButtonText: isApprove ? "อนุมัติคำขอ" : "ไม่อนุมัติ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: isApprove ? "#10b981" : "#ef4444",
      background: "#0f172a",
      color: "#ffffff",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch("/api/leaves", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(isApprove ? "อนุมัติคำขอเรียบร้อยแล้ว" : "บันทึกไม่อนุมัติเรียบร้อย", "success");
        setLeaves((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
        if (selectedRecord?.id === id) {
          setSelectedRecord((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      } else {
        showError("เกิดข้อผิดพลาด", data.message || "ไม่สามารถอัปเดตสถานะได้");
      }
    } catch (err: any) {
      console.error(err);
      showError("ข้อผิดพลาด", "การเชื่อมต่อเซิร์ฟเวอร์ขัดข้อง");
    }
  };

  // Distinct sites for filter
  const distinctSites = Array.from(
    new Set(leaves.map((l) => l.employee?.site?.code).filter(Boolean))
  ) as string[];

  // Filtered leaves
  const filteredLeaves = leaves.filter((l) => {
    const empName = `${l.employee?.prefix || ""} ${l.employee?.firstName || ""} ${l.employee?.lastName || ""}`.toLowerCase();
    const empCode = (l.employee?.code || "").toLowerCase();
    const siteCode = (l.employee?.site?.code || "").toLowerCase();
    const siteName = (l.employee?.site?.name || "").toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch = empName.includes(q) || empCode.includes(q) || siteCode.includes(q) || siteName.includes(q);
    const matchesStatus = statusFilter === "ALL" || l.status === statusFilter;
    const matchesType = typeFilter === "ALL" || l.type === typeFilter;
    const matchesSite = siteFilter === "ALL" || l.employee?.site?.code === siteFilter;

    return matchesSearch && matchesStatus && matchesType && matchesSite;
  });

  // Metric counts
  const pendingCount = leaves.filter((l) => l.status === "PENDING").length;
  const approvedCount = leaves.filter((l) => l.status === "APPROVED").length;
  const sickCount = leaves.filter((l) => l.type === "SICK").length;
  const otCount = leaves.filter((l) => l.type === "OT").length;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-widest">
            <CalendarOff className="w-4 h-4 text-brand-400" />
            <span>Leave & OT Approval Center</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">ระบบอนุมัติการลาและขอทำงานล่วงเวลา</h1>
          <p className="text-sm text-slate-300">
            ตรวจสอบ อนุมัติ และติดตามคำขอลาป่วย ลากิจ พักร้อน และขอทำงานล่วงเวลา (OT) ของพนักงานทุกโรงงาน
          </p>
        </div>

        <button
          onClick={fetchLeaves}
          disabled={loading}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-2xl border border-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-surface-border p-5 rounded-3xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-content-muted">รอพิจารณาอนุมัติ</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-amber-500">{pendingCount}</p>
          <span className="text-[11px] text-content-muted">คำขอที่ยังไม่ได้ตรวจสอบ</span>
        </div>

        <div className="bg-surface-card border border-surface-border p-5 rounded-3xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-content-muted">อนุมัติแล้ว</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-500">{approvedCount}</p>
          <span className="text-[11px] text-content-muted">คำขอที่ได้รับอนุมัติ</span>
        </div>

        <div className="bg-surface-card border border-surface-border p-5 rounded-3xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-content-muted">ขอทำงาน OT</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-500">{otCount}</p>
          <span className="text-[11px] text-content-muted">คำขอทำล่วงเวลารวม</span>
        </div>

        <div className="bg-surface-card border border-surface-border p-5 rounded-3xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-content-muted">ลาป่วยสะสม</span>
            <AlertCircle className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-content-primary">{sickCount}</p>
          <span className="text-[11px] text-content-muted">ประวัติการลาป่วย</span>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-surface-card border border-surface-border p-4 rounded-3xl shadow-sm">
        {/* Status Filter */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-content-secondary">สถานะคำขอ</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-surface-bg text-content-primary font-bold outline-none focus:border-brand-500"
          >
            <option value="ALL">สถานะทั้งหมด ({leaves.length})</option>
            <option value="PENDING">รอพิจารณา (PENDING - {pendingCount})</option>
            <option value="APPROVED">อนุมัติแล้ว (APPROVED - {approvedCount})</option>
            <option value="REJECTED">ไม่อนุมัติ (REJECTED)</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-content-secondary">ประเภทคำขอ</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-surface-bg text-content-primary font-bold outline-none focus:border-brand-500"
          >
            <option value="ALL">ทุกประเภท</option>
            <option value="SICK">ลาป่วย (SICK)</option>
            <option value="PERSONAL">ลากิจ (PERSONAL)</option>
            <option value="VACATION">พักร้อน (VACATION)</option>
            <option value="OT">ขอทำ OT (OVERTIME)</option>
          </select>
        </div>

        {/* Site Filter */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-content-secondary">โรงงาน / ไซต์งาน</label>
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-surface-bg text-content-primary font-bold outline-none focus:border-brand-500"
          >
            <option value="ALL">ทุกโรงงาน</option>
            {distinctSites.map((site) => (
              <option key={site} value={site}>
                หน่วยงาน {site}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-content-secondary">ค้นหาชื่อ / รหัสพนักงาน</label>
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัส..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-surface-border bg-surface-bg text-content-primary outline-none focus:border-brand-500"
            />
            <Search className="w-3.5 h-3.5 text-content-muted absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Main Table / List */}
      <div className="bg-surface-card border border-surface-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-black text-content-primary">
              รายการคำขอทั้งหมด ({filteredLeaves.length} รายการ)
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-content-muted text-xs">กำลังโหลดข้อมูลคำขอ...</div>
        ) : filteredLeaves.length === 0 ? (
          <div className="p-12 text-center text-content-muted text-xs space-y-2">
            <CalendarOff className="w-8 h-8 mx-auto text-content-muted/50" />
            <p>ไม่พบรายการคำขอตามเงื่อนไขที่เลือก</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-subtle border-b border-surface-border text-content-secondary font-bold">
                  <th className="py-3 px-4">พนักงาน</th>
                  <th className="py-3 px-4">หน่วยงาน</th>
                  <th className="py-3 px-4">ประเภท</th>
                  <th className="py-3 px-4">ช่วงวันที่ขอ</th>
                  <th className="py-3 px-4">เหตุผลประกอบ</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredLeaves.map((record) => {
                  const typeConf = TYPE_CONFIG[record.type] || {
                    label: record.type,
                    badgeClass: "bg-slate-100 text-slate-700",
                    icon: AlertCircle,
                  };
                  const isPending = record.status === "PENDING";
                  const isApproved = record.status === "APPROVED";

                  return (
                    <tr key={record.id} className="hover:bg-surface-subtle/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-content-primary">
                          {record.employee?.prefix || ""} {record.employee?.firstName}{" "}
                          {record.employee?.lastName}
                        </div>
                        <div className="text-[11px] text-content-muted font-mono">
                          {record.employee?.code} • {record.employee?.position}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-surface-subtle border border-surface-border text-content-secondary font-bold text-[11px]">
                          {record.employee?.site?.code || "AAM"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1 ${typeConf.badgeClass}`}>
                          {typeConf.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-content-primary">
                          {formatDate(record.startDate)}
                        </div>
                        <div className="text-[11px] text-content-muted">
                          ถึง {formatDate(record.endDate)}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-content-secondary truncate text-xs" title={record.reason || "-"}>
                          {record.reason || "-"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        {isPending ? (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            รอพิจารณา
                          </span>
                        ) : isApproved ? (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            อนุมัติแล้ว
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 text-xs font-bold inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            ไม่อนุมัติ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(record.id, "APPROVED")}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition active:scale-95 cursor-pointer shadow-sm"
                              >
                                อนุมัติ
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(record.id, "REJECTED")}
                                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition active:scale-95 cursor-pointer shadow-sm"
                              >
                                ไม่อนุมัติ
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-content-muted">
                              {record.approvedBy ? `โดย ${record.approvedBy}` : "เรียบร้อย"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
