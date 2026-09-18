import { Bot, Sparkles, Send, ShieldCheck } from "lucide-react";
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

export default function AICopilotStudioPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="AI / COPILOT STUDIO"
        title="SmartJeff Copilot Studio (AI Work Assistant)"
        description="ผู้ช่วย AI ระดับองค์กร ปรึกษากฎหมายแรงงาน วิเคราะห์ข้อมูลหน้างาน และช่วยร่างเอกสารสัญญา"
        breadcrumbs={[
          { label: "ศูนย์ควบคุม AI", href: "/admin/ai" },
          { label: "AI ผู้ช่วย (Copilot)" },
        ]}
      />

      <EnterpriseModuleNav tabs={AI_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 p-4 bg-brand-500/10 border border-brand-500/20 rounded-2xl">
          <Bot className="w-8 h-8 text-brand-600 shrink-0" />
          <div>
            <h3 className="font-bold text-sm text-content-primary">SmartJeff AI Agent v2.5 พร้อมให้บริการ</h3>
            <p className="text-xs text-content-muted mt-0.5">
              ระบบเชื่อมต่อกับฐานข้อมูล SmartJeff MySQL เพื่อค้นหาข้อมูลพนักงาน วันหยุด กะการทำงาน และข้อบังคับองค์กร
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-1">
            <span className="text-xs font-bold text-indigo-600">คำถามยอดนิยม: กฎหมายแรงงาน</span>
            <p className="text-xs text-content-secondary">&ldquo;การทำงานล่วงเวลา (OT) ในวันหยุดนักขัตฤกษ์คิดเรทอย่างไร?&rdquo;</p>
          </div>
          <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-1">
            <span className="text-xs font-bold text-emerald-600">คำถามยอดนิยม: สถิติไซต์งาน</span>
            <p className="text-xs text-content-secondary">&ldquo;สรุปยอดขาดลามาสายของโรงงานมาบตาพุดในสัปดาห์นี้&rdquo;</p>
          </div>
          <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-1">
            <span className="text-xs font-bold text-purple-600">คำถามยอดนิยม: สต็อกพัสดุ</span>
            <p className="text-xs text-content-secondary">&ldquo;ตรวจสอบรายการวัสดุที่ยอดคงเหลือต่ำกว่า Reorder Point&rdquo;</p>
          </div>
        </div>
      </div>
    </div>
  );
}
