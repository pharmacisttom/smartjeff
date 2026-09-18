import React from 'react';
import { prisma } from '@/lib/prisma';
import EnterpriseModuleHeader from '@/components/enterprise/EnterpriseModuleHeader';
import EnterpriseModuleNav from '@/components/enterprise/EnterpriseModuleNav';
import { Layers, AlertCircle, CheckCircle, Clock } from 'lucide-react';

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

export default async function PlatformQueuesPage() {
  const [totalEvents, pendingEvents, failedEvents, recentEvents] = await Promise.all([
    prisma.eventOutbox.count().catch(() => 0),
    prisma.eventOutbox.count({ where: { status: 'PENDING' } }).catch(() => 0),
    prisma.eventOutbox.count({ where: { status: 'FAILED' } }).catch(() => 0),
    prisma.eventOutbox.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    }).catch(() => []),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <EnterpriseModuleHeader
        title="Enterprise Job Queues & Message Broker"
        subtitle="ตรวจสอบคิวงาน Event Outbox การจัดการ Retry และการกระจายงานระดับ Micro-services"
        badge="MESSAGE QUEUES"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Platform', href: '/admin/platform' },
          { label: 'Queues' },
        ]}
      />

      <EnterpriseModuleNav items={PLATFORM_NAV} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-sm text-slate-400">Total Processed Events</span>
          <p className="text-2xl font-bold text-white mt-1">{totalEvents} Events</p>
          <p className="text-xs text-slate-400 mt-1">ทั้งหมดในระบบ Outbox</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-sm text-slate-400">Pending In Queue</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{pendingEvents} Events</p>
          <p className="text-xs text-slate-400 mt-1">กำลังรอการส่งหรืออยู่ในรอบคิว</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-sm text-slate-400">Failed / Dead-letter</span>
          <p className="text-2xl font-bold text-rose-400 mt-1">{failedEvents} Events</p>
          <p className="text-xs text-slate-400 mt-1">ข้อความที่ส่งไม่สำเร็จ</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-4">Event Outbox Stream ล่าสุด</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-3">Event Type</th>
                <th className="p-3">Correlation ID</th>
                <th className="p-3">Attempts</th>
                <th className="p-3">สร้างเมื่อ</th>
                <th className="p-3 text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    ไม่มีข้อความค้างในคิว ระบบประมวลผลหมดจด
                  </td>
                </tr>
              ) : (
                recentEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-white">{evt.eventType}</td>
                    <td className="p-3 font-mono text-xs text-slate-400">{evt.correlationId || evt.eventId || '-'}</td>
                    <td className="p-3 font-mono">{evt.attempts}</td>
                    <td className="p-3 text-xs text-slate-400">{new Date(evt.createdAt).toLocaleString('th-TH')}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        evt.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400' :
                        evt.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {evt.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
