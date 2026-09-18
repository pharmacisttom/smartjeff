import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Cpu, Zap, GitPullRequest, Layers, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
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

export default async function AutomationOverviewPage() {
  const [approvals, outboxCount, deadLetterCount] = await Promise.all([
    prisma.workflowApproval.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
    prisma.eventOutbox.count({ where: { status: "PROCESSED" } }),
    prisma.eventOutbox.count({ where: { status: "FAILED" } }),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="ENTERPRISE AUTOMATION ENGINE"
        title="ศูนย์ควบคุมระบบอัตโนมัติ (Workflow Automation Engine)"
        description="การประมวลผลขั้นตอนการอนุมัติอัตโนมัติ (Multi-step Approvals), Event Outbox Bus และการจัดการคิวงานเบื้องหลัง"
        breadcrumbs={[{ label: "ระบบอัตโนมัติ (Automation)" }]}
      />

      <EnterpriseModuleNav tabs={AUTOMATION_TABS} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>การอนุมัติรอดำเนินการ</span>
            <GitPullRequest className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-3xl font-black text-brand-600">{approvals.length} รายการ</div>
          <p className="text-[11px] text-content-muted">Workflows ในระบบ</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>เหตุการณ์ที่ประมวลแล้ว</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">{outboxCount} Events</div>
          <p className="text-[11px] text-emerald-600 font-bold">Outbox Processed</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>เหตุการณ์ที่ล้มเหลว</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-600">{deadLetterCount} Events</div>
          <p className="text-[11px] text-content-muted">Dead-Letter Queue</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>สถานะระบบอัตโนมัติ</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 mt-1">OPERATIONAL</div>
          <p className="text-[11px] text-content-muted">Workers Active</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/automation/workflows"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <GitPullRequest className="w-6 h-6 text-brand-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">ขั้นตอนการอนุมัติ (Approval Workflows)</h3>
          <p className="text-xs text-content-muted mt-1">ตรวจสอบลำดับขั้นการอนุมัติ เอกสาร PR, การลา, และการเบิกเงิน</p>
        </Link>

        <Link
          href="/admin/automation/events"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Zap className="w-6 h-6 text-indigo-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">บันทึกเหตุการณ์ (Event Outbox)</h3>
          <p className="text-xs text-content-muted mt-1">Transaction Outbox Pattern ป้องกันข้อมูลสูญหายระหว่าง Service</p>
        </Link>

        <Link
          href="/admin/automation/dead-letter"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <AlertCircle className="w-6 h-6 text-rose-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">คิวข้อผิดพลาด (Dead-Letter Queue)</h3>
          <p className="text-xs text-content-muted mt-1">ตรวจสอบงานที่ล้มเหลวและสั่งรันซ้ำ (Retry Mechanism)</p>
        </Link>
      </div>
    </div>
  );
}
