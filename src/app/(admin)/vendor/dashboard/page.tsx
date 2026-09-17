'use me'
'use client';

import React, { useState } from 'react';
import { calculateVendorMetrics } from '@/lib/vendor/metrics';
import { predictTenantChurn } from '@/lib/vendor/churn-prediction';
import { Building2, DollarSign, TrendingUp, Users, ShieldAlert, UserCheck, Search, Filter, Key } from 'lucide-react';
import Swal from 'sweetalert2';

export default function VendorConsoleDashboardPage() {
  const [tenants, setTenants] = useState([
    {
      id: 'TNT-001',
      code: 'SIAMAUTO',
      name: 'บริษัท สยาม ออโต้แมค จำกัด',
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
      mrr: 3500,
      headcount: 48,
      lastLoginDays: 1,
      unresolvedTickets: 0,
      failedCharges: 0,
    },
    {
      id: 'TNT-002',
      code: 'MAPTAPHUT',
      name: 'บริษัท มาบตาพุด คลีนนิ่ง เซอร์วิส จำกัด',
      plan: 'BUSINESS',
      status: 'ACTIVE',
      mrr: 8000,
      headcount: 180,
      lastLoginDays: 18,
      unresolvedTickets: 3,
      failedCharges: 1,
    },
    {
      id: 'TNT-003',
      code: 'RAYONGSEC',
      name: 'บริษัท ระยอง รักษาความปลอดภัย จำกัด',
      plan: 'STARTER',
      status: 'TRIAL',
      mrr: 1500,
      headcount: 15,
      lastLoginDays: 2,
      unresolvedTickets: 0,
      failedCharges: 0,
    },
  ]);

  const metrics = calculateVendorMetrics(
    tenants.map((t) => ({
      tenantId: t.id,
      companyName: t.name,
      planCode: t.plan as any,
      status: t.status as any,
      amountMonthly: t.mrr,
    }))
  );

  const handleImpersonate = async (tenantId: string, companyName: string) => {
    Swal.fire({
      title: 'เข้าสู่โหมด Impersonate',
      text: `คุณกำลังสลับเข้าดูระบบในนามองค์กร "${companyName}" (สำหรับ Support)`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันล็อกอิน impersonate',
      confirmButtonColor: '#ef4444',
      background: '#0f172a',
      color: '#fff',
    }).then(async (res) => {
      if (res.isConfirmed) {
        const response = await fetch('/api/impersonate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId, adminUser: 'Superadmin Tomvis' }),
        });
        const data = await response.json();
        if (data.success) {
          window.location.href = data.redirectUrl;
        }
      }
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Building2 className="w-4 h-4" />
            <span>SMARTO Multi-Tenant Vendor Portal</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            🎛️ Vendor Executive Console & Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            บริหารจัดการ Tenants, MRR/ARR, Churn Rate และ Impersonation Mode สำหรับทีมผู้พัฒนา
          </p>
        </div>
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 p-6 rounded-2xl border border-indigo-500/30">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">MRR (รายได้ต่อเดือน)</p>
          <p className="text-3xl font-black text-indigo-300 mt-2">฿{metrics.mrr.toLocaleString()}</p>
          <p className="text-xs text-emerald-400 mt-2">+{metrics.growthRatePercent}% MoM Growth</p>
        </div>

        <div className="bg-gradient-to-br from-blue-950/60 to-slate-900 p-6 rounded-2xl border border-blue-500/30">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">ARR (รายได้ต่อปี)</p>
          <p className="text-3xl font-black text-blue-300 mt-2">฿{metrics.arr.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-2">คำนวณจาก Active Subscriptions</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 p-6 rounded-2xl border border-emerald-500/30">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Active Tenants</p>
          <p className="text-3xl font-black text-emerald-400 mt-2">{metrics.activeTenants} บริษัท</p>
          <p className="text-xs text-slate-400 mt-2">Trialing: {metrics.trialTenants} บริษัท</p>
        </div>

        <div className="bg-gradient-to-br from-purple-950/60 to-slate-900 p-6 rounded-2xl border border-purple-500/30">
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Churn Rate</p>
          <p className="text-3xl font-black text-purple-300 mt-2">{metrics.churnRatePercent}%</p>
          <p className="text-xs text-slate-400 mt-2">เป้าหมาย &lt; 3.0%</p>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-400" />
          รายการ Tenants ทั้งหมดในระบบ (Multi-Tenant Overview)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-xs font-semibold text-slate-400 uppercase">
              <tr>
                <th className="p-3">Tenant Code</th>
                <th className="p-3">ชื่อบริษัท</th>
                <th className="p-3">แพ็กเกจ</th>
                <th className="p-3">สถานะ</th>
                <th className="p-3">Churn Risk</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tenants.map((t) => {
                const churn = predictTenantChurn({
                  tenantId: t.id,
                  daysSinceLastLogin: t.lastLoginDays,
                  unresolvedTickets: t.unresolvedTickets,
                  failedCharges: t.failedCharges,
                  featureAdoptionRate: 0.7,
                });

                return (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-indigo-400">{t.code}</td>
                    <td className="p-3 font-semibold text-white">{t.name}</td>
                    <td className="p-3">{t.plan}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                        t.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        churn.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {churn.riskLevel} ({churn.score}%)
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleImpersonate(t.id, t.name)}
                        className="flex items-center gap-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 px-3 py-1.5 rounded-xl text-xs font-semibold ml-auto transition"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Impersonate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
