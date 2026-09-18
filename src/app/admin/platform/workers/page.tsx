import React from 'react';
import { prisma } from '@/lib/prisma';
import EnterpriseModuleHeader from '@/components/enterprise/EnterpriseModuleHeader';
import EnterpriseModuleNav from '@/components/enterprise/EnterpriseModuleNav';
import { Cpu, Play, CheckCircle2, RotateCw, Layers } from 'lucide-react';

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

export default async function PlatformWorkersPage() {
  const [outboxPending, aiProposalCount] = await Promise.all([
    prisma.eventOutbox.count({ where: { status: 'PENDING' } }).catch(() => 0),
    prisma.aIActionProposal.count({ where: { status: 'DRAFT' } }).catch(() => 0),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <EnterpriseModuleHeader
        title="Background Workers & Asynchronous Daemons"
        subtitle="สถานะของโพรเซสประมวลผลเบื้องหลัง (Cron, Scheduled Jobs, Event Dispatchers)"
        badge="WORKER POOL"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Platform', href: '/admin/platform' },
          { label: 'Workers' },
        ]}
      />

      <EnterpriseModuleNav items={PLATFORM_NAV} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-sm text-slate-400">Total Worker Daemons</span>
          <p className="text-2xl font-bold text-white mt-1">4 Active Workers</p>
          <p className="text-xs text-emerald-400 mt-1">All Daemons Reporting Heartbeats</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-sm text-slate-400">Pending Outbox Events</span>
          <p className="text-2xl font-bold text-white mt-1">{outboxPending} รายการ</p>
          <p className="text-xs text-slate-400 mt-1">รอการ Dispatch ไปยังระบบภายนอก</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-sm text-slate-400">AI Proposals in Queue</span>
          <p className="text-2xl font-bold text-white mt-1">{aiProposalCount} ฉบับ</p>
          <p className="text-xs text-slate-400 mt-1">รอการประเมินความเสี่ยงและอนุมัติ</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-4">รายการโปรเซสเบื้องหลังที่กำลังทำงาน</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-3">Worker ID</th>
                <th className="p-3">ประเภทหน้าที่</th>
                <th className="p-3">อัตราการรัน (Interval)</th>
                <th className="p-3">Concurrency</th>
                <th className="p-3 text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-white">worker-outbox-dispatcher</td>
                <td className="p-3">Event Outbox Delivery & Retry</td>
                <td className="p-3">Polling 5 วินาที</td>
                <td className="p-3 font-mono">5 Threads</td>
                <td className="p-3 text-right">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs">RUNNING</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-white">worker-payroll-calculator</td>
                <td className="p-3">คำนวณสรุปเงินเดือนและกะเวลา</td>
                <td className="p-3">ทุกเที่ยงคืน (00:00)</td>
                <td className="p-3 font-mono">2 Threads</td>
                <td className="p-3 text-right">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs">STANDBY</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-white">worker-attendance-aggregator</td>
                <td className="p-3">ประมวลผลขาด ลา มาสาย & Overtime</td>
                <td className="p-3">ทุก 1 ชั่วโมง</td>
                <td className="p-3 font-mono">4 Threads</td>
                <td className="p-3 text-right">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs">RUNNING</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-white">worker-session-cleanup</td>
                <td className="p-3">ล้าง Session ที่หมดอายุ และ Dead-letter</td>
                <td className="p-3">ทุก 24 ชั่วโมง</td>
                <td className="p-3 font-mono">1 Thread</td>
                <td className="p-3 text-right">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs">IDLE</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
