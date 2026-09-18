"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserCog,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
  Building,
  Key,
  Home,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showConfirm } from "@/lib/swal";

interface UserItem {
  id: string;
  email: string;
  displayName: string;
  type: string;
  isActive: boolean;
  isLocked: boolean;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  authzVersion: number;
  createdAt: string;
  roles: {
    assignmentId: string;
    roleId: string;
    code: string;
    nameTh: string;
    level: number;
    scopeType: string;
    scopeId: string | null;
    startAt: string | null;
    endAt: string | null;
  }[];
  employee: {
    id: string;
    code: string;
    isCodeMasked: boolean;
    fullName: string;
    position: string;
    site?: { id: string; name: string };
  } | null;
}

interface RoleOption {
  id: string;
  code: string;
  nameTh: string;
  level: number;
}

export default function SecurityUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [rolesList, setRolesList] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [hasCodePermission, setHasCodePermission] = useState(false);

  // Assign Role Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [assignForm, setAssignForm] = useState({
    roleId: "",
    scopeType: "GLOBAL",
    scopeId: "",
    startAt: "",
    endAt: "",
    reason: "",
    forceConfirm: false,
  });
  const [conflictWarning, setConflictWarning] = useState<any[] | null>(null);

  // Explain Access Modal
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [explainData, setExplainData] = useState<{
    explanation: string;
    details: any[];
    permission: string;
  } | null>(null);
  const [queryPermission, setQueryPermission] = useState("employee.read");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        fetch("/api/security/users"),
        fetch("/api/security/roles"),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
        setHasCodePermission(usersData.hasCodePermission || false);
      }
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRolesList(rolesData.roles || []);
      }
    } catch (err) {
      console.error(err);
      showError("ข้อผิดพลาด", "ไม่สามารถดึงข้อมูลผู้ใช้งานได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Assign Role Modal
  const openAssignModal = (user: UserItem) => {
    setSelectedUser(user);
    setConflictWarning(null);
    setAssignForm({
      roleId: rolesList[0]?.id || "",
      scopeType: "GLOBAL",
      scopeId: "",
      startAt: "",
      endAt: "",
      reason: "มอบหมายสิทธิ์โดย Admin",
      forceConfirm: false,
    });
    setShowAssignModal(true);
  };

  // Submit Assign Role
  const handleAssignRole = async () => {
    if (!selectedUser || !assignForm.roleId) return;

    try {
      const res = await fetch(`/api/security/users/${selectedUser.id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignForm),
      });

      const body = await res.json();
      if (!res.ok) {
        if (body.conflicts) {
          setConflictWarning(body.conflicts);
          return;
        }
        throw new Error(body.message || "มอบหมายสิทธิ์ไม่สำเร็จ");
      }

      showSuccess("สำเร็จ", body.message);
      setShowAssignModal(false);
      loadData();
    } catch (err: any) {
      showError("ข้อผิดพลาด", err.message);
    }
  };

  // Revoke Role Assignment
  const handleRevokeRole = async (user: UserItem, assignmentId: string, roleName: string) => {
    const confirmed = await showConfirm(
      "ยืนยันการเพิกถอนสิทธิ์?",
      `คุณต้องการเพิกถอนบทบาท "${roleName}" ออกจากผู้ใช้ ${user.displayName} หรือไม่? Session ของผู้ใช้จะถูกรีเฟรชทันที`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/security/users/${user.id}/roles?assignmentId=${assignmentId}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "เพิกถอนสิทธิ์ไม่สำเร็จ");

      showSuccess("สำเร็จ", body.message);
      loadData();
    } catch (err: any) {
      showError("ข้อผิดพลาด", err.message);
    }
  };

  // Explain Access
  const handleExplainAccess = async (user: UserItem, permission = queryPermission) => {
    try {
      const res = await fetch(`/api/security/explain-access?userId=${user.id}&permission=${permission}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "ไม่สามารถอธิบายสิทธิ์ได้");

      setSelectedUser(user);
      setExplainData({
        explanation: body.explanation,
        details: body.details,
        permission,
      });
      setShowExplainModal(true);
    } catch (err: any) {
      showError("ข้อผิดพลาด", err.message);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (u.employee?.fullName && u.employee.fullName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">
            <UserCog className="w-4 h-4" />
            <span>User & Access Governance</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">จัดการผู้ใช้งานและสิทธิ์ (User Management)</h1>
          <p className="text-xs text-slate-400 mt-1">
            กำหนดบทบาท ขอบเขตข้อมูล (Scope) ป้องกัน IDOR และตรวจสอบสิทธิ์ผู้ใช้รายบุคคล
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/admin/dashboard"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 shadow-sm transition-all active:scale-95"
            title="กลับไปยังหน้าแรกแดชบอร์ด"
          >
            <Home className="w-4 h-4 text-brand-400" />
            <span>กลับหน้าแรก</span>
          </Link>
          {!hasCodePermission && (
            <span className="text-[11px] font-bold px-3 py-1.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>รหัสพนักงานถูกซ่อนตาม Privacy Policy</span>
            </span>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, อีเมล หรือชื่อพนักงาน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-surface-border bg-surface-card text-content-primary text-xs outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-sm"
          />
        </div>
        <div className="text-xs text-content-muted">
          พบทั้งหมด <span className="font-bold text-content-primary">{filteredUsers.length}</span> ผู้ใช้งาน
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border bg-surface-subtle/50 text-content-muted font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4">ผู้ใช้งาน</th>
                <th className="py-3.5 px-4">รหัสพนักงาน</th>
                <th className="py-3.5 px-4">บทบาทที่ได้รับ (Roles)</th>
                <th className="py-3.5 px-4">ขอบเขตข้อมูล (Scope)</th>
                <th className="py-3.5 px-4">MFA</th>
                <th className="py-3.5 px-4">สถานะ</th>
                <th className="py-3.5 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-content-muted animate-pulse">
                    กำลังโหลดข้อมูลผู้ใช้...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-content-muted">
                    ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-subtle/40 transition-colors">
                    {/* User info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-brand-500/15 text-brand-600 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 border border-brand-500/20">
                          {u.displayName?.slice(0, 2) || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-content-primary">{u.displayName}</p>
                          <p className="text-[10px] text-content-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Employee Code (Masked if no perm) */}
                    <td className="py-3.5 px-4">
                      {u.employee ? (
                        <div>
                          <span
                            className={cn(
                              "font-mono font-bold text-[11px] px-2 py-0.5 rounded-lg border",
                              u.employee.isCodeMasked
                                ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                                : "bg-slate-100 dark:bg-slate-800 text-content-primary border-surface-border"
                            )}
                          >
                            {u.employee.code}
                          </span>
                          <span className="block text-[10px] text-content-muted mt-0.5 truncate">
                            {u.employee.fullName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-content-muted text-[11px]">—</span>
                      )}
                    </td>

                    {/* Roles */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {u.roles.length === 0 ? (
                          <span className="text-[10px] text-content-muted italic">ไม่มี Role ประจำ</span>
                        ) : (
                          u.roles.map((r) => (
                            <span
                              key={r.assignmentId}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 text-[10px] font-bold border border-brand-500/20"
                            >
                              <span>{r.nameTh}</span>
                              <button
                                onClick={() => handleRevokeRole(u, r.assignmentId, r.nameTh)}
                                title="เพิกถอนสิทธิ์"
                                className="text-rose-500 hover:text-rose-700 ml-1 font-black"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    {/* Scope */}
                    <td className="py-3.5 px-4">
                      {u.roles.length > 0 ? (
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-surface-subtle text-content-secondary border border-surface-border font-bold">
                          {u.roles[0].scopeType}
                          {u.roles[0].scopeId ? `:${u.roles[0].scopeId}` : ""}
                        </span>
                      ) : (
                        <span className="text-content-muted text-[11px]">—</span>
                      )}
                    </td>

                    {/* MFA */}
                    <td className="py-3.5 px-4">
                      {u.mfaEnabled ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>เปิดแล้ว</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-md">
                          <XCircle className="w-3 h-3" />
                          <span>ปิดอยู่</span>
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {u.isActive && !u.isLocked ? (
                        <span className="text-[10px] font-bold text-emerald-600">ปกติ</span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-600">ระงับการใช้งาน</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleExplainAccess(u)}
                          title="ทำไมผู้ใช้นี้จึงมีสิทธิ์?"
                          className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors flex items-center space-x-1"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>ตรวจสิทธิ์</span>
                        </button>

                        <button
                          onClick={() => openAssignModal(u)}
                          title="มอบหมายบทบาทใหม่"
                          className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-sm flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>เพิ่ม Role</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Assign Role */}
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 font-sans">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <Plus className="w-5 h-5 mr-2 text-brand-600" />
              มอบหมายบทบาทให้: {selectedUser.displayName}
            </h2>

            {/* SoD Conflict Warning Box */}
            {conflictWarning && conflictWarning.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                <div className="flex items-center space-x-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>ตรวจพบข้อขัดแย้ง Separation of Duties (SoD)</span>
                </div>
                {conflictWarning.map((c, i) => (
                  <p key={i} className="text-[11px] pl-6">• {c.message}</p>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">เลือกบทบาท (Role)</label>
                <select
                  value={assignForm.roleId}
                  onChange={(e) => {
                    setAssignForm({ ...assignForm, roleId: e.target.value });
                    setConflictWarning(null);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary text-xs outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {rolesList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nameTh} ({r.code}) - Level {r.level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">ขอบเขตข้อมูล (Data Scope)</label>
                <select
                  value={assignForm.scopeType}
                  onChange={(e) => setAssignForm({ ...assignForm, scopeType: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary text-xs outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="GLOBAL">GLOBAL (ทั่วทั้งระบบ / ทุกไซต์)</option>
                  <option value="ORGANIZATION">ORGANIZATION (ทั้งองค์กร)</option>
                  <option value="SITE">SITE (เฉพาะไซต์งานที่กำหนด)</option>
                  <option value="DEPARTMENT">DEPARTMENT (เฉพาะแผนก)</option>
                  <option value="PROJECT">PROJECT (เฉพาะโครงการ)</option>
                  <option value="TEAM">TEAM (เฉพาะทีมของตนเอง)</option>
                  <option value="OWN">OWN (เฉพาะข้อมูลของตนเอง)</option>
                </select>
              </div>

              {assignForm.scopeType !== "GLOBAL" && assignForm.scopeType !== "OWN" && (
                <div>
                  <label className="block text-xs font-bold text-content-secondary mb-1">
                    รหัสเป้าหมายตาม Scope (Site ID / Project ID / Dept ID)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น รหัสไซต์ หรือ รหัสโครงการ"
                    value={assignForm.scopeId}
                    onChange={(e) => setAssignForm({ ...assignForm, scopeId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary text-xs outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">
                  วันหมดอายุสิทธิ์ (Temporary Role / รักษาการ)
                </label>
                <input
                  type="date"
                  value={assignForm.endAt}
                  onChange={(e) => setAssignForm({ ...assignForm, endAt: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary text-xs outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="text-[10px] text-content-muted">ปล่อยว่างหากเป็นสิทธิ์ถาวร</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-content-secondary mb-1">เหตุผลในการมอบหมาย</label>
                <input
                  type="text"
                  placeholder="เช่น บรรจุงานใหม่, เลื่อนตำแหน่ง, รักษาการแทน"
                  value={assignForm.reason}
                  onChange={(e) => setAssignForm({ ...assignForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary text-xs outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {conflictWarning && (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="forceConfirm"
                    checked={assignForm.forceConfirm}
                    onChange={(e) => setAssignForm({ ...assignForm, forceConfirm: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-0"
                  />
                  <label htmlFor="forceConfirm" className="text-xs font-bold text-amber-600">
                    ฉันรับทราบข้อขัดแย้งและยืนยันจะมอบหมายบทบาทนี้ (Force Confirm)
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-xl border border-surface-border text-xs font-bold text-content-secondary hover:bg-surface-subtle"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleAssignRole}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md"
              >
                ยืนยันการมอบหมาย
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Explain Access */}
      {showExplainModal && selectedUser && explainData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 font-sans">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <HelpCircle className="w-5 h-5 mr-2 text-indigo-600" />
              วิเคราะห์ที่มาของสิทธิ์: {selectedUser.displayName}
            </h2>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={queryPermission}
                  onChange={(e) => setQueryPermission(e.target.value)}
                  placeholder="เช่น employee.read หรือ payroll.approve"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-surface-border bg-surface-subtle text-content-primary text-xs font-mono outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => handleExplainAccess(selectedUser, queryPermission)}
                  className="px-3 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold whitespace-nowrap"
                >
                  ตรวจสอบ
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-surface-subtle/70 border border-surface-border space-y-2">
                <p className="text-xs font-bold text-content-primary">ผลการวินิจฉัยสิทธิ์:</p>
                <p className="text-xs text-content-secondary leading-relaxed bg-surface-card p-3 rounded-xl border border-surface-border">
                  {explainData.explanation}
                </p>

                {explainData.details.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-bold text-content-muted uppercase">ที่มาของสิทธิ์ (Granted Channels):</span>
                    {explainData.details.map((d, i) => (
                      <div key={i} className="p-2 rounded-lg bg-surface-card border border-surface-border text-xs flex items-center justify-between">
                        <span className="font-bold text-content-primary">{d.roleNameTh} ({d.roleCode})</span>
                        <span className="font-mono text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded">{d.scopeType}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setShowExplainModal(false)}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
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
