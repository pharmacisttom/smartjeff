import { ShieldCheck, Database, FileCheck, Users } from "lucide-react";
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

export default function AIGovernancePage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="AI / ENTERPRISE GOVERNANCE"
        title="ธรรมาภิบาลและการกำกับดูแล AI (AI Governance)"
        description="กรอบการกำกับดูแลความโปร่งใส ตรวจสอบย้อนกลับได้ (Explainable AI) และความรับผิดชอบในการประมวลผลข้อมูล"
        breadcrumbs={[
          { label: "ศูนย์ควบคุม AI", href: "/admin/ai" },
          { label: "ธรรมาภิบาล AI (Governance)" },
        ]}
      />

      <EnterpriseModuleNav tabs={AI_TABS} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 space-y-2 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-indigo-600" />
          <h3 className="font-bold text-sm text-content-primary">ความโปร่งใสและตรวจสอบได้</h3>
          <p className="text-xs text-content-muted leading-relaxed">
            ทุกคำตอบและการเสนอแนะของ AI มีการอ้างอิงแหล่งที่มาของข้อมูล (Source Grounding) จากตารางในระบบ
          </p>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 space-y-2 shadow-sm">
          <Database className="w-8 h-8 text-emerald-600" />
          <h3 className="font-bold text-sm text-content-primary">ความเป็นส่วนตัวของข้อมูล (Data Privacy)</h3>
          <p className="text-xs text-content-muted leading-relaxed">
            ข้อมูลองค์กรจะไม่ถูกนำไปใช้เทรนโมเดลสาธารณะ ประมวลผลภายในขอบเขต Enterprise Boundary เท่านั้น
          </p>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 space-y-2 shadow-sm">
          <Users className="w-8 h-8 text-brand-600" />
          <h3 className="font-bold text-sm text-content-primary">มนุษย์เป็นผู้มีอำนาจตัดสินใจสูงสุด</h3>
          <p className="text-xs text-content-muted leading-relaxed">
            สถาปัตยกรรม Human-in-the-Loop กำหนดให้คำสั่งที่มีผลกระทบต่อบุคลากรหรือการเงินต้องผ่านการอนุมัติเสมอ
          </p>
        </div>
      </div>
    </div>
  );
}
