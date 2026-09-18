import React from 'react';
import EnterpriseModuleHeader from '@/components/enterprise/EnterpriseModuleHeader';
import EnterpriseModuleNav from '@/components/enterprise/EnterpriseModuleNav';
import { ShieldCheck, RefreshCw, Server, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

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

export default async function PlatformDisasterRecoveryPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <EnterpriseModuleHeader
        title="Disaster Recovery & Business Continuity (BCP)"
        subtitle="แผนเผชิญเหตุฉุกเฉิน การทดสอบสลับระบบ (Failover Drill) และเป้าหมาย RTO / RPO"
        badge="DISASTER RECOVERY"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Platform', href: '/admin/platform' },
          { label: 'Disaster Recovery' },
        ]}
      />

      <EnterpriseModuleNav items={PLATFORM_NAV} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-xs font-semibold uppercase text-slate-400">RPO Target</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">&lt; 15 นาที</p>
          <p className="text-xs text-slate-400 mt-1">ขอบเขตข้อมูลสูญหายสูงสุดที่ยอมรับได้</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-xs font-semibold uppercase text-slate-400">RTO Target</span>
          <p className="text-2xl font-bold text-blue-400 mt-1">&lt; 60 นาที</p>
          <p className="text-xs text-slate-400 mt-1">เวลาในการฟื้นฟูระบบกลับสู่สภาพปกติ</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-xs font-semibold uppercase text-slate-400">Failover Mode</span>
          <p className="text-2xl font-bold text-white mt-1">Active-Passive</p>
          <p className="text-xs text-slate-400 mt-1">Secondary Region Warm Standby</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-xs font-semibold uppercase text-slate-400">Last Drill Result</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">PASS (100%)</p>
          <p className="text-xs text-slate-400 mt-1">ทดสอบซ้อมกู้คืนระบบประจำไตรมาส</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-white">ขั้นตอนและแผนผังการกู้คืนระบบ (Recovery Runbook)</h3>
        <div className="space-y-3">
          <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-lg flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
              1
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Incident Verification & Health Trigger</h4>
              <p className="text-xs text-slate-300 mt-1">
                ตรวจจับสัญญาณระบบขัดข้องผ่าน Health Check Monitor เมื่อโหนดหลักไม่ตอบสนองเกิน 3 นาที ระบบแจ้งเตือน On-Call Engineer ทันที
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-lg flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
              2
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Database Promotion & DNS Failover</h4>
              <p className="text-xs text-slate-300 mt-1">
                ยกระดับ Replica Database เป็น Primary Master Node และสลับการชี้ DNS/Load Balancer ไปยัง Secondary Data Center อัตโนมัติ
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-lg flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
              3
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Data Integrity & Service Validation</h4>
              <p className="text-xs text-slate-300 mt-1">
                รันระบบตรวจสอบความถูกต้องของข้อมูล (Checksum Validation), ตรวจสอบ Session และปลดล็อกระบบให้ผู้ใช้งานเข้าถึงอย่างปลอดภัย
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
