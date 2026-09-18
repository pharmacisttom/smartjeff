import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Wrench, Briefcase, Users, ArrowLeft, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export const revalidate = 0;

export default async function OperationsWorkOrdersPage() {
  const [workOrders, totalOpen, totalCompleted] = await Promise.all([
    prisma.workOrder.findMany({
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, code: true } },
        project: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.workOrder.count({ where: { status: "OPEN" } }),
    prisma.workOrder.count({ where: { status: "COMPLETED" } }),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center space-x-2 text-xs text-content-muted">
          <Link href="/operations" className="hover:text-brand-600">การปฏิบัติงาน</Link>
          <span>/</span>
          <span className="text-content-primary font-bold">ใบสั่งงาน (Work Orders)</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 p-6 rounded-3xl text-white shadow-xl">
          <div>
            <span className="text-xs font-bold text-brand-400 tracking-wider uppercase">FIELD SERVICE & WORK ORDERS</span>
            <h1 className="text-2xl font-black tracking-tight">ใบสั่งงานและภารกิจหน้างาน</h1>
            <p className="text-xs text-slate-300 mt-1">
              ออกใบสั่งงาน มอบหมายงานช่าง/เจ้าหน้าที่ และติดตามสถานะความคืบหน้ารายโครงการ
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href="/operations"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับภาพรวม</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ใบสั่งงานทั้งหมด</span>
            <Wrench className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{workOrders.length} งาน</div>
          <p className="text-[11px] text-content-muted">บันทึกในระบบ</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>งานรอดำเนินการ</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600">{totalOpen} งาน</div>
          <p className="text-[11px] text-amber-600 font-bold">สถานะ OPEN</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>งานเสร็จสิ้นแล้ว</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">{totalCompleted} งาน</div>
          <p className="text-[11px] text-content-muted">สถานะ COMPLETED</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>เชื่อมโยงโครงการ</span>
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-indigo-600 mt-1">CONNECTED</div>
          <p className="text-[11px] text-content-muted">MySQL Projects Link</p>
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการใบสั่งงานล่าสุด (Recent Work Orders)</h2>
          <span className="text-xs text-content-muted">แสดง {workOrders.length} รายการ</span>
        </div>

        {workOrders.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Wrench className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีใบสั่งงานในระบบ</p>
            <p className="text-xs">สามารถสร้างใบสั่งงานใหม่และมอบหมายผู้รับผิดชอบได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่งาน</th>
                  <th className="p-3">ชื่องาน</th>
                  <th className="p-3">โครงการ</th>
                  <th className="p-3">ผู้รับผิดชอบ</th>
                  <th className="p-3">ความสำคัญ</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {wo.refNo || wo.id.slice(0, 8)}
                    </td>
                    <td className="p-3 font-bold text-content-primary">
                      {wo.title}
                      {wo.description && <span className="block text-[10px] text-content-muted truncate max-w-xs">{wo.description}</span>}
                    </td>
                    <td className="p-3 text-content-secondary">{wo.project?.name || "-"}</td>
                    <td className="p-3 text-content-primary">
                      {wo.assignee ? `${wo.assignee.firstName} ${wo.assignee.lastName}` : "ยังไม่ได้มอบหมาย"}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        wo.priority === "HIGH" || wo.priority === "CRITICAL"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      }`}>
                        {wo.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        wo.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : wo.status === "IN_PROGRESS"
                          ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                        {wo.status}
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
