import { prisma } from "@/lib/prisma";
import { Cpu, CheckCircle2, Calendar } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const AI_TABS = [
  { label: "ภาพรวม AI", href: "/admin/ai" },
  { label: "AI ผู้ช่วย (Copilot)", href: "/admin/ai/copilot" },
  { label: "ข้อเสนอแนะ AI (Proposals)", href: "/admin/ai/proposals" },
  { label: "การกระทำ AI (Actions)", href: "/admin/ai/actions" },
  { label: "นโยบาย AI (Policies)", href: "/admin/ai/policies" },
  { label: "ธรรมาภิบาล AI (Governance)", href: "/admin/ai/governance" },
];

export default async function AIActionsPage() {
  const actions = await prisma.aIActionProposal.findMany({
    where: { status: "EXECUTED" },
    orderBy: { id: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="AI / EXECUTED ACTIONS"
        title="ประวัติการปฏิบัติการอัตโนมัติของ AI (Executed Actions)"
        description="บันทึกการกระทำที่ AI ได้รับความเห็นชอบและสั่งการระบบจริง (Audit Trail)"
        breadcrumbs={[
          { label: "ศูนย์ควบคุม AI", href: "/admin/ai" },
          { label: "การกระทำ AI (Actions)" },
        ]}
      />

      <EnterpriseModuleNav tabs={AI_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">การปฏิบัติการสำเร็จทั้งหมด ({actions.length})</h2>
          <span className="text-xs text-content-muted">MySQL Audit Records</span>
        </div>

        {actions.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีการกระทำที่สั่งการโดย AI</p>
            <p className="text-xs">เมื่อมีการอนุมัติ Action Proposal คำสั่งจะถูกรันและบันทึกผลที่นี่</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">รหัสการกระทำ</th>
                  <th className="p-3">ฟังก์ชันการทำงาน</th>
                  <th className="p-3">เวลาที่สั่งการ</th>
                  <th className="p-3">ผลการตรวจสอบ (Audit Trail)</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {actions.map((act) => (
                  <tr key={act.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{act.id.slice(0, 8)}</td>
                    <td className="p-3 font-bold text-content-primary">{act.tool}</td>
                    <td className="p-3 text-content-muted">
                      {act.executedAt ? new Date(act.executedAt).toLocaleString("th-TH") : "สำเร็จ"}
                    </td>
                    <td className="p-3 text-content-secondary font-mono text-[10px] max-w-xs truncate">
                      {act.auditTrail || "ดำเนินการเรียบร้อย"}
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                        EXECUTED
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
