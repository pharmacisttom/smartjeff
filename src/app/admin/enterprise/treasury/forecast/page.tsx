import { prisma } from "@/lib/prisma";
import { TrendingUp, Calendar, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const TREASURY_TABS = [
  { label: "ภาพรวมบริหารเงิน", href: "/admin/enterprise/treasury" },
  { label: "สถานะสภาพคล่อง", href: "/admin/enterprise/treasury/cash-position" },
  { label: "ประมาณการเงินสด", href: "/admin/enterprise/treasury/forecast" },
  { label: "งบประมาณองค์กร", href: "/admin/enterprise/treasury/budget" },
];

export default async function TreasuryForecastPage() {
  const [unpaidAR, unpaidAP] = await Promise.all([
    prisma.invoice.findMany({ where: { status: { not: "PAID" } }, take: 10 }),
    prisma.supplierInvoice.findMany({ where: { status: { not: "PAID" } }, take: 10 }),
  ]);

  const expectedInflow = unpaidAR.reduce((acc, i) => acc + (Number(i.totalAmount || 0) - Number(i.paidAmount || 0)), 0);
  const expectedOutflow = unpaidAP.reduce((acc, si) => acc + (Number(si.totalAmount || 0) - Number(si.paidAmount || 0)), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="TREASURY / CASH FLOW FORECASTING"
        title="ประมาณการกระแสเงินสดล่วงหน้า (Cash Flow Forecast)"
        description="คาดการณ์เงินสดรับเข้าจากลูกหนี้ (Inflows) และเงินสดจ่ายออกตามกำหนดชำระเจ้าหนี้ (Outflows)"
        breadcrumbs={[
          { label: "บริหารเงินสด", href: "/admin/enterprise/treasury" },
          { label: "ประมาณการเงินสด" },
        ]}
      />

      <EnterpriseModuleNav tabs={TREASURY_TABS} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>คาดการณ์เงินสดรับเข้า (30 วัน)</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">+฿{expectedInflow.toLocaleString()}</div>
          <p className="text-[11px] text-content-muted">จากบิลที่รอเก็บเงิน {unpaidAR.length} ฉบับ</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>คาดการณ์เงินสดจ่ายออก (30 วัน)</span>
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">-฿{expectedOutflow.toLocaleString()}</div>
          <p className="text-[11px] text-content-muted">จากบิลคู่ค้ารอจ่าย {unpaidAP.length} ฉบับ</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>สภาพคล่องสุทธิคาดการณ์</span>
            <TrendingUp className="w-4 h-4 text-brand-600" />
          </div>
          <div className={`text-2xl font-black ${expectedInflow >= expectedOutflow ? "text-emerald-600" : "text-rose-600"}`}>
            ฿{(expectedInflow - expectedOutflow).toLocaleString()}
          </div>
          <p className="text-[11px] text-content-muted">Net Projected Cash</p>
        </div>
      </div>
    </div>
  );
}
