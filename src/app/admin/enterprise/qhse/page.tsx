import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ShieldAlert, AlertTriangle, CheckCircle2, FileCheck, ArrowRight, Activity } from "lucide-react";
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

export default async function EnterpriseQHSEOverviewPage() {
  const [incidents, capas, risks, permits] = await Promise.all([
    prisma.incident.findMany({
      orderBy: { occurredAt: "desc" },
      take: 5,
    }),
    prisma.cAPA.count({ where: { status: "OPEN" } }),
    prisma.risk.count({ where: { status: "OPEN" } }),
    prisma.permitToWork.count(),
  ]);

  const openIncidents = incidents.filter((i) => i.status === "OPEN").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="ENTERPRISE QHSE & SAFETY"
        title="ความปลอดภัย อาชีวอนามัย และสิ่งแวดล้อม (QHSE)"
        description="ศูนย์ควบคุมมาตรฐานความปลอดภัย รายงานอุบัติการณ์ เหตุการณ์เกือบเกิด มาตรการแก้ไข (CAPA) และทะเบียนความเสี่ยง"
        breadcrumbs={[{ label: "ความปลอดภัย (QHSE)" }]}
      />

      <EnterpriseModuleNav tabs={QHSE_TABS} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>อุบัติการณ์ (Incidents)</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-600">{incidents.length} เหตุการณ์</div>
          <p className="text-[11px] text-content-muted">รอปิดงาน {openIncidents} รายการ</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>แผนแก้ไข (CAPA) ค้าง</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600">{capas} แผน</div>
          <p className="text-[11px] text-amber-600 font-bold">ต้องติดตามผล</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ทะเบียนความเสี่ยง</span>
            <AlertTriangle className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{risks} ความเสี่ยง</div>
          <p className="text-[11px] text-content-muted">Active Risk Register</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ใบอนุญาตทำงาน (PTW)</span>
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">{permits} ใบ</div>
          <p className="text-[11px] text-emerald-600 font-bold">Permit to Work</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/enterprise/qhse/incidents"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">บันทึกอุบัติการณ์ (Incidents)</h3>
          <p className="text-xs text-content-muted mt-1">รายงานเหตุการณ์ บันทึกผู้บาดเจ็บ และระดับความรุนแรง</p>
        </Link>

        <Link
          href="/admin/enterprise/qhse/capa"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Activity className="w-6 h-6 text-amber-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">แผนแก้ไข & ป้องกัน (CAPA)</h3>
          <p className="text-xs text-content-muted mt-1">กำหนดผู้รับผิดชอบ กำหนดเสร็จ และหลักฐานการปิดงาน</p>
        </Link>

        <Link
          href="/admin/enterprise/qhse/risks"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <AlertTriangle className="w-6 h-6 text-purple-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">ตารางประเมินความเสี่ยง (Risks)</h3>
          <p className="text-xs text-content-muted mt-1">เมทริกซ์โอกาสเกิดและผลกระทบ (Likelihood x Impact)</p>
        </Link>
      </div>

      {/* Recent Incidents Table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายงานอุบัติการณ์ล่าสุด (Recent Incidents)</h2>
          <Link href="/admin/enterprise/qhse/incidents" className="text-xs font-bold text-brand-600 hover:underline">
            ดูทั้งหมด
          </Link>
        </div>

        {incidents.length === 0 ? (
          <div className="p-8 text-center text-content-muted text-xs">ยังไม่มีรายงานอุบัติการณ์ในระบบ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่</th>
                  <th className="p-3">หัวข้อเหตุการณ์</th>
                  <th className="p-3">ประเภท</th>
                  <th className="p-3">ระดับความรุนแรง</th>
                  <th className="p-3">วันที่เกิดเหตุ</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{inc.refNo}</td>
                    <td className="p-3 font-bold text-content-primary">{inc.title}</td>
                    <td className="p-3 text-content-secondary">{inc.type}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inc.severity === "CRITICAL" || inc.severity === "HIGH"
                          ? "bg-rose-500/10 text-rose-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="p-3 text-content-muted">{new Date(inc.occurredAt).toLocaleDateString("th-TH")}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inc.status === "CLOSED" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                      }`}>
                        {inc.status}
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
