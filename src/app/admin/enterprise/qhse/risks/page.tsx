import { prisma } from "@/lib/prisma";
import { AlertTriangle, ShieldCheck, Tag } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const QHSE_TABS = [
  { label: "ภาพรวม QHSE", href: "/admin/enterprise/qhse" },
  { label: "อุบัติการณ์ (Incidents)", href: "/admin/enterprise/qhse/incidents" },
  { label: "เหตุการณ์เกือบเกิด (Near-Miss)", href: "/admin/enterprise/qhse/near-miss" },
  { label: "ตรวจความปลอดภัย (Audits)", href: "/admin/enterprise/qhse/audits" },
  { label: "ข้อบกพร่อง (Findings)", href: "/admin/enterprise/qhse/findings" },
  { label: "วิเคราะห์สาเหตุ (RCA)", href: "/admin/enterprise/qhse/rca" },
  { label: "แผนแก้ไข (CAPA)", href: "/admin/enterprise/qhse/capa" },
  { label: "บริหารความเสี่ยง (Risks)", href: "/admin/enterprise/qhse/risks" },
  { label: "การปฏิบัติตามเกณฑ์ (Compliance)", href: "/admin/enterprise/qhse/compliance" },
];

export default async function QHSERisksPage() {
  const risks = await prisma.risk.findMany({
    orderBy: { riskScore: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="QHSE / ENTERPRISE RISK REGISTER"
        title="ทะเบียนและการประเมินความเสี่ยง (Risk Register)"
        description="ประเมินความเสี่ยงด้านความปลอดภัย อาชีวอนามัย และสิ่งแวดล้อม พร้อมมาตรการควบคุมความเสี่ยง (Mitigation Plan)"
        breadcrumbs={[
          { label: "QHSE", href: "/admin/enterprise/qhse" },
          { label: "บริหารความเสี่ยง (Risks)" },
        ]}
      />

      <EnterpriseModuleNav tabs={QHSE_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">ทะเบียนความเสี่ยงทั้งหมด ({risks.length} รายการ)</h2>
          <span className="text-xs text-content-muted">MySQL Risk Models</span>
        </div>

        {risks.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <AlertTriangle className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีรายการประเมินความเสี่ยง</p>
            <p className="text-xs">สามารถระบุอันตราย ประเมินโอกาสเกิด และกำหนดมาตรการควบคุมได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">ความเสี่ยง / อันตราย</th>
                  <th className="p-3">หมวดหมู่</th>
                  <th className="p-3">โอกาสเกิด (L)</th>
                  <th className="p-3">ผลกระทบ (I)</th>
                  <th className="p-3">คะแนนความเสี่ยง</th>
                  <th className="p-3">ระดับความเสี่ยง</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {risks.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-bold text-content-primary">
                      {r.title}
                      {r.description && <span className="block text-[10px] text-content-muted truncate max-w-xs">{r.description}</span>}
                    </td>
                    <td className="p-3 text-content-secondary">{r.category}</td>
                    <td className="p-3 font-medium text-content-primary">{r.likelihood}/5</td>
                    <td className="p-3 font-medium text-content-primary">{r.impact}/5</td>
                    <td className="p-3 font-bold text-indigo-600">{r.riskScore}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.level === "HIGH" || r.level === "EXTREME"
                          ? "bg-rose-500/10 text-rose-600"
                          : r.level === "MEDIUM"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-emerald-500/10 text-emerald-600"
                      }`}>
                        {r.level}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-content-muted">{r.status}</td>
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
