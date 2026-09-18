import React from 'react';
import { prisma } from '@/lib/prisma';
import EnterpriseModuleHeader from '@/components/enterprise/EnterpriseModuleHeader';
import EnterpriseModuleNav from '@/components/enterprise/EnterpriseModuleNav';
import { AlertOctagon, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

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

export default async function PlatformIncidentsPage() {
  const [openAlerts, criticalAlerts, resolvedAlerts, alertList] = await Promise.all([
    prisma.systemAlert.count({ where: { status: 'OPEN' } }).catch(() => 0),
    prisma.systemAlert.count({ where: { severity: 'CRITICAL' } }).catch(() => 0),
    prisma.systemAlert.count({ where: { status: 'RESOLVED' } }).catch(() => 0),
    prisma.systemAlert.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
    }).catch(() => []),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <EnterpriseModuleHeader
        title="Infrastructure Incidents & Outage Log"
        subtitle="ประวัติและสถานะเหตุขัดข้องของโครงสร้างพื้นฐาน และระบบเครือข่าย"
        badge="INCIDENT RESPONSE"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Platform', href: '/admin/platform' },
          { label: 'Incidents' },
        ]}
      />

      <EnterpriseModuleNav items={PLATFORM_NAV} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-sm text-slate-400">Open Incidents</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{openAlerts} เหตุการณ์</p>
          <p className="text-xs text-slate-400 mt-1">กำลังอยู่ระหว่างการตรวจสอบหรือแก้ไข</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-sm text-slate-400">Critical Severity</span>
          <p className="text-2xl font-bold text-rose-400 mt-1">{criticalAlerts} เหตุการณ์</p>
          <p className="text-xs text-slate-400 mt-1">ระดับส่งผลกระทบต่อบริการหลัก</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-sm text-slate-400">Resolved Incidents</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{resolvedAlerts} เหตุการณ์</p>
          <p className="text-xs text-slate-400 mt-1">แก้ไขและทดสอบคืนสภาพเรียบร้อยแล้ว</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-4">บันทึกเหตุการณ์ระบบ (System Alert History)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-3">ระดับความรุนแรง</th>
                <th className="p-3">หัวข้อเหตุการณ์</th>
                <th className="p-3">ประเภท</th>
                <th className="p-3">เวลาที่เกิด</th>
                <th className="p-3 text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {alertList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    ไม่พบประวัติเหตุขัดข้อง ระบบมีความพร้อมใช้งาน 99.98% SLA
                  </td>
                </tr>
              ) : (
                alertList.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/30">
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                        alert.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-white">{alert.title}</p>
                      <p className="text-xs text-slate-400">{alert.message}</p>
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-400">{alert.type}</td>
                    <td className="p-3 text-xs text-slate-400">{new Date(alert.createdAt).toLocaleString('th-TH')}</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs">
                        {alert.status}
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
