import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Landmark, TrendingUp, DollarSign, Calendar, ArrowRight } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const TREASURY_TABS = [
  { label: "ภาพรวมบริหารเงิน", href: "/admin/enterprise/treasury" },
  { label: "สถานะสภาพคล่อง", href: "/admin/enterprise/treasury/cash-position" },
  { label: "ประมาณการเงินสด", href: "/admin/enterprise/treasury/forecast" },
  { label: "งบประมาณองค์กร", href: "/admin/enterprise/treasury/budget" },
];

export default async function EnterpriseTreasuryOverviewPage() {
  const [ledgerEntries, budgets] = await Promise.all([
    prisma.cashLedgerEntry.findMany({ orderBy: { entryDate: "desc" }, take: 1 }),
    prisma.budget.findMany(),
  ]);

  const latestBalance = ledgerEntries[0] ? Number(ledgerEntries[0].balance || 0) : 0;
  const totalBudget = budgets.reduce((acc, b) => acc + Number(b.budgetAmount || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + Number(b.actualAmount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="ENTERPRISE TREASURY MANAGEMENT"
        title="การบริหารเงินสดและสภาพคล่อง (Treasury & Cash Management)"
        description="การติดตามสถานะเงินสดคงเหลือ (Cash Position), ประมาณการกระแสเงินสดล่วงหน้า (Cash Forecast) และการบริหารเงินทุนหมุนเวียน"
        breadcrumbs={[{ label: "การบริหารเงินสด (Treasury)" }]}
      />

      <EnterpriseModuleNav tabs={TREASURY_TABS} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>สภาพคล่องเงินสดปัจจุบัน</span>
            <Landmark className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">฿{latestBalance.toLocaleString()}</div>
          <p className="text-[11px] text-content-muted">ยอดคงเหลือล่าสุดจาก Cash Ledger</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>งบประมาณองค์กรรวม</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-indigo-600">฿{totalBudget.toLocaleString()}</div>
          <p className="text-[11px] text-content-muted">เบิกใช้จริงแล้ว ฿{totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>อัตราส่วนสภาพคล่อง</span>
            <TrendingUp className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-3xl font-black text-brand-600">STABLE</div>
          <p className="text-[11px] text-emerald-600 font-bold">กระแสเงินสดอยู่ในเกณฑ์ปลอดภัย</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/enterprise/treasury/cash-position"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Landmark className="w-6 h-6 text-brand-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">สถานะเงินสดคงเหลือ (Cash Position)</h3>
          <p className="text-xs text-content-muted mt-1">ยอดเงินสดในแต่ละบัญชีธนาคารและเงินสดย่อย</p>
        </Link>

        <Link
          href="/admin/enterprise/treasury/forecast"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">ประมาณการเงินสด (Cash Forecast)</h3>
          <p className="text-xs text-content-muted mt-1">ประมาณการเงินสดรับ-จ่ายล่วงหน้า 30-90 วัน</p>
        </Link>

        <Link
          href="/admin/enterprise/treasury/budget"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">งบประมาณองค์กร (Corporate Budget)</h3>
          <p className="text-xs text-content-muted mt-1">การจัดสรรงบประมาณเงินทุนหมุนเวียนและการลงทุน (CAPEX/OPEX)</p>
        </Link>
      </div>
    </div>
  );
}
