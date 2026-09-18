import { prisma } from "@/lib/prisma";
import { DollarSign, ShieldCheck, CheckCircle2, Lock } from "lucide-react";
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

export default async function SecurityApprovalMatrixPage() {
  const authorities = await prisma.approvalAuthority.findMany({
    include: {
      role: { select: { nameTh: true, code: true } },
    },
    orderBy: { module: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="SECURITY / DELEGATION OF AUTHORITY"
        title="ตารางอำนาจอนุมัติและวงเงิน (Approval Matrix)"
        description="การกำหนดเพดานวงเงินและอำนาจการอนุมัติ (Delegation of Authority - DOA) ตามบทบาทและโมดูล"
        breadcrumbs={[
          { label: "ศูนย์ความปลอดภัย", href: "/admin/security" },
          { label: "อำนาจอนุมัติ (Approval Matrix)" },
        ]}
      />

      <EnterpriseModuleNav tabs={SECURITY_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">เกณฑ์อำนาจอนุมัติทั้งหมด ({authorities.length})</h2>
          <span className="text-xs text-content-muted">MySQL ApprovalAuthority</span>
        </div>

        {authorities.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Lock className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีการกำหนดเพดานอำนาจอนุมัติ</p>
            <p className="text-xs">สามารถกำหนดเพดานวงเงินอนุมัติ PO, เบิกจ่ายงบประมาณ, และสัญญาได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">บทบาท (Role)</th>
                  <th className="p-3">โมดูล</th>
                  <th className="p-3">การกระทำ (Action)</th>
                  <th className="p-3">ระดับ (Level)</th>
                  <th className="p-3">วงเงินขั้นต่ำ</th>
                  <th className="p-3">วงเงินสูงสุด</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {authorities.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-bold text-content-primary">
                      {a.role.nameTh}
                      <span className="block text-[10px] font-mono text-brand-600">{a.role.code}</span>
                    </td>
                    <td className="p-3 font-semibold text-indigo-600">{a.module}</td>
                    <td className="p-3 text-content-secondary">{a.action}</td>
                    <td className="p-3 font-bold text-content-primary">{a.level}</td>
                    <td className="p-3 text-content-muted">฿{Number(a.minAmount || 0).toLocaleString()}</td>
                    <td className="p-3 font-bold text-emerald-600">
                      {a.maxAmount ? `฿${Number(a.maxAmount).toLocaleString()}` : "ไม่จำกัดวงเงิน"}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                        {a.isEnabled ? "เปิดใช้งาน" : "ปิด"}
                      </span>
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
