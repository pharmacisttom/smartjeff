"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Plus,
  Copy,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Users,
  Search,
  KeyRound,
  FileCheck,
  History,
  Layers,
  Sparkles,
  Home,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showConfirm } from "@/lib/swal";

interface Permission {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string;
  sensitivity: "NORMAL" | "SENSITIVE" | "CRITICAL";
}

interface Role {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
  description: string | null;
  level: number;
  departmentType: string | null;
  isSystem: boolean;
  isActive: boolean;
  permissions: { permission: Permission }[];
  _count: { userAssignments: number };
  authorities: any[];
}

export default function SecurityRolesPage() {
  const [activeTab, setActiveTab] = useState<"roles" | "permissions" | "authorities" | "audit">("roles");
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    nameTh: "",
    nameEn: "",
    description: "",
    level: 1,
    departmentType: "OPERATIONS",
    permissionIds: [] as string[],
    reason: "",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        fetch("/api/security/roles"),
        fetch("/api/security/permissions"),
      ]);

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData.roles || []);
      }
      if (permsRes.ok) {
        const permsData = await permsRes.json();
        setAllPermissions(permsData.permissions || []);
        setGroupedPermissions(permsData.grouped || {});
      }
    } catch (err) {
      console.error(err);
      showError("ข้อผิดพลาด", "ไม่สามารถดึงข้อมูลบทบาทและสิทธิ์ได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Edit Role Modal
  const openEditRole = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      code: role.code,
      nameTh: role.nameTh,
      nameEn: role.nameEn,
      description: role.description || "",
      level: role.level,
      departmentType: role.departmentType || "OPERATIONS",
      permissionIds: role.permissions.map((rp) => rp.permission.id),
      reason: "",
    });
    setShowEditModal(true);
  };

  // Open Clone Role Modal
  const openCloneRole = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      code: `${role.code}_COPY`,
      nameTh: `${role.nameTh} (สำเนา)`,
      nameEn: `${role.nameEn} (Copy)`,
      description: role.description || "",
      level: role.level,
      departmentType: role.departmentType || "OPERATIONS",
      permissionIds: role.permissions.map((rp) => rp.permission.id),
      reason: "Clone Role",
    });
    setShowCloneModal(true);
  };

  // Toggle permission in modal form
  const togglePermission = (permId: string) => {
    setFormData((prev) => {
      const exists = prev.permissionIds.includes(permId);
      return {
        ...prev,
        permissionIds: exists
          ? prev.permissionIds.filter((id) => id !== permId)
          : [...prev.permissionIds, permId],
      };
    });
  };

  // Save Role (Create or Edit)
  const handleSaveRole = async (isEdit: boolean) => {
    if (!formData.code.trim() || !formData.nameTh.trim() || !formData.nameEn.trim()) {
      showError("ข้อมูลไม่ครบถ้วน", "กรุณากรอกรหัสและชื่อบทบาท");
      return;
    }

    try {
      const url = isEdit ? `/api/security/roles/${selectedRole?.id}` : "/api/security/roles";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "บันทึกข้อมูลไม่สำเร็จ");

      showSuccess("สำเร็จ", body.message);
      setShowCreateModal(false);
      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      showError("เกิดข้อผิดพลาด", err.message);
    }
  };

  // Submit Clone Role
  const handleCloneRole = async () => {
    if (!selectedRole) return;
    try {
      const res = await fetch(`/api/security/roles/${selectedRole.id}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newCode: formData.code,
          newNameTh: formData.nameTh,
          newNameEn: formData.nameEn,
          newDescription: formData.description,
          reason: formData.reason,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "คัดลอกบทบาทไม่สำเร็จ");
      showSuccess("สำเร็จ", body.message);
      setShowCloneModal(false);
      loadData();
    } catch (err: any) {
      showError("เกิดข้อผิดพลาด", err.message);
    }
  };

  // Delete Role
  const handleDeleteRole = async (role: Role) => {
    const confirmed = await showConfirm(
      "ยืนยันการลบบทบาท?",
      `คุณต้องการลบบทบาท "${role.nameTh}" (${role.code}) หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/security/roles/${role.id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "ลบไม่สำเร็จ");
      showSuccess("สำเร็จ", body.message);
      loadData();
    } catch (err: any) {
      showError("เกิดข้อผิดพลาด", err.message);
    }
  };

  const filteredRoles = roles.filter(
    (r) =>
      r.nameTh.toLowerCase().includes(search.toLowerCase()) ||
      r.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Shield className="w-4 h-4" />
            <span>Central Identity & Access Management (IAM)</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">จัดการบทบาทและสิทธิ์ (Role Manager)</h1>
          <p className="text-xs text-slate-400 mt-1">
            ควบคุมผู้ใช้ทุกระดับ ทุกแผนก สิทธิ์การเข้าถึงข้อมูล และ Separation of Duties จากจุดเดียว
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/dashboard"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 shadow-sm transition-all active:scale-95"
            title="กลับไปยังหน้าแรกแดชบอร์ด"
          >
            <Home className="w-4 h-4 text-brand-400" />
            <span>กลับหน้าแรก</span>
          </Link>
          <button
            onClick={() => {
              setFormData({
                code: "",
                nameTh: "",
                nameEn: "",
                description: "",
                level: 1,
                departmentType: "OPERATIONS",
                permissionIds: [],
                reason: "สร้าง Role ใหม่",
              });
              setShowCreateModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างบทบาทใหม่</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-surface-border pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("roles")}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all",
            activeTab === "roles"
              ? "bg-brand-600 text-white shadow-md"
              : "text-content-secondary hover:bg-surface-subtle"
          )}
        >
          <Shield className="w-4 h-4" />
          <span>บทบาทระบบ ({roles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("permissions")}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all",
            activeTab === "permissions"
              ? "bg-brand-600 text-white shadow-md"
              : "text-content-secondary hover:bg-surface-subtle"
          )}
        >
          <KeyRound className="w-4 h-4" />
          <span>คลังสิทธิ์ (Permissions: {allPermissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("authorities")}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all",
            activeTab === "authorities"
              ? "bg-brand-600 text-white shadow-md"
              : "text-content-secondary hover:bg-surface-subtle"
          )}
        >
          <FileCheck className="w-4 h-4" />
          <span>วงเงิน & ระดับอนุมัติ (Approval Authorities)</span>
        </button>
      </div>

      {/* Search Bar */}
      {activeTab === "roles" && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อบทบาท, รหัส หรือแผนก..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-sm"
            />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            พบทั้งหมด <span className="font-bold text-slate-900 dark:text-white">{filteredRoles.length}</span> บทบาท
          </div>
        </div>
      )}

      {/* Roles Grid */}
      {activeTab === "roles" && (
        loading ? (
          <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-500 animate-pulse">
            กำลังโหลดข้อมูลบทบาทและสิทธิ์จาก MySQL...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map((role) => {
              const sensitiveCount = role.permissions.filter(
                (p) => p.permission.sensitivity === "CRITICAL" || p.permission.sensitivity === "SENSITIVE"
              ).length;

              return (
                <div
                  key={role.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {role.code}
                        </span>
                        {role.isSystem && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            SYSTEM
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                        Level {role.level}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      {role.nameTh}
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-2">
                      {role.nameEn}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {role.description || "ไม่มีคำอธิบาย"}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">ผู้ใช้งานบทบาทนี้</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {role._count.userAssignments} คน
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">สิทธิ์ที่เปิดใช้งาน</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {role.permissions.length} สิทธิ์
                        </span>
                      </div>
                    </div>

                    {sensitiveCount > 0 && (
                      <div className="flex items-center space-x-1.5 text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>มีสิทธิ์ระดับ Sensitive/Critical {sensitiveCount} รายการ</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => openCloneRole(role)}
                        title="Clone Role"
                        className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => openEditRole(role)}
                        title="แก้ไขบทบาทและสิทธิ์"
                        className="p-2 rounded-xl text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {!role.isSystem && (
                        <button
                          onClick={() => handleDeleteRole(role)}
                          title="ลบบทบาท"
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Permissions Tab */}
      {activeTab === "permissions" && (
        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([module, perms]) => (
            <div key={module} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                  <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400 mr-2" />
                  โมดูล: {module}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{perms.length} สิทธิ์</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {perms.map((p) => (
                  <div key={p.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[11px] text-slate-900 dark:text-white">{p.code}</span>
                      <span
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded",
                          p.sensitivity === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                            : p.sensitivity === "SENSITIVE"
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                            : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        {p.sensitivity}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">{p.description}</p>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">Action: {p.action}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Edit / Create Role */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-brand-600 dark:text-brand-400" />
                {showEditModal ? `แก้ไขบทบาท: ${selectedRole?.nameTh}` : "สร้างบทบาทใหม่ (Create Role)"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ปิด
              </button>
            </div>

            {/* Basic Role Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">รหัสบทบาท (Code)</label>
                <input
                  type="text"
                  disabled={showEditModal && selectedRole?.isSystem}
                  placeholder="เช่น HR_SENIOR_OFFICER"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs outline-none focus:ring-2 focus:ring-brand-500 font-mono disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">ชื่อบทบาทภาษาไทย</label>
                <input
                  type="text"
                  placeholder="เช่น เจ้าหน้าที่บุคคลอาวุโส"
                  value={formData.nameTh}
                  onChange={(e) => setFormData({ ...formData, nameTh: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">ชื่อภาษาอังกฤษ</label>
                <input
                  type="text"
                  placeholder="เช่น Senior HR Officer"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">ระดับบทบาท (Level 1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">แผนกที่สังกัด</label>
                <select
                  value={formData.departmentType}
                  onChange={(e) => setFormData({ ...formData, departmentType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="OPERATIONS">Operations (ฝ่ายปฏิบัติการ)</option>
                  <option value="HR">HR (ทรัพยากรบุคคล)</option>
                  <option value="FINANCE">Finance (การเงินและบัญชี)</option>
                  <option value="PROCUREMENT">Procurement (จัดซื้อ)</option>
                  <option value="QHSE">QHSE (ความปลอดภัย)</option>
                  <option value="MANAGEMENT">Management (ผู้บริหาร)</option>
                  <option value="SECURITY">Security (ความปลอดภัยระบบ)</option>
                  <option value="IT">IT (เทคโนโลยีสารสนเทศ)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">คำอธิบายขอบเขตงาน</label>
              <textarea
                rows={2}
                placeholder="อธิบายหน้าที่และความรับผิดชอบของบทบาทนี้..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Permissions Selection Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    กำหนดสิทธิ์การใช้งาน
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                    เลือก {formData.permissionIds.length} รายการ
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  คลิกที่สิทธิ์เพื่อเปิด/ปิด
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {Object.entries(groupedPermissions).map(([module, perms]) => {
                  const selectedInModule = perms.filter((p) => formData.permissionIds.includes(p.id)).length;
                  const allSelectedInModule = perms.length > 0 && selectedInModule === perms.length;

                  return (
                    <div key={module} className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">{module}</p>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            ({selectedInModule}/{perms.length})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const ids = perms.map((p) => p.id);
                            setFormData((prev) => ({
                              ...prev,
                              permissionIds: allSelectedInModule
                                ? prev.permissionIds.filter((id) => !ids.includes(id))
                                : Array.from(new Set([...prev.permissionIds, ...ids])),
                            }));
                          }}
                          className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                        >
                          {allSelectedInModule ? "ยกเลิกทั้งโมดูล" : "เลือกทั้งหมด"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {perms.map((p) => {
                          const isChecked = formData.permissionIds.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => togglePermission(p.id)}
                              className={cn(
                                "p-2.5 rounded-xl text-left border text-[11px] transition-all flex items-start space-x-2.5 cursor-pointer shadow-xs",
                                isChecked
                                  ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 dark:border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500/20"
                                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-0 cursor-pointer pointer-events-none"
                              />
                              <div className="overflow-hidden flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={cn(
                                    "font-mono text-[10px] font-bold truncate",
                                    isChecked ? "text-emerald-800 dark:text-emerald-300" : "text-slate-900 dark:text-slate-100"
                                  )}>
                                    {p.code}
                                  </span>
                                  {p.sensitivity === "CRITICAL" && (
                                    <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
                                      CRIT
                                    </span>
                                  )}
                                  {p.sensitivity === "SENSITIVE" && (
                                    <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                                      SENS
                                    </span>
                                  )}
                                </div>
                                <span className={cn(
                                  "text-[10px] block mt-0.5 leading-snug truncate",
                                  isChecked ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
                                )}>
                                  {p.description}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reason for Audit Log */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                เหตุผลในการแก้ไข/สร้าง (Audit Trail)
              </label>
              <input
                type="text"
                placeholder="เช่น ปรับปรุงสิทธิ์ประจำไตรมาส, เพิ่มบทบาททีมงานใหม่"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
                className="px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleSaveRole(showEditModal)}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg active:scale-95 transition-all"
              >
                {showEditModal ? "บันทึกการแก้ไขสิทธิ์" : "ยืนยันสร้างบทบาท"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Clone Role */}
      {showCloneModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 font-sans">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <Copy className="w-5 h-5 mr-2 text-brand-600 dark:text-brand-400" />
              คัดลอกบทบาท (Clone Role: {selectedRole?.nameTh})
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">รหัสบทบาทใหม่ (New Code)</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">ชื่อบทบาทใหม่ภาษาไทย</label>
                <input
                  type="text"
                  value={formData.nameTh}
                  onChange={(e) => setFormData({ ...formData, nameTh: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">ชื่อภาษาอังกฤษ</label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">เหตุผลในการคัดลอก</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowCloneModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleCloneRole}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
              >
                คัดลอกทันที
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
