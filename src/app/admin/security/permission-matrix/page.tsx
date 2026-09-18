"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Shield, Save, Check, RefreshCw, Filter, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/swal";

interface Role {
  id: string;
  code: string;
  nameTh: string;
  level: number;
  permissions: { permission: { id: string; code: string } }[];
}

interface Permission {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string;
  sensitivity: string;
}

const ACTIONS_MAP: Record<string, string> = {
  VIEW: "ดู (View)",
  CREATE: "เพิ่ม (Create)",
  EDIT: "แก้ไข (Edit)",
  DELETE: "ลบ (Delete)",
  REVIEW: "ตรวจ (Review)",
  APPROVE: "อนุมัติ (Approve)",
  EXPORT: "ส่งออก (Export)",
  CONFIGURE: "ตั้งค่า (Config)",
};

export default function PermissionMatrixPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissionsSet, setRolePermissionsSet] = useState<Set<string>>(new Set());
  const [selectedModule, setSelectedModule] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        fetch("/api/security/roles"),
        fetch("/api/security/permissions"),
      ]);

      if (rolesRes.ok && permsRes.ok) {
        const rolesData = await rolesRes.json();
        const permsData = await permsRes.json();

        setRoles(rolesData.roles || []);
        setPermissions(permsData.permissions || []);

        if (rolesData.roles?.length > 0 && !selectedRole) {
          const first = rolesData.roles[0];
          setSelectedRole(first);
          setRolePermissionsSet(new Set(first.permissions.map((p: any) => p.permission.id)));
        }
      }
    } catch (err) {
      console.error(err);
      showError("ข้อผิดพลาด", "ไม่สามารถดึงข้อมูลสิทธิ์และบทบาทได้");
    } finally {
      setLoading(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectRole = (role: Role) => {
    setSelectedRole(role);
    setRolePermissionsSet(new Set(role.permissions.map((p) => p.permission.id)));
  };

  const togglePermission = (permId: string) => {
    setRolePermissionsSet((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  };

  const saveRolePermissions = async () => {
    if (!selectedRole) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/security/roles/${selectedRole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissionIds: Array.from(rolePermissionsSet),
          reason: `Matrix Update by Admin for ${selectedRole.code}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "บันทึกไม่สำเร็จ");

      showSuccess("สำเร็จ", `อัปเดตสิทธิ์ของบทบาท ${selectedRole.nameTh} เรียบร้อยแล้ว`);
      // Update local role list
      setRoles((prev) =>
        prev.map((r) =>
          r.id === selectedRole.id
            ? {
                ...r,
                permissions: Array.from(rolePermissionsSet).map((pId) => ({
                  permission: { id: pId, code: "" },
                })),
              }
            : r
        )
      );
    } catch (err: any) {
      showError("ข้อผิดพลาด", err.message);
    } finally {
      setSaving(false);
    }
  };

  const modules = Array.from(new Set(permissions.map((p) => p.module)));
  const filteredPermissions = selectedModule === "ALL"
    ? permissions
    : permissions.filter((p) => p.module === selectedModule);

  // Group filtered permissions by module
  const grouped: Record<string, Permission[]> = {};
  for (const p of filteredPermissions) {
    if (!grouped[p.module]) grouped[p.module] = [];
    grouped[p.module].push(p);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Table className="w-4 h-4" />
            <span>Role-Based Access Control Matrix</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">ตารางสิทธิ์การใช้งาน (Permission Matrix)</h1>
          <p className="text-xs text-slate-400 mt-1">
            กำหนดและตรวจสอบสิทธิ์ Role × Module × Action อย่างละเอียดในรูปแบบตารางเดียว
          </p>
        </div>

        {selectedRole && (
          <button
            onClick={saveRolePermissions}
            disabled={saving}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "กำลังบันทึก..." : `บันทึกสิทธิ์ (${rolePermissionsSet.size} สิทธิ์)`}</span>
          </button>
        )}
      </div>

      {/* Role Selector Chips */}
      <div className="p-4 rounded-3xl bg-surface-card border border-surface-border shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-content-primary mb-1">
          <span>เลือกบทบาทเพื่อปรับแต่งสิทธิ์:</span>
          {selectedRole && (
            <span className="text-[11px] text-brand-600 font-normal">
              กำลังแก้ไข: <strong className="font-bold">{selectedRole.nameTh}</strong> ({selectedRole.code})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {roles.map((role) => {
            const isSelected = selectedRole?.id === role.id;
            return (
              <button
                key={role.id}
                onClick={() => selectRole(role)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5",
                  isSelected
                    ? "bg-brand-600 text-white shadow-md"
                    : "bg-surface-subtle text-content-secondary hover:bg-surface-card border border-surface-border"
                )}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{role.nameTh}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Module Filter */}
      <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-1">
        <span className="text-content-muted font-bold whitespace-nowrap">กรองโมดูล:</span>
        <button
          onClick={() => setSelectedModule("ALL")}
          className={cn(
            "px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-colors",
            selectedModule === "ALL" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-content-secondary hover:bg-surface-subtle"
          )}
        >
          ทั้งหมด ({permissions.length})
        </button>
        {modules.map((m) => (
          <button
            key={m}
            onClick={() => setSelectedModule(m)}
            className={cn(
              "px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-colors",
              selectedModule === m ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-content-secondary hover:bg-surface-subtle"
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Matrix Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-content-muted animate-pulse">
          กำลังโหลดตารางสิทธิ์...
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([modName, perms]) => (
            <div key={modName} className="p-5 rounded-3xl bg-surface-card border border-surface-border shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-surface-border pb-2">
                <h2 className="text-sm font-bold text-content-primary">
                  {modName}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = perms.map((p) => p.id);
                      setRolePermissionsSet((prev) => {
                        const next = new Set(prev);
                        allIds.forEach((id) => next.add(id));
                        return next;
                      });
                    }}
                    className="text-[10px] font-bold text-brand-600 hover:underline"
                  >
                    เลือกทั้งหมดในโมดูลนี้
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = perms.map((p) => p.id);
                      setRolePermissionsSet((prev) => {
                        const next = new Set(prev);
                        allIds.forEach((id) => next.delete(id));
                        return next;
                      });
                    }}
                    className="text-[10px] font-bold text-rose-600 hover:underline"
                  >
                    ยกเลิกทั้งหมด
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {perms.map((p) => {
                  const isChecked = rolePermissionsSet.has(p.id);
                  const isCritical = p.sensitivity === "CRITICAL";
                  const isSensitive = p.sensitivity === "SENSITIVE";

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePermission(p.id)}
                      className={cn(
                        "p-3 rounded-2xl text-left border transition-all flex flex-col justify-between space-y-2",
                        isChecked
                          ? "bg-brand-50/80 border-brand-500 text-brand-900 dark:bg-brand-950/50 dark:border-brand-500 dark:text-brand-200 shadow-sm"
                          : "border-surface-border bg-surface-subtle/40 hover:bg-surface-subtle text-content-secondary"
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono font-bold truncate">
                            {p.code}
                          </span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="rounded text-brand-600 focus:ring-0"
                          />
                        </div>
                        <p className="text-xs font-semibold text-content-primary line-clamp-2">
                          {p.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] pt-2 border-t border-surface-border/40">
                        <span className="text-content-muted font-medium">
                          {ACTIONS_MAP[p.action] || p.action}
                        </span>
                        {isCritical && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-600">
                            CRITICAL
                          </span>
                        )}
                        {isSensitive && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600">
                            SENSITIVE
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
