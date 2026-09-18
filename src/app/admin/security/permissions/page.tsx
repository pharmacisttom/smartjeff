import { prisma } from "@/lib/prisma";
import { KeyRound, ShieldCheck, Tag } from "lucide-react";
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

export default async function SecurityPermissionsCatalogPage() {
  const permissions = await prisma.permission.findMany({
    include: {
      _count: { select: { roles: true } },
    },
    orderBy: [{ module: "asc" }, { code: "asc" }],
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="SECURITY / PERMISSIONS REGISTRY"
        title="สารบบสิทธิ์การเข้าถึง (Permissions Registry)"
        description="รายการสิทธิ์การใช้งานระบบระดับละเอียด (Granular Permissions) แยกตามโมดูลและระดับความสำคัญ"
        breadcrumbs={[
          { label: "ศูนย์ความปลอดภัย", href: "/admin/security" },
          { label: "รายการสิทธิ์ (Permissions)" },
        ]}
      />

      <EnterpriseModuleNav tabs={SECURITY_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">สิทธิ์ทั้งหมดในระบบ ({permissions.length} รายการ)</h2>
          <span className="text-xs text-content-muted">Central Security Registry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3 rounded-l-xl">รหัสสิทธิ์ (Code)</th>
                <th className="p-3">โมดูล</th>
                <th className="p-3">การกระทำ (Action)</th>
                <th className="p-3">คำอธิบาย</th>
                <th className="p-3">ระดับความไว้วางใจ</th>
                <th className="p-3 rounded-r-xl">บทบาทที่ถือครอง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {permissions.map((p) => (
                <tr key={p.id} className="hover:bg-surface-subtle/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-brand-600">{p.code}</td>
                  <td className="p-3 font-bold text-content-primary">{p.module}</td>
                  <td className="p-3 text-content-secondary">{p.action}</td>
                  <td className="p-3 text-content-secondary max-w-xs truncate">{p.description}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.sensitivity === "CRITICAL"
                        ? "bg-rose-500/10 text-rose-600"
                        : p.sensitivity === "SENSITIVE"
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-blue-500/10 text-blue-600"
                    }`}>
                      {p.sensitivity}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-indigo-600">{p._count.roles} บทบาท</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
