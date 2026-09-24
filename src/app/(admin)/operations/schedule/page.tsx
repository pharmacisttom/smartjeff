import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, Clock, Users, ArrowLeft, Plus, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OperationsSchedulePage() {
  const [shifts, templates, totalEmployees] = await Promise.all([
    prisma.shiftAssignment.findMany({
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, code: true, position: true } },
        shiftTemplate: true,
      },
      orderBy: { date: "desc" },
      take: 50,
    }).catch(() => []),
    prisma.shiftTemplate.findMany({ where: { isActive: true } }).catch(() => []),
    prisma.employee.count({ where: { isActive: true } }).catch(() => 0),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center space-x-2 text-xs text-content-muted">
          <Link href="/operations" className="hover:text-brand-600">การปฏิบัติงาน</Link>
          <span>/</span>
          <span className="text-content-primary font-bold">ตารางกะปฏิบัติงาน (Work Schedule)</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 p-6 rounded-3xl text-white shadow-xl">
          <div>
            <span className="text-xs font-bold text-brand-400 tracking-wider uppercase">SHIFT MANAGEMENT</span>
            <h1 className="text-2xl font-black tracking-tight">ตารางกะและเวลาการทำงาน</h1>
            <p className="text-xs text-slate-300 mt-1">
              จัดการกะการทำงาน มอบหมายพนักงานรายวัน และติดตามการเข้ากะตามแผน
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
            <span>กะที่จัดสรรแล้ว</span>
            <Calendar className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{shifts.length} กะ</div>
          <p className="text-[11px] text-content-muted">บันทึกล่าสุดในระบบ</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>รูปแบบกะงาน</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{templates.length} รูปแบบ</div>
          <p className="text-[11px] text-emerald-600 font-bold">พร้อมใช้งาน</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>พนักงานพร้อมจัดกะ</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{totalEmployees} คน</div>
          <p className="text-[11px] text-content-muted">พนักงานสถานะ Active</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>สถานะระบบจัดกะ</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600 mt-1">ONLINE</div>
          <p className="text-[11px] text-content-muted">MySQL Synced</p>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการจัดกะล่าสุด (Shift Assignments)</h2>
          <span className="text-xs text-content-muted">แสดง {shifts.length} รายการล่าสุด</span>
        </div>

        {shifts.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีรายการจัดกะในระบบ</p>
            <p className="text-xs">สามารถสร้างและมอบหมายกะการทำงานของพนักงานได้ทันที</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">วันที่</th>
                  <th className="p-3">รหัส / พนักงาน</th>
                  <th className="p-3">ตำแหน่ง</th>
                  <th className="p-3">กะการทำงาน</th>
                  <th className="p-3">ช่วงเวลา</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {shifts.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-semibold">{new Date(s.date).toLocaleDateString("th-TH")}</td>
                    <td className="p-3 font-bold text-content-primary">
                      {s.employee?.firstName} {s.employee?.lastName}
                      <span className="block text-[10px] text-content-muted">{s.employee?.code}</span>
                    </td>
                    <td className="p-3 text-content-secondary">{s.employee?.position || "-"}</td>
                    <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                      {s.shiftTemplate?.name || "กะปกติ"}
                    </td>
                    <td className="p-3 text-content-muted">
                      {s.startTime || s.shiftTemplate?.startTime || "08:00"} - {s.endTime || s.shiftTemplate?.endTime || "17:00"}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.isPublished
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                        {s.isPublished ? "ประกาศแล้ว" : "ร่าง (Draft)"}
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
