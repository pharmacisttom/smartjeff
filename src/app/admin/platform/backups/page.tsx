import React from 'react';
import EnterpriseModuleHeader from '@/components/enterprise/EnterpriseModuleHeader';
import EnterpriseModuleNav from '@/components/enterprise/EnterpriseModuleNav';
import { Database, HardDrive, CloudUpload, Clock, CheckCircle2, ShieldCheck, Download, RefreshCw } from 'lucide-react';

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

export default async function PlatformBackupsPage() {
  const backups = [
    { id: 'BAK-20260924-001', type: 'Full Database Snapshot', size: '248.5 MB', target: 'AWS S3 (ap-southeast-1)', timestamp: '24 ก.ย. 2026, 04:00 น.', status: 'SUCCESS', verified: true },
    { id: 'BAK-20260923-001', type: 'Full Database Snapshot', size: '246.1 MB', target: 'AWS S3 (ap-southeast-1)', timestamp: '23 ก.ย. 2026, 04:00 น.', status: 'SUCCESS', verified: true },
    { id: 'BAK-20260922-001', type: 'Full Database Snapshot', size: '244.8 MB', target: 'AWS S3 (ap-southeast-1)', timestamp: '22 ก.ย. 2026, 04:00 น.', status: 'SUCCESS', verified: true },
    { id: 'BAK-20260921-001', type: 'Full Database Snapshot', size: '242.2 MB', target: 'AWS S3 (ap-southeast-1)', timestamp: '21 ก.ย. 2026, 04:00 น.', status: 'SUCCESS', verified: true },
    { id: 'BAK-20260920-001', type: 'Weekly Full Archive + WAL', size: '1.42 GB', target: 'AWS S3 Glacier (Cold)', timestamp: '20 ก.ย. 2026, 02:00 น.', status: 'SUCCESS', verified: true },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <EnterpriseModuleHeader
        title="Automated Backups & Storage Snapshots"
        subtitle="ระบบสำรองฐานข้อมูลอัตโนมัติ การเข้ารหัส AES-256 และการจัดเก็บ Off-site ข้ามศูนย์ข้อมูล"
        badge="BACKUPS & STORAGE"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Platform', href: '/admin/platform' },
          { label: 'Backups' },
        ]}
      />

      <EnterpriseModuleNav items={PLATFORM_NAV} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Backup Schedule</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">ทุกวัน 04:00</p>
          <p className="text-xs text-emerald-400 mt-1">✓ รอบล่าสุดเสร็จสมบูรณ์</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Retention Policy</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-400 mt-1">30 Days Daily</p>
          <p className="text-xs text-slate-400 mt-1">365 วัน สำหรับประวัติสิ้นเดือน (Monthly)</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Storage Target</span>
            <CloudUpload className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1">Dual-Region</p>
          <p className="text-xs text-slate-400 mt-1">S3 Primary + Off-site Replica</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Encryption</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-1">AES-256</p>
          <p className="text-xs text-slate-400 mt-1">At-Rest &amp; In-Transit TLS 1.3</p>
        </div>
      </div>

      {/* Backup History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-semibold text-white">ประวัติสำรองข้อมูลล่าสุด (Latest Backup Archives)</h3>
            <p className="text-xs text-slate-400">รายการไฟล์ Snapshot พร้อมผลการทดสอบความสมบูรณ์ (Integrity Check)</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> สำรองทันที (Manual Snapshot)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-medium">Backup ID</th>
                <th className="py-3 px-4 font-medium">ประเภท (Type)</th>
                <th className="py-3 px-4 font-medium">ขนาด (Size)</th>
                <th className="py-3 px-4 font-medium">เป้าหมายจัดเก็บ (Destination)</th>
                <th className="py-3 px-4 font-medium">เวลาที่สร้าง (Created)</th>
                <th className="py-3 px-4 font-medium">สถานะ (Status)</th>
                <th className="py-3 px-4 font-medium">Integrity Check</th>
                <th className="py-3 px-4 font-medium text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-blue-400">{b.id}</td>
                  <td className="py-3 px-4 font-medium text-white">{b.type}</td>
                  <td className="py-3 px-4 font-mono">{b.size}</td>
                  <td className="py-3 px-4 text-slate-400">{b.target}</td>
                  <td className="py-3 px-4 text-slate-400">{b.timestamp}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] transition-colors">
                      <Download className="w-3 h-3" /> ดาวน์โหลด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
