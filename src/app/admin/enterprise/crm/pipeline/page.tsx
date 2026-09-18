import { prisma } from "@/lib/prisma";
import { TrendingUp, DollarSign, Target } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const CRM_TABS = [
  { label: "ภาพรวม CRM", href: "/admin/enterprise/crm" },
  { label: "รายชื่อลูกค้า & ลีด", href: "/admin/enterprise/crm/leads" },
  { label: "โอกาสการขาย", href: "/admin/enterprise/crm/opportunities" },
  { label: "การประกวดราคา", href: "/admin/enterprise/crm/tenders" },
  { label: "ประมาณการต้นทุน", href: "/admin/enterprise/crm/estimates" },
  { label: "ใบเสนอราคา", href: "/admin/enterprise/crm/quotations" },
  { label: "ไปป์ไลน์การขาย", href: "/admin/enterprise/crm/pipeline" },
];

const STAGES = [
  { key: "LEAD", label: "ลีดใหม่ (Lead)", color: "from-blue-500/20 to-blue-600/10 text-blue-600" },
  { key: "QUALIFIED", label: "คัดกรองแล้ว (Qualified)", color: "from-indigo-500/20 to-indigo-600/10 text-indigo-600" },
  { key: "PROPOSAL", label: "เสนอราคา (Proposal)", color: "from-purple-500/20 to-purple-600/10 text-purple-600" },
  { key: "NEGOTIATION", label: "เจรจาต่อรอง (Negotiation)", color: "from-amber-500/20 to-amber-600/10 text-amber-600" },
  { key: "WON", label: "ปิดการขายสำเร็จ (Won)", color: "from-emerald-500/20 to-emerald-600/10 text-emerald-600" },
];

export default async function CRMPipelinePage() {
  const opportunities = await prisma.opportunity.findMany({
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="CRM / SALES PIPELINE"
        title="ไปป์ไลน์การขาย (Visual Sales Pipeline)"
        description="กระดานแสดงสถานะโอกาสทางการค้าตาม Stage เพื่อติดตามการแปลงสภาพจาก Lead สู่สัญญาจ้างจริง"
        breadcrumbs={[
          { label: "CRM", href: "/admin/enterprise/crm" },
          { label: "ไปป์ไลน์การขาย" },
        ]}
      />

      <EnterpriseModuleNav tabs={CRM_TABS} />

      {/* Kanban Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const items = opportunities.filter((o) => o.stage.toUpperCase() === stage.key);
          const totalVal = items.reduce((acc, curr) => acc + Number(curr.estimatedValue || 0), 0);

          return (
            <div key={stage.key} className="bg-surface-card border border-surface-border rounded-2xl p-3 flex flex-col space-y-3 min-w-[200px]">
              <div className="border-b border-surface-border pb-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${stage.color}`}>{stage.label}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-subtle text-content-muted">
                    {items.length}
                  </span>
                </div>
                <div className="text-xs font-black text-content-primary mt-1">
                  ฿{totalVal.toLocaleString()}
                </div>
              </div>

              <div className="space-y-2 flex-1">
                {items.length === 0 ? (
                  <div className="p-4 text-center text-[10px] text-content-muted bg-surface-subtle/50 rounded-xl">
                    ไม่มีรายการ
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-surface-subtle hover:bg-surface-border/50 border border-surface-border rounded-xl transition-all space-y-1"
                    >
                      <h4 className="font-bold text-xs text-content-primary line-clamp-2">{item.title}</h4>
                      <p className="text-[10px] text-content-muted">{item.client?.name || "ไม่ระบุลูกค้า"}</p>
                      <div className="flex items-center justify-between pt-1 text-[10px] font-bold">
                        <span className="text-emerald-600">฿{Number(item.estimatedValue || 0).toLocaleString()}</span>
                        <span className="text-content-muted">{item.probability || 50}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
