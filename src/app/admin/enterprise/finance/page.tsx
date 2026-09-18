import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CreditCard, DollarSign, TrendingUp, TrendingDown, ArrowRight, FileCheck, Layers } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const FINANCE_TABS = [
  { label: "ภาพรวมการเงิน", href: "/admin/enterprise/finance" },
  { label: "ใบแจ้งหนี้ (Invoices)", href: "/admin/enterprise/finance/invoices" },
  { label: "ลูกหนี้การค้า (AR)", href: "/admin/enterprise/finance/ar" },
  { label: "เจ้าหนี้การค้า (AP)", href: "/admin/enterprise/finance/ap" },
  { label: "ใบเสร็จรับเงิน", href: "/admin/enterprise/finance/receipts" },
  { label: "จ่ายชำระเงิน", href: "/admin/enterprise/finance/payments" },
  { label: "กระทบยอดบัญชี", href: "/admin/enterprise/finance/reconciliation" },
  { label: "กระแสเงินสด", href: "/admin/enterprise/finance/cash-flow" },
];

export default async function EnterpriseFinanceOverviewPage() {
  const [invoices, supplierInvoices, receipts, payments] = await Promise.all([
    prisma.invoice.findMany({ take: 20 }),
    prisma.supplierInvoice.findMany({ take: 20 }),
    prisma.receipt.findMany({ take: 20 }),
    prisma.payment.findMany({ take: 20 }),
  ]);

  const totalAR = invoices.reduce((acc, inv) => acc + (Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0)), 0);
  const totalAP = supplierInvoices.reduce((acc, sinv) => acc + (Number(sinv.totalAmount || 0) - Number(sinv.paidAmount || 0)), 0);
  const totalReceived = receipts.reduce((acc, r) => acc + Number(r.amount || 0), 0);
  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="ENTERPRISE FINANCE & ACCOUNTING"
        title="การเงิน การบัญชี และกระแสเงินสด (Finance & Cash Flow)"
        description="ศูนย์รวมข้อมูลลูกหนี้การค้า (AR), เจ้าหนี้การค้า (AP), รับ-จ่ายเงิน และกระทบยอดบัญชีธนาคาร"
        breadcrumbs={[{ label: "การเงินและบัญชี" }]}
      />

      <EnterpriseModuleNav tabs={FINANCE_TABS} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ลูกหนี้การค้า (AR)</span>
            <TrendingUp className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-black text-brand-600">฿{totalAR.toLocaleString()}</div>
          <p className="text-[11px] text-content-muted">รอรับชำระจากลูกค้า</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>เจ้าหนี้การค้า (AP)</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">฿{totalAP.toLocaleString()}</div>
          <p className="text-[11px] text-rose-600 font-bold">รอจ่ายคู่ค้า / ซัพพลายเออร์</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>รับเงินแล้ว (Receipts)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">฿{totalReceived.toLocaleString()}</div>
          <p className="text-[11px] text-emerald-600 font-bold">{receipts.length} ใบเสร็จ</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>จ่ายชำระแล้ว (Payments)</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600">฿{totalPaid.toLocaleString()}</div>
          <p className="text-[11px] text-content-muted">{payments.length} รายการจ่าย</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/enterprise/finance/ar"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-6 h-6 text-brand-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">ลูกหนี้การค้า (Accounts Receivable)</h3>
          <p className="text-xs text-content-muted mt-1">วิเคราะห์อายุลูกหนี้ (Aging Report) และการรับชำระเงินตามงวด</p>
        </Link>

        <Link
          href="/admin/enterprise/finance/ap"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingDown className="w-6 h-6 text-rose-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">เจ้าหนี้การค้า (Accounts Payable)</h3>
          <p className="text-xs text-content-muted mt-1">ตรวจสอบใบแจ้งหนี้จากคู่ค้า (3-Way Matching: PO, GR, Invoice)</p>
        </Link>

        <Link
          href="/admin/enterprise/finance/cash-flow"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Layers className="w-6 h-6 text-emerald-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">สมุดรายวันเงินสด (Cash Flow Ledger)</h3>
          <p className="text-xs text-content-muted mt-1">บันทึกกระแสเงินสดรับ-จ่าย และกระทบยอดกับ Statement ธนาคาร</p>
        </Link>
      </div>
    </div>
  );
}
