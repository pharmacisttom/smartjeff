import { prisma } from "@/lib/prisma";
import { GitPullRequest, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const AUTOMATION_TABS = [
  { label: "ภาพรวมระบบอัตโนมัติ", href: "/admin/automation" },
  { label: "กระบวนการอนุมัติ (Workflows)", href: "/admin/automation/workflows" },
  { label: "กฎเกณฑ์อัตโนมัติ (Rules)", href: "/admin/automation/rules" },
  { label: "บันทึกเหตุการณ์ (Events)", href: "/admin/automation/events" },
  { label: "คิวประมวลผล (Queues)", href: "/admin/automation/queues" },
  { label: "Dead-Letter Queue", href: "/admin/automation/dead-letter" },
];

export default async function AutomationWorkflowsPage() {
  const approvals = await prisma.workflowApproval.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="AUTOMATION / WORKFLOW APPROVALS"
        title="กระบวนการและสายการอนุมัติ (Approval Workflows)"
        description="ติดตามขั้นตอนการอนุมัติเอกสารหลายลำดับขั้น (Multi-level Approvals) และสถานะการพิจารณา"
        breadcrumbs={[
          { label: "ระบบอัตโนมัติ", href: "/admin/automation" },
          { label: "กระบวนการอนุมัติ (Workflows)" },
        ]}
      />

      <EnterpriseModuleNav tabs={AUTOMATION_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการสายการอนุมัติ ({approvals.length})</h2>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {approvals.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <GitPullRequest className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีรายการที่อยู่ในสายการอนุมัติ</p>
            <p className="text-xs">เมื่อมีคำขอลา ขอโอที หรือใบขอซื้อ รายการจะเข้าสู่สายอนุมัติอัตโนมัติ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">ประเภทเอกสาร</th>
                  <th className="p-3">รหัสอ้างอิงเอกสาร</th>
                  <th className="p-3">ลำดับขั้น (Step)</th>
                  <th className="p-3">วันที่ส่งคำขอ</th>
                  <th className="p-3">หมายเหตุ / เหตุผล</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {approvals.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-bold text-content-primary">{a.entityType}</td>
                    <td className="p-3 font-mono text-brand-600">{a.entityId}</td>
                    <td className="p-3 font-bold text-indigo-600">Step {a.step}</td>
                    <td className="p-3 text-content-muted">{new Date(a.createdAt).toLocaleDateString("th-TH")}</td>
                    <td className="p-3 text-content-secondary max-w-xs truncate">{a.reason || "-"}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        a.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : a.status === "REJECTED"
                          ? "bg-rose-500/10 text-rose-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {a.status}
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
