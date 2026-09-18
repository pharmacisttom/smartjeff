import { prisma } from "@/lib/prisma";
import { Sparkles, CheckCircle2, XCircle, Clock, Shield } from "lucide-react";
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

export default async function AIProposalsPage() {
  const proposals = await prisma.aIActionProposal.findMany({
    orderBy: { id: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="AI / ACTION PROPOSALS"
        title="ข้อเสนอแนะการทำงานจาก AI (AI Action Proposals)"
        description="ข้อเสนอแนะที่ AI วิเคราะห์และเตรียมการไว้ เพื่อให้มนุษย์เป็นผู้ตรวจสอบและกดอนุมัติ (Human-in-the-Loop)"
        breadcrumbs={[
          { label: "ศูนย์ควบคุม AI", href: "/admin/ai" },
          { label: "ข้อเสนอแนะ AI (Proposals)" },
        ]}
      />

      <EnterpriseModuleNav tabs={AI_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการข้อเสนอแนะทั้งหมด ({proposals.length})</h2>
          <span className="text-xs text-content-muted">MySQL AIActionProposal</span>
        </div>

        {proposals.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Sparkles className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีข้อเสนอแนะที่รอดำเนินการ</p>
            <p className="text-xs">เมื่อระบบ AI ตรวจพบความผิดปกติ เช่น จัดกะไม่ครบ หรือสต็อกใกล้หมด จะสร้างข้อเสนอแนะอัตโนมัติ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">รหัสข้อเสนอ</th>
                  <th className="p-3">เครื่องมือ / ฟังก์ชัน (Tool)</th>
                  <th className="p-3">ระดับความเสี่ยง (Risk)</th>
                  <th className="p-3">ข้อมูลอินพุต</th>
                  <th className="p-3">สถานะการตรวจสอบ</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {proposals.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{p.id.slice(0, 8)}</td>
                    <td className="p-3 font-bold text-content-primary">{p.tool}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.riskClass === "HIGH"
                          ? "bg-rose-500/10 text-rose-600"
                          : p.riskClass === "MEDIUM"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-blue-500/10 text-blue-600"
                      }`}>
                        {p.riskClass}
                      </span>
                    </td>
                    <td className="p-3 text-content-secondary font-mono text-[10px] max-w-xs truncate">
                      {p.inputPayload}
                    </td>
                    <td className="p-3 text-content-muted">
                      {p.reviewedAt ? `อนุมัติเมื่อ ${new Date(p.reviewedAt).toLocaleDateString("th-TH")}` : "รออนุมัติ"}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === "EXECUTED"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : p.status === "REJECTED"
                          ? "bg-rose-500/10 text-rose-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {p.status}
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
