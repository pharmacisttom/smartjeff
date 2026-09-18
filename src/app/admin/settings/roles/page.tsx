"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Users,
  Lock,
  CheckCircle2,
  Plus,
  RefreshCw,
  Sparkles,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/swal";
import { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from "@/lib/rbac/permissions";

export default function RoleSettingsPage() {
  const [users, setUsers] = useState([
    { id: "1", name: "สมชาย เข็มกลัด (ผู้ดูแลระบบ)", role: "ADMIN", site: "สำนักงานใหญ่" },
    { id: "2", name: "วิชัย ใจดี (หัวหน้าไซต์)", role: "SUPERVISOR", site: "อมตะ ซิตี้" },
    { id: "3", name: "พัดมา วงค์คำ (พนักงาน)", role: "USER", site: "มาบตาพุด" },
    { id: "4", name: "Tomvis (ผู้พัฒนา)", role: "SUPERADMIN", site: "ผู้พัฒนาศูนย์กลาง" },
  ]);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState("ADMIN");

  const handleChangeRole = (userId: string, newRole: string) => {
    setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    showSuccess("เปลี่ยนบทบาทสิทธิ์สำเร็จ!", `อัปเดตสิทธิ์ใช้งานเป็น ${newRole} เรียบร้อยแล้ว`);
    setSelectedUser(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 p-6 rounded-3xl text-white shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-brand-400 tracking-wider uppercase">ROLE-BASED ACCESS CONTROL (RBAC)</span>
            <h1 className="text-2xl font-black tracking-tight">การจัดการสิทธิ์ใช้งานตามบทบาท</h1>
            <p className="text-xs text-slate-300">
              แบ่งสิทธิ์ 4 ระดับ (SUPERADMIN, ADMIN, SUPERVISOR, USER) และกำหนดขอบเขตพนักงานตามไซต์งาน
            </p>
          </div>
        </div>
      </div>

      {/* Role Hierarchy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { code: "SUPERADMIN", level: "Level 1", name: "ผู้ดูแลระบบสูงสุด", desc: "สิทธิ์การเข้าถึงทุกอย่างและ API Keys", color: "border-purple-500/30 bg-purple-500/5 text-purple-600" },
          { code: "ADMIN", level: "Level 2", name: "ผู้จัดการบริษัท", desc: "การเงิน, พนักงาน, ตั้งค่าแจ้งเตือน", color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600" },
          { code: "SUPERVISOR", level: "Level 3", name: "หัวหน้างานไซต์", desc: "อนุมัติลา/OT, อนุมัตินอกพื้นที่ทีม", color: "border-blue-500/30 bg-blue-500/5 text-blue-600" },
          { code: "USER", level: "Level 4", name: "พนักงานทั่วไป", desc: "ลงเวลาเข้า/ออกงาน, ดูสลิปตัวเอง", color: "border-slate-500/30 bg-slate-500/5 text-slate-600" },
        ].map((r) => (
          <div key={r.code} className={`p-5 rounded-3xl border ${r.color} space-y-2 shadow-sm`}>
            <div className="flex items-center justify-between text-xs font-bold">
              <span>{r.level}</span>
              <span className="font-mono">{r.code}</span>
            </div>
            <h3 className="font-bold text-content-primary text-base">{r.name}</h3>
            <p className="text-xs text-content-muted leading-relaxed">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* User Role Assignment Table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <h2 className="text-base font-bold text-content-primary">รายชื่อผู้ใช้และการกำหนดสิทธิ์</h2>
          <span className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
            {users.length} Usersในระบบ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-surface-border text-content-muted font-bold uppercase bg-surface-subtle">
                <th className="py-3 px-4">ชื่อผู้ใช้ / บทบาท</th>
                <th className="py-3 px-4">ไซต์งานสังกัด</th>
                <th className="py-3 px-4">บทบาทปัจจุบัน</th>
                <th className="py-3 px-4 text-right">เปลี่ยนบทบาทสิทธิ์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-subtle transition-colors">
                  <td className="py-3.5 px-4 font-bold text-content-primary">{u.name}</td>
                  <td className="py-3.5 px-4 text-content-secondary">{u.site}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        u.role === "SUPERADMIN"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : u.role === "ADMIN"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : u.role === "SUPERVISOR"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u.id, e.target.value)}
                      className="bg-surface-subtle border border-surface-border rounded-xl px-2.5 py-1 text-xs font-bold text-content-primary focus:outline-none"
                    >
                      <option value="USER">USER (Level 4)</option>
                      <option value="SUPERVISOR">SUPERVISOR (Level 3)</option>
                      <option value="ADMIN">ADMIN (Level 2)</option>
                      <option value="SUPERADMIN">SUPERADMIN (Level 1)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
