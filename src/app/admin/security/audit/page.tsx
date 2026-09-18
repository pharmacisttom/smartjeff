import { prisma } from "@/lib/prisma";
import { FileCheck, ShieldAlert, Calendar, Users } from "lucide-react";
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

export default async function SecurityAuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="SECURITY / AUDIT TRAILS"
        title="บันทึกการตรวจสอบความปลอดภัยระบบ (Security Audit Trail)"
        description="ประวัติกิจกรรมสำคัญ การเข้าสู่ระบบ การแก้ไขสิทธิ์ การเข้าถึงข้อมูลความลับ และการลบข้อมูล (Tamper-evident Audit Logs)"
        breadcrumbs={[
          { label: "ศูนย์ความปลอดภัย", href: "/admin/security" },
          { label: "บันทึกการตรวจสอบ (Audit Log)" },
        ]}
      />

      <EnterpriseModuleNav tabs={SECURITY_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">บันทึกเหตุการณ์ความปลอดภัย ({logs.length} รายการ)</h2>
          <span className="text-xs text-content-muted">MySQL AuditLog</span>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <FileCheck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีบันทึกกิจกรรมความปลอดภัย</p>
            <p className="text-xs">กิจกรรมล็อกอิน การแก้ไขสิทธิ์ และการเข้าถึงระบบจะถูกบันทึกที่นี่อัตโนมัติ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เวลา</th>
                  <th className="p-3">การกระทำ (Action)</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3 rounded-r-xl">รายละเอียด (Metadata)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 text-content-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("th-TH")}
                    </td>
                    <td className="p-3 font-bold text-brand-600">{log.action}</td>
                    <td className="p-3 font-semibold text-content-primary">{log.entity}</td>
                    <td className="p-3 font-mono text-content-secondary">{log.ipAddress || "127.0.0.1"}</td>
                    <td className="p-3 text-content-secondary font-mono text-[11px] max-w-sm truncate">
                      {log.metadata || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
