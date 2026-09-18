import { prisma } from "@/lib/prisma";
import { CheckCircle2, Calendar, FileCheck, Shield } from "lucide-react";
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

export default async function QHSEAuditsPage() {
  const records = await prisma.complianceRecord.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="QHSE / SAFETY AUDITS"
        title="การตรวจประเมินความปลอดภัย (Safety Audits)"
        description="บันทึกการตรวจความปลอดภัยประจำไซต์งาน การตรวจสอบตามมาตรฐาน ISO 45001 และข้อกำหนดด้านกฎหมาย"
        breadcrumbs={[
          { label: "QHSE", href: "/admin/enterprise/qhse" },
          { label: "ตรวจความปลอดภัย (Audits)" },
        ]}
      />

      <EnterpriseModuleNav tabs={QHSE_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการตรวจประเมิน ({records.length})</h2>
          <span className="text-xs text-content-muted">Compliance & Audit Records</span>
        </div>

        {records.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <FileCheck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีบันทึกการตรวจประเมิน</p>
            <p className="text-xs">สามารถบันทึกหัวข้อตรวจความปลอดภัยและกำหนดวันตรวจได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">หัวข้อการตรวจประเมิน</th>
                  <th className="p-3">หมวดหมู่</th>
                  <th className="p-3">กำหนดเสร็จ</th>
                  <th className="p-3">หมายเหตุ</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-bold text-content-primary">{r.title}</td>
                    <td className="p-3 text-content-secondary">{r.category}</td>
                    <td className="p-3 text-content-muted">
                      {r.dueDate ? new Date(r.dueDate).toLocaleDateString("th-TH") : "-"}
                    </td>
                    <td className="p-3 text-content-secondary truncate max-w-xs">{r.notes || "-"}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === "COMPLIANT" || r.status === "RESOLVED"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {r.status}
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
