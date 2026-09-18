import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ShieldCheck, Lock, Users, Layers, FileCheck, ArrowRight, ShieldAlert } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const SECURITY_TABS = [
  { label: "ศูนย์ความปลอดภัย", href: "/admin/security" },
  { label: "ผู้ใช้งาน (Users)", href: "/admin/security/users" },
  { label: "บทบาทและสิทธิ์ (Roles)", href: "/admin/security/roles" },
  { label: "รายการสิทธิ์ (Permissions)", href: "/admin/security/permissions" },
  { label: "ตารางสิทธิ์ (Matrix)", href: "/admin/security/permission-matrix" },
  { label: "สิทธิ์ระดับแผนก", href: "/admin/security/department-access" },
  { label: "อำนาจอนุมัติ (Approval Matrix)", href: "/admin/security/approval-matrix" },
  { label: "จัดการ Session", href: "/admin/security/sessions" },
  { label: "อุปกรณ์ที่เข้าสู่ระบบ", href: "/admin/security/devices" },
  { label: "คำขอเข้าถึงข้อมูล", href: "/admin/security/access-requests" },
  { label: "ทบทวนสิทธิ์ (Access Review)", href: "/admin/security/access-review" },
  { label: "บันทึกการตรวจสอบ (Audit Log)", href: "/admin/security/audit" },
];

export default async function SecurityCenterOverviewPage() {
  const [usersCount, rolesCount, permissionsCount, activeSessions, auditLogsCount] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.userSession.count({ where: { status: "ACTIVE" } }),
    prisma.auditLog.count(),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="ENTERPRISE SECURITY & GOVERNANCE"
        title="ศูนย์ความปลอดภัยและการกำกับดูแลสิทธิ์ (Security Center)"
        description="การควบคุมการเข้าถึงตามบทบาท (RBAC), การจำกัดขอบเขตข้อมูล (Data Scoping), การจัดการเซสชัน และบันทึกการตรวจสอบความปลอดภัย"
        breadcrumbs={[{ label: "ศูนย์ความปลอดภัยระบบ" }]}
      />

      <EnterpriseModuleNav tabs={SECURITY_TABS} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ผู้ใช้งานทั้งหมด</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{usersCount} บัญชี</div>
          <p className="text-[11px] text-content-muted">MySQL User Accounts</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>บทบาทและกลุ่มสิทธิ์</span>
            <Lock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-indigo-600">{rolesCount} บทบาท</div>
          <p className="text-[11px] text-content-muted">{permissionsCount} Granular Permissions</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>Active Sessions</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">{activeSessions} เซสชัน</div>
          <p className="text-[11px] text-emerald-600 font-bold">กำลังออนไลน์ในขณะนี้</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>บันทึก Audit Logs</span>
            <FileCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{auditLogsCount.toLocaleString()}</div>
          <p className="text-[11px] text-content-muted">บันทึกกิจกรรมความปลอดภัย</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/security/roles"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Lock className="w-6 h-6 text-brand-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">จัดการบทบาทและสิทธิ์ (Roles Manager)</h3>
          <p className="text-xs text-content-muted mt-1">สร้าง แก้ไข โคลนบทบาท และกำหนดระดับความไว้วางใจ</p>
        </Link>

        <Link
          href="/admin/security/permission-matrix"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">ตารางสิทธิ์การใช้งาน (Permission Matrix)</h3>
          <p className="text-xs text-content-muted mt-1">เมทริกซ์สิทธิ์ละเอียดระดับโมดูล Action และความละเอียดอ่อน</p>
        </Link>

        <Link
          href="/admin/security/sessions"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Layers className="w-6 h-6 text-emerald-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">จัดการเซสชันผู้ใช้งาน (Session Manager)</h3>
          <p className="text-xs text-content-muted mt-1">ตรวจสอบอุปกรณ์ IP Address และสั่งตัดการเชื่อมต่อ (Revoke Session)</p>
        </Link>
      </div>
    </div>
  );
}
