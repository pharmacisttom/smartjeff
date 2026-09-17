'use me'
'use client';

import React, { useState } from 'react';
import { PLANS } from '@/lib/plans/definitions';
import { CheckCircle2, ShieldCheck, Zap, HelpCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3.5 py-1.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
          Simple, Transparent SaaS Pricing
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
          เลือกแพ็กเกจที่เหมาะกับขนาดองค์กรของคุณ
        </h1>
        <p className="text-slate-400 text-base">
          ทุกแพ็กเกจรองรับ GPS Check-in, ระบบคำนวณเงินเดือน และ LINE Notification พร้อมทดลองใช้ฟรี 14 วัน
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <span className={`text-sm font-semibold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
            รายเดือน
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="w-14 h-8 bg-slate-800 rounded-full p-1 border border-slate-700 relative transition"
          >
            <div
              className={`w-6 h-6 rounded-full bg-indigo-500 transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm font-semibold flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-400'}`}>
            รายปี <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold">ประหยัด 20%</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {Object.values(PLANS).map((plan) => {
          const isBusiness = plan.code === 'BUSINESS';
          const price = billingCycle === 'yearly' ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;

          return (
            <div
              key={plan.code}
              className={`p-6 rounded-3xl border flex flex-col justify-between transition ${
                isBusiness
                  ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900 border-indigo-500 shadow-2xl shadow-indigo-950/50 relative'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {isBusiness && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {plan.maxEmployees ? `สูงสุด ${plan.maxEmployees} พนักงาน` : 'ไม่จำกัดพนักงาน'}
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">฿{price.toLocaleString()}</span>
                    <span className="text-xs text-slate-400">/เดือน</span>
                  </div>
                  {billingCycle === 'yearly' && plan.priceYearly > 0 && (
                    <p className="text-xs text-emerald-400 mt-1">ชำระรายปี ฿{plan.priceYearly.toLocaleString()}/ปี</p>
                  )}
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>GPS Check-in & Offline Mode</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>ระบบ Payroll & สลิปเงินเดือน PDF</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.features.live_map ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span className={plan.features.live_map ? '' : 'text-slate-500 line-through'}>Live Operations Map</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.features.ai_chat ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span className={plan.features.ai_chat ? '' : 'text-slate-500 line-through'}>AI Executive Chatbot</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.features.sso ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span className={plan.features.sso ? '' : 'text-slate-500 line-through'}>Enterprise SSO & Audit Log</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href={`/signup?plan=${plan.code}`}
                  className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                    isBusiness
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  <span>เริ่มทดลองใช้ฟรี 14 วัน</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
