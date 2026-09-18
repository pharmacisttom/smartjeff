import { prisma } from "@/lib/prisma";
import { PackageCheck, Calendar, ShoppingCart, CheckCircle2 } from "lucide-react";
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

export default async function ProcurementGRPage() {
  const receipts = await prisma.goodsReceipt.findMany({
    include: {
      po: { select: { refNo: true, supplier: { select: { name: true } } } },
      items: true,
      _count: { select: { items: true } },
    },
    orderBy: { receivedAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="PROCUREMENT / GOODS RECEIPT"
        title="ตรวจรับพัสดุและสินค้า (Goods Receipts)"
        description="บันทึกการตรวจรับพัสดุจริงหน้างาน ตรวจสอบสภาพของ และนำเข้าคลังสินค้าอัตโนมัติ"
        breadcrumbs={[
          { label: "จัดซื้อ", href: "/admin/enterprise/procurement" },
          { label: "ตรวจรับพัสดุ (GR)" },
        ]}
      />

      <EnterpriseModuleNav tabs={PROCUREMENT_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">ประวัติการตรวจรับพัสดุ ({receipts.length} ใบเสร็จรับของ)</h2>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {receipts.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <PackageCheck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีรายการตรวจรับพัสดุ</p>
            <p className="text-xs">เมื่อซัพพลายเออร์ส่งของหน้างาน สามารถตรวจรับและบันทึกใบ GR ได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่ GR</th>
                  <th className="p-3">อ้างอิง PO</th>
                  <th className="p-3">คู่ค้า</th>
                  <th className="p-3">วันที่ตรวจรับ</th>
                  <th className="p-3">จำนวนรายการ</th>
                  <th className="p-3 rounded-r-xl">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {receipts.map((gr) => (
                  <tr key={gr.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{gr.refNo}</td>
                    <td className="p-3 font-mono font-bold text-indigo-600">{gr.po.refNo}</td>
                    <td className="p-3 font-bold text-content-primary">{gr.po.supplier?.name}</td>
                    <td className="p-3 text-content-muted">{new Date(gr.receivedAt).toLocaleDateString("th-TH")}</td>
                    <td className="p-3 font-bold text-emerald-600">{gr._count.items} รายการ</td>
                    <td className="p-3 text-content-secondary max-w-xs truncate">{gr.notes || "-"}</td>
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
