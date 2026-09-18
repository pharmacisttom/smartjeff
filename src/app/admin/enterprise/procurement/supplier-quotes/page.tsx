import { prisma } from "@/lib/prisma";
import { FileText, CheckCircle2, DollarSign } from "lucide-react";
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

export default async function ProcurementSupplierQuotesPage() {
  const quoteItems = await prisma.rFQItem.findMany({
    include: {
      rfq: { select: { refNo: true, title: true } },
      supplier: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="PROCUREMENT / SUPPLIER QUOTES"
        title="ใบเสนอราคาจากคู่ค้า (Supplier Quotations)"
        description="เปรียบเทียบราคาที่เสนอจากซัพพลายเออร์แต่ละราย และบันทึกการคัดเลือกผู้ชนะการเสนอราคา"
        breadcrumbs={[
          { label: "จัดซื้อ", href: "/admin/enterprise/procurement" },
          { label: "ใบเสนอราคาคู่ค้า" },
        ]}
      />

      <EnterpriseModuleNav tabs={PROCUREMENT_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการราคาที่คู่ค้าเสนอ ({quoteItems.length} รายการ)</h2>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {quoteItems.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีราคาเสนอจากคู่ค้า</p>
            <p className="text-xs">เมื่อซัพพลายเออร์ส่งราคาใน RFQ ข้อมูลจะแสดงที่นี่เพื่อคัดเลือก</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่ RFQ</th>
                  <th className="p-3">คู่ค้า / ผู้จำหน่าย</th>
                  <th className="p-3">รายการ</th>
                  <th className="p-3">จำนวน</th>
                  <th className="p-3">ราคาที่เสนอ</th>
                  <th className="p-3 rounded-r-xl">การคัดเลือก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {quoteItems.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{item.rfq.refNo}</td>
                    <td className="p-3 font-bold text-content-primary">{item.supplier.name}</td>
                    <td className="p-3 text-content-secondary">{item.description}</td>
                    <td className="p-3 text-content-muted">{item.quantity} {item.unit}</td>
                    <td className="p-3 font-bold text-emerald-600">
                      {item.quotedPrice ? `฿${Number(item.quotedPrice).toLocaleString()}` : "รอเสนอราคา"}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.selected
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                      }`}>
                        {item.selected ? "คัดเลือกแล้ว" : "ยังไม่เลือก"}
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
