import { prisma } from "@/lib/prisma";
import { ShieldAlert, Calendar, AlertTriangle } from "lucide-react";
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

export default async function QHSEIncidentsPage() {
  const incidents = await prisma.incident.findMany({
    orderBy: { occurredAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="QHSE / INCIDENT LOGS"
        title="บันทึกรายงานอุบัติการณ์ (Incidents)"
        description="รายการอุบัติเหตุ การบาดเจ็บ ความเสียหายต่อทรัพย์สิน และรายงานสอบสวนข้อเท็จจริง"
        breadcrumbs={[
          { label: "QHSE", href: "/admin/enterprise/qhse" },
          { label: "อุบัติการณ์" },
        ]}
      />

      <EnterpriseModuleNav tabs={QHSE_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการอุบัติการณ์ทั้งหมด ({incidents.length} เรื่อง)</h2>
          <span className="text-xs text-content-muted">MySQL Incident Records</span>
        </div>

        {incidents.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <ShieldAlert className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ไม่มีรายงานอุบัติการณ์ในระบบ</p>
            <p className="text-xs">สถิติความปลอดภัยอยู่ในเกณฑ์ดีเยี่ยม</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่</th>
                  <th className="p-3">หัวข้อเหตุการณ์</th>
                  <th className="p-3">ประเภท</th>
                  <th className="p-3">ระดับความรุนแรง</th>
                  <th className="p-3">ผู้ได้รับผลกระทบ</th>
                  <th className="p-3">วันที่เกิดเหตุ</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {incidents.map((i) => (
                  <tr key={i.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{i.refNo}</td>
                    <td className="p-3 font-bold text-content-primary">
                      {i.title}
                      <span className="block text-[10px] text-content-muted truncate max-w-xs">{i.description}</span>
                    </td>
                    <td className="p-3 text-content-secondary">{i.type}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        i.severity === "CRITICAL" || i.severity === "HIGH"
                          ? "bg-rose-500/10 text-rose-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {i.severity}
                      </span>
                    </td>
                    <td className="p-3 text-content-muted">{i.affectedPerson || "-"}</td>
                    <td className="p-3 text-content-secondary">{new Date(i.occurredAt).toLocaleDateString("th-TH")}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        i.status === "CLOSED" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                      }`}>
                        {i.status}
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
