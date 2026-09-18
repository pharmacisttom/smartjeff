import { prisma } from "@/lib/prisma";
import { Layers, Cpu, CheckCircle2, Clock } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const AUTOMATION_TABS = [
  { label: "ภาพรวมระบบอัตโนมัติ", href: "/admin/automation" },
  { label: "กระบวนการอนุมัติ (Workflows)", href: "/admin/automation/workflows" },
  { label: "กฎเกณฑ์อัตโนมัติ (Rules)", href: "/admin/automation/rules" },
  { label: "บันทึกเหตุการณ์ (Events)", href: "/admin/automation/events" },
  { label: "คิวประมวลผล (Queues)", href: "/admin/automation/queues" },
  { label: "Dead-Letter Queue", href: "/admin/automation/dead-letter" },
];

export default async function AutomationQueuesPage() {
  const [pendingCount, processingCount, completedCount] = await Promise.all([
    prisma.eventOutbox.count({ where: { status: "PENDING" } }),
    prisma.eventOutbox.count({ where: { status: "PROCESSING" } }),
    prisma.eventOutbox.count({ where: { status: "PROCESSED" } }),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="AUTOMATION / JOB QUEUES"
        title="คิวประมวลผลงานเบื้องหลัง (Job Queues)"
        description="ตรวจสอบสถานะการทำงานของคิวงานเบื้องหลัง เช่น การคำนวณเงินเดือน การส่งแจ้งเตือน และการ Sync ข้อมูล"
        breadcrumbs={[
          { label: "ระบบอัตโนมัติ", href: "/admin/automation" },
          { label: "คิวประมวลผล (Queues)" },
        ]}
      />

      <EnterpriseModuleNav tabs={AUTOMATION_TABS} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <span className="text-xs text-content-muted font-bold">งานรอดำเนินการ (Pending Queue)</span>
          <div className="text-3xl font-black text-amber-600">{pendingCount} งาน</div>
          <p className="text-[11px] text-content-muted">รอ Worker หยิบไปประมวลผล</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <span className="text-xs text-content-muted font-bold">กำลังประมวลผล (In Flight)</span>
          <div className="text-3xl font-black text-indigo-600">{processingCount} งาน</div>
          <p className="text-[11px] text-content-muted">Workers กำลังทำงาน</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <span className="text-xs text-content-muted font-bold">ประมวลผลสำเร็จแล้ว (Completed)</span>
          <div className="text-3xl font-black text-emerald-600">{completedCount} งาน</div>
          <p className="text-[11px] text-emerald-600 font-bold">งานเสร็จสมบูรณ์</p>
        </div>
      </div>
    </div>
  );
}
