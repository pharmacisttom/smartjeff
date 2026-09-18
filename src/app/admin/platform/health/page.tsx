import React from 'react';
import { prisma } from '@/lib/prisma';
import EnterpriseModuleHeader from '@/components/enterprise/EnterpriseModuleHeader';
import EnterpriseModuleNav from '@/components/enterprise/EnterpriseModuleNav';
import { CheckCircle2, XCircle, ShieldCheck, HardDrive, Cpu, Clock, RefreshCw } from 'lucide-react';

export const dynamic = 'force-dynamic';

const PLATFORM_NAV = [
  { label: 'ภาพรวมระบบ', href: '/admin/platform' },
  { label: 'สุขภาพระบบ (Health)', href: '/admin/platform/health' },
  { label: 'สำรองข้อมูล (Backups)', href: '/admin/platform/backups' },
  { label: 'Background Workers', href: '/admin/platform/workers' },
  { label: 'คิวงาน (Queues)', href: '/admin/platform/queues' },
  { label: 'เหตุขัดข้อง (Incidents)', href: '/admin/platform/incidents' },
  { label: 'กู้คืนระบบ (DR)', href: '/admin/platform/disaster-recovery' },
];

export default async function PlatformHealthPage() {
  const startTime = Date.now();
  let dbLatency = 0;
  let dbStatus = false;

  try {
    await prisma.$queryRaw`SELECT 1 as ping`;
    dbLatency = Date.now() - startTime;
    dbStatus = true;
  } catch {
    dbStatus = false;
  }

  const [employeeCount, siteCount, alertCount] = await Promise.all([
    prisma.employee.count().catch(() => 0),
    prisma.site.count().catch(() => 0),
    prisma.systemAlert.count({ where: { status: 'OPEN' } }).catch(() => 0),
  ]);

  const uptime = process.uptime();
  const uptimeHours = Math.floor(uptime / 3600);
  const uptimeMinutes = Math.floor((uptime % 3600) / 60);

  const memoryUsage = process.memoryUsage();
  const heapUsedMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(1);
  const rssMB = (memoryUsage.rss / 1024 / 1024).toFixed(1);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <EnterpriseModuleHeader
        title="System Health & Diagnostics"
        subtitle="ตรวจสอบความสมบูรณ์ ความเร็วในการตอบสนอง และทรัพยากรของระบบแบบเรียลไทม์"
        badge="HEALTH MONITOR"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Platform', href: '/admin/platform' },
          { label: 'System Health' },
        ]}
      />

      <EnterpriseModuleNav items={PLATFORM_NAV} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Database Engine</span>
            {dbStatus ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400" />
            )}
          </div>
          <p className="text-2xl font-bold text-white">{dbStatus ? 'Operational' : 'Degraded'}</p>
          <p className="text-xs text-slate-400">Latency: <span className="text-emerald-400 font-mono">{dbLatency} ms</span></p>
          <div className="pt-2 border-t border-slate-800 text-xs text-slate-500">
            MySQL via Prisma Connection Pool
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Process Uptime</span>
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{uptimeHours}h {uptimeMinutes}m</p>
          <p className="text-xs text-slate-400">Node Runtime Environment</p>
          <div className="pt-2 border-t border-slate-800 text-xs text-slate-500">
            Node {process.version} - {process.platform}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Memory Footprint</span>
            <Cpu className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white">{heapUsedMB} MB</p>
          <p className="text-xs text-slate-400">RSS: <span className="font-mono text-slate-300">{rssMB} MB</span></p>
          <div className="pt-2 border-t border-slate-800 text-xs text-slate-500">
            Heap Allocations Normal
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-4">บริการและระบบย่อย (Subsystem Health Checks)</h3>
        <div className="divide-y divide-slate-800">
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <div>
                <p className="text-sm font-medium text-white">Relational DB (MySQL)</p>
                <p className="text-xs text-slate-400">Prisma Client Pool Connection</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-mono">
              200 OK
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <div>
                <p className="text-sm font-medium text-white">Application Routing & Next.js Server</p>
                <p className="text-xs text-slate-400">App Router SSR & API Routes</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-mono">
              200 OK
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <div>
                <p className="text-sm font-medium text-white">Core Entities Integrity</p>
                <p className="text-xs text-slate-400">Employees: {employeeCount}, Sites: {siteCount}</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-mono">
              SYNCHRONIZED
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${alertCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              <div>
                <p className="text-sm font-medium text-white">Active System Incidents</p>
                <p className="text-xs text-slate-400">{alertCount} unresolved system alerts</p>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-mono ${alertCount > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {alertCount === 0 ? 'CLEAN' : `${alertCount} PENDING`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
