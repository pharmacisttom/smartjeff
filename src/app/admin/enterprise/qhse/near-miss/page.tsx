import { prisma } from "@/lib/prisma";
import { AlertTriangle, Calendar, Shield } from "lucide-react";
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

export default async function QHSENearMissPage() {
  const nearMisses = await prisma.incident.findMany({
    where: {
      OR: [
        { type: "NEAR_MISS" },
        { title: { contains: "เกือบ" } },
        { description: { contains: "Near" } },
      ],
    },
    orderBy: { occurredAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="QHSE / NEAR-MISS REPORTING"
        title="รายงานเหตุการณ์เกือบเกิดอุบัติเหตุ (Near-Miss)"
        description="รวบรวมรายงานเหตุการณ์เกือบเกิดอันตราย เพื่อวิเคราะห์เชิงป้องกันก่อนเกิดอุบัติเหตุจริง"
        breadcrumbs={[
          { label: "QHSE", href: "/admin/enterprise/qhse" },
          { label: "เหตุการณ์เกือบเกิด" },
        ]}
      />

      <EnterpriseModuleNav tabs={QHSE_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการเหตุการณ์เกือบเกิด ({nearMisses.length} รายงาน)</h2>
          <span className="text-xs text-content-muted">Proactive Safety Data</span>
        </div>

        {nearMisses.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-400" />
            <p className="font-bold text-sm">ยังไม่มีรายงาน Near-Miss ในงวดนี้</p>
            <p className="text-xs">ส่งเสริมให้พนักงานทุกคนมีส่วนร่วมในการแจ้งเตือนจุดอันตราย</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่</th>
                  <th className="p-3">หัวข้อเหตุการณ์</th>
                  <th className="p-3">สถานที่ / ไซต์</th>
                  <th className="p-3">วันที่สังเกตพบ</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {nearMisses.map((nm) => (
                  <tr key={nm.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-600">{nm.refNo}</td>
                    <td className="p-3 font-bold text-content-primary">
                      {nm.title}
                      <span className="block text-[10px] text-content-muted truncate max-w-sm">{nm.description}</span>
                    </td>
                    <td className="p-3 text-content-secondary">{nm.location || "หน้างาน"}</td>
                    <td className="p-3 text-content-muted">{new Date(nm.occurredAt).toLocaleDateString("th-TH")}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">
                        {nm.status}
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
