import { Shield, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
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

const POLICIES = [
  { id: "POL-01", name: "PDPA & PII Redaction Policy", description: "ตรวจจับและปกปิดข้อมูลส่วนบุคคล (เลขบัตร ปชช., บัญชีธนาคาร, เบอร์โทร) ก่อนส่งเข้า AI Model", status: "ENFORCED" },
  { id: "POL-02", name: "High-Risk Human Approval Requirement", description: "การกระทำที่เกี่ยวกับเงินเดือน โยกย้ายพนักงาน หรือจ่ายเงินเกิน 10,000 บาท ต้องมีมนุษย์อนุมัติเสมอ", status: "ENFORCED" },
  { id: "POL-03", name: "Audit Trail Immutability", description: "ทุก Prompt, คำตอบ และ Action Proposal ต้องบันทึกเข้า Audit Log และไม่สามารถแก้ไขย้อนหลังได้", status: "ENFORCED" },
  { id: "POL-04", name: "Hallucination Guardrails", description: "จำกัดขอบเขตการตอบคำถามให้อ้างอิงเฉพาะเอกสารและฐานข้อมูลภายในองค์กรเท่านั้น (Strict RAG)", status: "ENFORCED" },
];

export default function AIPoliciesPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="AI / SAFETY POLICIES"
        title="นโยบายความปลอดภัยและการควบคุม AI (AI Safety Policies)"
        description="กรอบนโยบายความปลอดภัย การป้องกันข้อมูลรั่วไหล (DLP) และการควบคุมพฤติกรรมของ AI"
        breadcrumbs={[
          { label: "ศูนย์ควบคุม AI", href: "/admin/ai" },
          { label: "นโยบาย AI (Policies)" },
        ]}
      />

      <EnterpriseModuleNav tabs={AI_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">นโยบายความปลอดภัย AI ที่บังคับใช้</h2>
          <span className="text-xs text-emerald-600 font-bold">100% Policy Compliance</span>
        </div>

        <div className="space-y-3">
          {POLICIES.map((p) => (
            <div key={p.id} className="p-5 rounded-2xl bg-surface-subtle border border-surface-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                  {p.id}
                </span>
                <span className="flex items-center text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  {p.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-content-primary">{p.name}</h3>
              <p className="text-xs text-content-secondary">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
