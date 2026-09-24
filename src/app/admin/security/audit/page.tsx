import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FileCheck, ShieldCheck, Lock, ExternalLink } from "lucide-react";
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
  { label: "Data Log Prevention (DLP)", href: "/admin/security/dlp" },
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
        description="ประวัติกิจกรรมสำคัญ การเข้าสู่ระบบ การแก้ไขสิทธิ์ การเข้าถึงข้อมูลความลับ และการลบข้อมูล (Tamper-evident Audit Logs with DLP Protection)"
        breadcrumbs={[
          { label: "ศูนย์ความปลอดภัย", href: "/admin/security" },
          { label: "บันทึกการตรวจสอบ (Audit Log)" },
        ]}
      />

      <EnterpriseModuleNav tabs={SECURITY_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-surface-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-content-primary">
              บันทึกเหตุการณ์ความปลอดภัย ({logs.length} รายการ)
            </h2>
            <p className="text-xs text-content-muted">
              ทุกล็อกผ่านการตรวจกรองข้อมูลส่วนบุคคล (DLP Sanitized) และลงลายเซ็นแฮชป้องกันการดัดแปลง (HMAC-SHA256)
            </p>
          </div>
          <Link
            href="/admin/security/dlp"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 rounded-xl text-xs font-semibold border border-blue-500/20 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" /> ตรวจสอบความสมบูรณ์ล็อก (DLP Anti-Tamper) <ExternalLink className="w-3 h-3" />
          </Link>
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
                  <th className="p-3">สถานะ DLP</th>
                  <th className="p-3 rounded-r-xl">รายละเอียด (Metadata)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {logs.map((log) => {
                  let isDlpProtected = false;
                  let signatureSnippet: string | null = null;

                  if (log.metadata) {
                    try {
                      const parsed = JSON.parse(log.metadata);
                      if (parsed._dlpProtected) isDlpProtected = true;
                      if (parsed._dlpSignature) signatureSnippet = parsed._dlpSignature.substring(0, 8);
                    } catch {
                      // ignore
                    }
                  }

                  return (
                    <tr key={log.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="p-3 text-content-muted whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("th-TH")}
                      </td>
                      <td className="p-3 font-bold text-brand-600">{log.action}</td>
                      <td className="p-3 font-semibold text-content-primary">{log.entity}</td>
                      <td className="p-3 font-mono text-content-secondary">{log.ipAddress || "127.0.0.1"}</td>
                      <td className="p-3">
                        {isDlpProtected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" /> DLP Masked
                            {signatureSnippet && <span className="font-mono opacity-70">#{signatureSnippet}</span>}
                          </span>
                        ) : (
                          <span className="text-[10px] text-content-muted font-mono">Standard</span>
                        )}
                      </td>
                      <td className="p-3 text-content-secondary font-mono text-[11px] max-w-sm truncate">
                        {log.metadata || "-"}
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
