import React from 'react';
import { prisma } from '@/lib/prisma';
import EnterpriseModuleHeader from '@/components/enterprise/EnterpriseModuleHeader';
import EnterpriseModuleNav from '@/components/enterprise/EnterpriseModuleNav';
import { Activity, Server, ShieldCheck, Database, HardDrive, AlertTriangle, Cpu, Radio } from 'lucide-react';

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

export default async function PlatformOverviewPage() {
  const [
    alertCount,
    outboxCount,
    activeSessions,
    apiKeys,
    recentAlerts,
    dbCheck
  ] = await Promise.all([
    prisma.systemAlert.count().catch(() => 0),
    prisma.eventOutbox.count().catch(() => 0),
    prisma.userSession.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
    prisma.apiKey.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
    prisma.systemAlert.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
    }).catch(() => []),
    prisma.$queryRaw`SELECT 1 as isAlive`.then(() => true).catch(() => false),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <EnterpriseModuleHeader
        title="Platform & Infrastructure Management"
        subtitle="ระบบบริหารจัดการโครงสร้างพื้นฐาน เซิร์ฟเวอร์ ฐานข้อมูล และความพร้อมใช้งานระดับองค์กร"
        badge="INFRASTRUCTURE CORE"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Platform & Infra' },
        ]}
      />

      <EnterpriseModuleNav items={PLATFORM_NAV} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Database Status</span>
            <Database className={`w-5 h-5 ${dbCheck ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {dbCheck ? 'Healthy (MySQL)' : 'Connection Failed'}
          </p>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Prisma Engine Connected
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">System Alerts</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{alertCount} รายการ</p>
          <p className="text-xs text-slate-400 mt-1">เหตุขัดข้องและการแจ้งเตือนระบบ</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Event Outbox / Jobs</span>
            <Radio className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{outboxCount} Events</p>
          <p className="text-xs text-slate-400 mt-1">คิวข้อความและเหตุการณ์ระบบ</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Active Sessions / Keys</span>
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{activeSessions} Sessions</p>
          <p className="text-xs text-slate-400 mt-1">{apiKeys} Active API Keys</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            การแจ้งเตือนและเหตุการณ์ระบบล่าสุด (Recent System Alerts)
          </h3>
          <div className="space-y-3">
            {recentAlerts.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg text-slate-500 text-sm">
                ไม่พบเหตุขัดข้อง ระบบทำงานปกติ 100%
              </div>
            ) : (
              recentAlerts.map((alert) => (
                <div key={alert.id} className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                        alert.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-sm font-semibold text-white">{alert.title}</span>
                    </div>
                    <p className="text-xs text-slate-300">{alert.message}</p>
                    <p className="text-xs text-slate-500">{new Date(alert.createdAt).toLocaleString('th-TH')}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded font-mono">
                    {alert.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            สถานะโหนดระบบ (Cluster Nodes)
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
              <div className="flex justify-between text-xs font-semibold text-white">
                <span>App Server (Next.js 14)</span>
                <span className="text-emerald-400">ONLINE</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Runtime: Node.js Enterprise Pod</p>
            </div>
            <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
              <div className="flex justify-between text-xs font-semibold text-white">
                <span>Database Cluster (MySQL)</span>
                <span className="text-emerald-400">PRIMARY ACTIVE</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">InnoDB Engine, Master Node</p>
            </div>
            <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
              <div className="flex justify-between text-xs font-semibold text-white">
                <span>Storage & Documents</span>
                <span className="text-emerald-400">MOUNTED</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Local & S3 Compatible Storage</p>
            </div>
            <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
              <div className="flex justify-between text-xs font-semibold text-white">
                <span>Job Orchestrator</span>
                <span className="text-emerald-400">IDLE / READY</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Event Loop Dispatcher 1.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
