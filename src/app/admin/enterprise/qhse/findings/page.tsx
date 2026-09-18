import { prisma } from "@/lib/prisma";
import { AlertCircle, Calendar, Activity } from "lucide-react";
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

export default async function QHSEFindingsPage() {
  const findings = await prisma.qHSEFinding.findMany({
    include: {
      incident: { select: { refNo: true, title: true } },
      _count: { select: { capas: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="QHSE / AUDIT FINDINGS"
        title="ข้อบกพร่องและข้อค้นพบความปลอดภัย (Findings)"
        description="ข้อค้นพบจากการตรวจประเมิน สภาพการทำงานที่ไม่ปลอดภัย และการกระทำที่ไม่ปลอดภัย"
        breadcrumbs={[
          { label: "QHSE", href: "/admin/enterprise/qhse" },
          { label: "ข้อบกพร่อง (Findings)" },
        ]}
      />

      <EnterpriseModuleNav tabs={QHSE_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการข้อบกพร่องทั้งหมด ({findings.length})</h2>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {findings.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <AlertCircle className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีข้อบกพร่องที่รอการแก้ไข</p>
            <p className="text-xs">ข้อบกพร่องจากการตรวจประเมินจะแสดงที่นี่เพื่อออกแผน CAPA ต่อไป</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">รายละเอียดข้อค้นพบ</th>
                  <th className="p-3">เกี่ยวข้องกับอุบัติการณ์</th>
                  <th className="p-3">สาเหตุที่พบ (Root Cause)</th>
                  <th className="p-3">กำหนดแก้ไข</th>
                  <th className="p-3">แผน CAPA</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {findings.map((f) => (
                  <tr key={f.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-bold text-content-primary">{f.description}</td>
                    <td className="p-3 text-content-secondary">
                      {f.incident ? `${f.incident.refNo} - ${f.incident.title}` : "การตรวจทั่วไป"}
                    </td>
                    <td className="p-3 text-content-secondary">{f.rootCause || "-"}</td>
                    <td className="p-3 text-content-muted">
                      {f.dueDate ? new Date(f.dueDate).toLocaleDateString("th-TH") : "-"}
                    </td>
                    <td className="p-3 font-bold text-indigo-600">{f._count.capas} แผน</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        f.status === "CLOSED" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {f.status}
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
