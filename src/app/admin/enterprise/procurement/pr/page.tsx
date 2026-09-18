import { prisma } from "@/lib/prisma";
import { FileText, Clock, AlertCircle } from "lucide-react";
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

export default async function ProcurementPRPage() {
  const prs = await prisma.purchaseRequisition.findMany({
    include: {
      items: true,
      _count: { select: { items: true, purchaseOrders: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="PROCUREMENT / PURCHASE REQUISITIONS"
        title="ใบขอซื้อพัสดุและบริการ (Purchase Requisitions)"
        description="ติดตามคำขอจัดซื้อจากไซต์งาน ความเร่งด่วน และสถานะการอนุมัติก่อนเปิด PO"
        breadcrumbs={[
          { label: "จัดซื้อ", href: "/admin/enterprise/procurement" },
          { label: "ใบขอซื้อ (PR)" },
        ]}
      />

      <EnterpriseModuleNav tabs={PROCUREMENT_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการใบขอซื้อทั้งหมด ({prs.length})</h2>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {prs.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีใบขอซื้อในระบบ</p>
            <p className="text-xs">เจ้าหน้าที่ไซต์งานสามารถเปิดใบขอซื้อพัสดุเพื่อรอการอนุมัติได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่ PR</th>
                  <th className="p-3">วันที่สร้าง</th>
                  <th className="p-3">ระดับความเร่งด่วน</th>
                  <th className="p-3">จำนวนรายการ</th>
                  <th className="p-3">หมายเหตุ</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {prs.map((pr) => (
                  <tr key={pr.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{pr.refNo}</td>
                    <td className="p-3 text-content-muted">{new Date(pr.createdAt).toLocaleDateString("th-TH")}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        pr.urgency === "URGENT" || pr.urgency === "HIGH"
                          ? "bg-rose-500/10 text-rose-600"
                          : "bg-blue-500/10 text-blue-600"
                      }`}>
                        {pr.urgency}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-indigo-600">{pr._count.items} รายการ</td>
                    <td className="p-3 text-content-secondary max-w-xs truncate">{pr.notes || "-"}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        pr.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : pr.status === "REJECTED"
                          ? "bg-rose-500/10 text-rose-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {pr.status}
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
