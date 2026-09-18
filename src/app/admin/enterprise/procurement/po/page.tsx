import { prisma } from "@/lib/prisma";
import { ShoppingCart, Calendar, DollarSign, Users } from "lucide-react";
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

export default async function ProcurementPOPage() {
  const pos = await prisma.purchaseOrder.findMany({
    include: {
      supplier: { select: { name: true, code: true } },
      _count: { select: { items: true, goodsReceipts: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalAmount = pos.reduce((acc, po) => acc + Number(po.totalAmount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="PROCUREMENT / PURCHASE ORDERS"
        title="ใบสั่งซื้อสินค้าและบริการ (Purchase Orders)"
        description="ออกใบสั่งซื้อ ติดตามการยืนยันคำสั่งซื้อจากคู่ค้า และกำหนดส่งมอบของเข้าไซต์งาน"
        breadcrumbs={[
          { label: "จัดซื้อ", href: "/admin/enterprise/procurement" },
          { label: "ใบสั่งซื้อ (PO)" },
        ]}
      />

      <EnterpriseModuleNav tabs={PROCUREMENT_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-content-primary">ใบสั่งซื้อทั้งหมด ({pos.length} ฉบับ)</h2>
            <p className="text-xs text-indigo-600 font-bold mt-0.5">มูลค่าสั่งซื้อรวม: ฿{totalAmount.toLocaleString()}</p>
          </div>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {pos.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <ShoppingCart className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีใบสั่งซื้อในระบบ</p>
            <p className="text-xs">สามารถสร้างใบสั่งซื้อใหม่จากใบขอซื้อที่ผ่านการอนุมัติแล้วได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่ PO</th>
                  <th className="p-3">คู่ค้า</th>
                  <th className="p-3">มูลค่าสั่งซื้อ</th>
                  <th className="p-3">กำหนดส่งมอบ</th>
                  <th className="p-3">รายการ / ตรวจรับ</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {pos.map((po) => (
                  <tr key={po.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{po.refNo}</td>
                    <td className="p-3 font-bold text-content-primary">{po.supplier?.name}</td>
                    <td className="p-3 font-bold text-emerald-600">
                      ฿{Number(po.totalAmount || 0).toLocaleString()} {po.currency}
                    </td>
                    <td className="p-3 text-content-muted">
                      {po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString("th-TH") : "ไม่ระบุ"}
                    </td>
                    <td className="p-3 text-content-secondary">
                      {po._count.items} รายการ (GR: {po._count.goodsReceipts})
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        po.status === "APPROVED" || po.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : po.status === "SENT"
                          ? "bg-blue-500/10 text-blue-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}>
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
