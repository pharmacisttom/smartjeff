import { prisma } from "@/lib/prisma";
import { GitBranch, Calendar, ShieldAlert } from "lucide-react";
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

export default async function QHSERCAPage() {
  const rcaRecords = await prisma.qHSEFinding.findMany({
    where: { rootCause: { not: null } },
    include: { incident: { select: { refNo: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="QHSE / ROOT CAUSE ANALYSIS"
        title="การวิเคราะห์หาสาเหตุที่แท้จริง (Root Cause Analysis - RCA)"
        description="กระบวนการสืบค้นหาสาเหตุรากเหง้า (5 Whys / Fishbone Diagram) เพื่อป้องกันปัญหาความปลอดภัยเกิดซ้ำ"
        breadcrumbs={[
          { label: "QHSE", href: "/admin/enterprise/qhse" },
          { label: "วิเคราะห์สาเหตุ (RCA)" },
        ]}
      />

      <EnterpriseModuleNav tabs={QHSE_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">บันทึกการวิเคราะห์สาเหตุ ({rcaRecords.length})</h2>
          <span className="text-xs text-content-muted">Root Cause Registry</span>
        </div>

        {rcaRecords.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <GitBranch className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีบันทึกการวิเคราะห์สาเหตุ (RCA)</p>
            <p className="text-xs">เมื่อมีการระบุสาเหตุที่แท้จริงในข้อค้นพบความปลอดภัย ข้อมูลจะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rcaRecords.map((rca) => (
              <div key={rca.id} className="p-5 rounded-2xl bg-surface-subtle border border-surface-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-600">
                    {rca.incident ? `อุบัติการณ์: ${rca.incident.refNo} - ${rca.incident.title}` : "การตรวจสอบความปลอดภัย"}
                  </span>
                  <span className="text-[10px] text-content-muted">{new Date(rca.createdAt).toLocaleDateString("th-TH")}</span>
                </div>
                <h3 className="text-sm font-bold text-content-primary">{rca.description}</h3>
                <div className="p-3 bg-surface-card rounded-xl border border-surface-border text-xs">
                  <span className="font-bold text-rose-600 block mb-1">สาเหตุรากเหง้า (Root Cause):</span>
                  <p className="text-content-secondary">{rca.rootCause}</p>
                </div>
                {rca.actionRequired && (
                  <p className="text-xs text-emerald-600 font-medium">
                    <span className="font-bold">มาตรการที่ต้องดำเนินการ:</span> {rca.actionRequired}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
