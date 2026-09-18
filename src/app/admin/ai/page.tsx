import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Bot, Sparkles, Shield, Cpu, ArrowRight, CheckCircle2 } from "lucide-react";
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

export default async function AIOverviewPage() {
  const [proposals, pendingCount, executedCount] = await Promise.all([
    prisma.aIActionProposal.findMany({ take: 5, orderBy: { id: "desc" } }),
    prisma.aIActionProposal.count({ where: { status: "DRAFT" } }),
    prisma.aIActionProposal.count({ where: { status: "EXECUTED" } }),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="ENTERPRISE AI GOVERNANCE"
        title="ศูนย์ควบคุมปัญญาประดิษฐ์และ AI Copilot (AI Center)"
        description="การบริหารจัดการ AI Copilot ข้อเสนอแนะการทำงานอัตโนมัติ (Proposals) และการกำกับดูแลความปลอดภัย (AI Safety & Policies)"
        breadcrumbs={[{ label: "ศูนย์ควบคุม AI" }]}
      />

      <EnterpriseModuleNav tabs={AI_TABS} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ข้อเสนอแนะ AI ทั้งหมด</span>
            <Bot className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{proposals.length} ข้อเสนอ</div>
          <p className="text-[11px] text-content-muted">Action Proposals</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>รอการอนุมัติ (Human in loop)</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600">{pendingCount} รายการ</div>
          <p className="text-[11px] text-amber-600 font-bold">ต้องมีคนกดยืนยัน</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ดำเนินการสำเร็จแล้ว</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">{executedCount} รายการ</div>
          <p className="text-[11px] text-emerald-600 font-bold">Executed by AI</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ความปลอดภัย AI (Safety)</span>
            <Shield className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-indigo-600 mt-1">ENFORCED</div>
          <p className="text-[11px] text-content-muted">Policy Compliance 100%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/ai/copilot"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Bot className="w-6 h-6 text-brand-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">AI ผู้ช่วยอัจฉริยะ (SmartJeff Copilot)</h3>
          <p className="text-xs text-content-muted mt-1">ถาม-ตอบข้อบังคับ กฎหมายแรงงาน สรุปข้อมูล และร่างเอกสาร</p>
        </Link>

        <Link
          href="/admin/ai/proposals"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">ข้อเสนอแนะการทำงาน (Action Proposals)</h3>
          <p className="text-xs text-content-muted mt-1">การเสนอจัดกะ การตรวจสต็อก และการแจ้งเตือนพนักงานแบบอัตโนมัติ</p>
        </Link>

        <Link
          href="/admin/ai/governance"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Shield className="w-6 h-6 text-indigo-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">ธรรมาภิบาลและความปลอดภัย (AI Governance)</h3>
          <p className="text-xs text-content-muted mt-1">กรอบความปลอดภัย การป้องกันข้อมูลรั่วไหล และประวัติการทำงานของ AI</p>
        </Link>
      </div>
    </div>
  );
}
