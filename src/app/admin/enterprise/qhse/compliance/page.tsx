import { prisma } from "@/lib/prisma";
import { FileCheck, ShieldAlert, Calendar } from "lucide-react";
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

export default async function QHSECompliancePage() {
  const permits = await prisma.permitToWork.findMany({
    orderBy: { startAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="QHSE / PERMIT TO WORK & COMPLIANCE"
        title="ใบอนุญาตทำงานและการปฏิบัติตามกฎหมาย (PTW & Compliance)"
        description="การขอใบอนุญาตทำงานเสี่ยงอันตราย (งานในที่อับอากาศ, งานประกายไฟ, งานบนที่สูง) และการตรวจประเมินตามกฎหมาย"
        breadcrumbs={[
          { label: "QHSE", href: "/admin/enterprise/qhse" },
          { label: "การปฏิบัติตามเกณฑ์ (Compliance)" },
        ]}
      />

      <EnterpriseModuleNav tabs={QHSE_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">ใบอนุญาตทำงานเสี่ยงอันตราย (PTW) ({permits.length} ฉบับ)</h2>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {permits.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <FileCheck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีการออกใบอนุญาตทำงานเสี่ยง (PTW)</p>
            <p className="text-xs">ก่อนเริ่มงานเสี่ยง เจ้าหน้าที่ความปลอดภัยสามารถออกใบ PTW เพื่ออนุมัติพื้นที่ได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่ PTW</th>
                  <th className="p-3">ประเภทงานเสี่ยง</th>
                  <th className="p-3">ชื่องาน / ภารกิจ</th>
                  <th className="p-3">ผู้รับเหมา / เจ้าหน้าที่</th>
                  <th className="p-3">ช่วงเวลาอนุญาต</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {permits.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{p.refNo}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600">
                        {p.type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-content-primary">{p.title}</td>
                    <td className="p-3 text-content-secondary">{p.contractor || "ทีมงานภายใน"}</td>
                    <td className="p-3 text-content-muted">
                      {new Date(p.startAt).toLocaleString("th-TH")} ถึง {new Date(p.endAt).toLocaleTimeString("th-TH")}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-600"
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
