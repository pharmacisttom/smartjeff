import { prisma } from "@/lib/prisma";
import { ShoppingCart, Calendar, Clock } from "lucide-react";
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

export default async function ProcurementRFQPage() {
  const rfqs = await prisma.rFQ.findMany({
    include: {
      items: { include: { supplier: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="PROCUREMENT / REQUEST FOR QUOTATION"
        title="ขอใบเสนอราคาจากคู่ค้า (RFQ)"
        description="สร้างใบเทียบราคา ส่งเทียบราคาคู่ค้าหลายราย และคัดเลือกราคาที่ดีที่สุด"
        breadcrumbs={[
          { label: "จัดซื้อ", href: "/admin/enterprise/procurement" },
          { label: "ขอใบเสนอราคา (RFQ)" },
        ]}
      />

      <EnterpriseModuleNav tabs={PROCUREMENT_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการเทียบราคาทั้งหมด ({rfqs.length})</h2>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {rfqs.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <ShoppingCart className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีรายการเทียบราคา (RFQ)</p>
            <p className="text-xs">สามารถสร้าง RFQ เพื่อส่งเทียบราคาให้คู่ค้าหลายรายเสนอราคาเข้ามา</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่ RFQ</th>
                  <th className="p-3">หัวข้อการจัดซื้อ</th>
                  <th className="p-3">กำหนดปิดรับราคา</th>
                  <th className="p-3">จำนวนคู่ค้าที่เทียบ</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {rfqs.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{rfq.refNo}</td>
                    <td className="p-3 font-bold text-content-primary">{rfq.title}</td>
                    <td className="p-3 text-content-muted">
                      {rfq.dueDate ? new Date(rfq.dueDate).toLocaleDateString("th-TH") : "ไม่กำหนด"}
                    </td>
                    <td className="p-3 font-bold text-indigo-600">{rfq.items.length} รายการ</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600">
                        {rfq.status}
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
