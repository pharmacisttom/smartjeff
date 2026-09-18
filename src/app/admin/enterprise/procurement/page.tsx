import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ShoppingCart, FileText, PackageCheck, DollarSign, Users, ArrowRight } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const PROCUREMENT_TABS = [
  { label: "ภาพรวมจัดซื้อ", href: "/admin/enterprise/procurement" },
  { label: "รายการพัสดุ & วัสดุ", href: "/admin/enterprise/procurement/materials" },
  { label: "ใบขอซื้อ (PR)", href: "/admin/enterprise/procurement/pr" },
  { label: "ขอใบเสนอราคา (RFQ)", href: "/admin/enterprise/procurement/rfq" },
  { label: "ใบเสนอราคาคู่ค้า", href: "/admin/enterprise/procurement/supplier-quotes" },
  { label: "ใบสั่งซื้อ (PO)", href: "/admin/enterprise/procurement/po" },
  { label: "ตรวจรับพัสดุ (GR)", href: "/admin/enterprise/procurement/gr" },
];

export default async function EnterpriseProcurementPage() {
  const [prCount, poList, rfqCount, grCount, suppliersCount] = await Promise.all([
    prisma.purchaseRequisition.count(),
    prisma.purchaseOrder.findMany({
      include: {
        supplier: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.rFQ.count(),
    prisma.goodsReceipt.count(),
    prisma.supplier.count({ where: { isActive: true } }),
  ]);

  const totalPOAmount = poList.reduce((acc, po) => acc + Number(po.totalAmount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="ENTERPRISE PROCUREMENT"
        title="ระบบจัดซื้อและพัสดุ (Procurement & Sourcing)"
        description="บริหารกระบวนการจัดซื้อตั้งแต่ใบขอซื้อ (PR), ขอราคาคู่ค้า (RFQ), ออกใบสั่งซื้อ (PO) จนถึงการตรวจรับพัสดุ (GR)"
        breadcrumbs={[{ label: "จัดซื้อและพัสดุ" }]}
      />

      <EnterpriseModuleNav tabs={PROCUREMENT_TABS} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ใบขอซื้อ (PR)</span>
            <FileText className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{prCount} ฉบับ</div>
          <p className="text-[11px] text-content-muted">Requisitions</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>เทียบราคา (RFQ)</span>
            <ShoppingCart className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{rfqCount} โครงการ</div>
          <p className="text-[11px] text-content-muted">Requests for Quote</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>คู่ค้าในระบบ</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{suppliersCount} ราย</div>
          <p className="text-[11px] text-emerald-600 font-bold">Approved Suppliers</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ตรวจรับแล้ว (GR)</span>
            <PackageCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{grCount} รายการ</div>
          <p className="text-[11px] text-content-muted">Goods Receipts</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/enterprise/procurement/pr"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <FileText className="w-6 h-6 text-brand-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">ใบขอซื้อพัสดุ (PR)</h3>
          <p className="text-xs text-content-muted mt-1">สร้างและอนุมัติใบขอซื้อวัสดุ อุปกรณ์ และบริการหน้างาน</p>
        </Link>

        <Link
          href="/admin/enterprise/procurement/po"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <ShoppingCart className="w-6 h-6 text-indigo-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">ใบสั่งซื้อสินค้า (PO)</h3>
          <p className="text-xs text-content-muted mt-1">ออกใบสั่งซื้อและส่งต่อคู่ค้า พร้อมติดตามวันส่งมอบ</p>
        </Link>

        <Link
          href="/admin/enterprise/procurement/gr"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <PackageCheck className="w-6 h-6 text-emerald-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">ตรวจรับสินค้า & คลัง (GR)</h3>
          <p className="text-xs text-content-muted mt-1">บันทึกตรวจรับสินค้าหน้างานและนำเข้าสต็อกอัตโนมัติ</p>
        </Link>
      </div>

      {/* Recent POs Table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">ใบสั่งซื้อล่าสุด (Recent Purchase Orders)</h2>
          <Link href="/admin/enterprise/procurement/po" className="text-xs font-bold text-brand-600 hover:underline">
            ดูทั้งหมด
          </Link>
        </div>

        {poList.length === 0 ? (
          <div className="p-8 text-center text-content-muted text-xs">ยังไม่มีใบสั่งซื้อในระบบ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่ PO</th>
                  <th className="p-3">คู่ค้า / ผู้จำหน่าย</th>
                  <th className="p-3">มูลค่าสั่งซื้อ</th>
                  <th className="p-3">กำหนดส่งมอบ</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {poList.map((po) => (
                  <tr key={po.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{po.refNo}</td>
                    <td className="p-3 font-bold text-content-primary">{po.supplier?.name}</td>
                    <td className="p-3 font-bold text-emerald-600">
                      ฿{Number(po.totalAmount || 0).toLocaleString()} {po.currency}
                    </td>
                    <td className="p-3 text-content-muted">
                      {po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString("th-TH") : "ไม่ระบุ"}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600">
                        {po.status}
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
