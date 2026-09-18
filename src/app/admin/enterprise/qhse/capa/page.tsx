import { prisma } from "@/lib/prisma";
import { Activity, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
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

export default async function QHSECAPAPage() {
  const capas = await prisma.cAPA.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="QHSE / CORRECTIVE & PREVENTIVE ACTIONS"
        title="มาตรการแก้ไขและป้องกัน (CAPA)"
        description="ติดตามความคืบหน้าของแผนปฏิบัติการแก้ไข (Corrective Action) และป้องกัน (Preventive Action) พร้อมการยืนยันผลปิดงาน"
        breadcrumbs={[
          { label: "QHSE", href: "/admin/enterprise/qhse" },
          { label: "แผนแก้ไข (CAPA)" },
        ]}
      />

      <EnterpriseModuleNav tabs={QHSE_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการแผน CAPA ทั้งหมด ({capas.length})</h2>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {capas.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Activity className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีแผน CAPA ในระบบ</p>
            <p className="text-xs">สามารถสร้างแผนแก้ไขและมอบหมายผู้รับผิดชอบได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่ CAPA</th>
                  <th className="p-3">หัวข้อมาตรการ</th>
                  <th className="p-3">ประเภท</th>
                  <th className="p-3">กำหนดเสร็จ</th>
                  <th className="p-3">วันที่เสร็จจริง</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {capas.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{c.refNo}</td>
                    <td className="p-3 font-bold text-content-primary">
                      {c.title}
                      <span className="block text-[10px] text-content-muted truncate max-w-xs">{c.description}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600">
                        {c.type}
                      </span>
                    </td>
                    <td className="p-3 text-content-secondary font-medium">
                      {new Date(c.dueDate).toLocaleDateString("th-TH")}
                    </td>
                    <td className="p-3 text-content-muted">
                      {c.completedAt ? new Date(c.completedAt).toLocaleDateString("th-TH") : "-"}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === "CLOSED"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : c.status === "IN_PROGRESS"
                          ? "bg-blue-500/10 text-blue-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {c.status}
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
