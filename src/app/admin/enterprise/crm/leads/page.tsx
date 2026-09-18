import { prisma } from "@/lib/prisma";
import { Users, Building2, Phone, Mail, MapPin } from "lucide-react";
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

export default async function CRMLeadsPage() {
  const clients = await prisma.client.findMany({
    include: {
      _count: { select: { projects: true, contracts: true, opportunities: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="CRM / CLIENTS & LEADS"
        title="รายชื่อลูกค้าและผู้ว่าจ้าง (Clients & Leads)"
        description="ฐานข้อมูลผู้ว่าจ้าง คู่ค้าทางธุรกิจ และผู้ติดต่อหลักสำหรับงานโครงการ"
        breadcrumbs={[
          { label: "CRM", href: "/admin/enterprise/crm" },
          { label: "รายชื่อลูกค้า & ลีด" },
        ]}
      />

      <EnterpriseModuleNav tabs={CRM_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายชื่อบริษัทลูกค้าทั้งหมด ({clients.length})</h2>
          <span className="text-xs text-content-muted">MySQL Centralized Database</span>
        </div>

        {clients.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Building2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีข้อมูลลูกค้าในระบบ</p>
            <p className="text-xs">สามารถเพิ่มข้อมูลบริษัทผู้ว่าจ้างผ่านโมดูล CRM ได้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl bg-surface-subtle border border-surface-border space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md">
                      {c.code}
                    </span>
                    <h3 className="font-bold text-sm text-content-primary mt-1">{c.name}</h3>
                    {c.nameTh && <p className="text-xs text-content-muted">{c.nameTh}</p>}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    c.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-200 text-slate-500"
                  }`}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-content-secondary border-t border-surface-border/50 pt-2">
                  {c.contactName && (
                    <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.contactName}</span>
                    </div>
                  )}
                  {c.contactPhone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.contactPhone}</span>
                    </div>
                  )}
                  {c.contactEmail && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.contactEmail}</span>
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{c.address}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-[11px] font-bold text-content-muted pt-2 border-t border-surface-border/50">
                  <span>โครงการ: {c._count.projects}</span>
                  <span>สัญญา: {c._count.contracts}</span>
                  <span>โอกาสการขาย: {c._count.opportunities}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
