'use me'
'use client';

import React, { useState } from 'react';
import { processOmiseCharge } from '@/lib/payment/omise';
import { CreditCard, ShieldCheck, Download, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

export default function BillingSettingsPage() {
  const [currentPlan, setCurrentPlan] = useState('PROFESSIONAL');
  const [invoices, setInvoices] = useState([
    { id: 'INV-2026-009', date: '2026-09-01', plan: 'Professional Plan', amount: 3500, status: 'PAID' },
    { id: 'INV-2026-008', date: '2026-08-01', plan: 'Professional Plan', amount: 3500, status: 'PAID' },
  ]);

  const handleUpdatePaymentCard = () => {
    Swal.fire({
      title: 'ผูกบัตรชำระเงิน (Omise Payment Gateway)',
      html: `
        <div class="text-left text-sm space-y-3">
          <div>
            <label class="block text-xs text-slate-400 mb-1">หมายเลขบัตรเครดิต/เดบิต</label>
            <input id="swal-card-num" class="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white font-mono text-sm" placeholder="4242 •••• •••• 4242" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-slate-400 mb-1">วันหมดอายุ (MM/YY)</label>
              <input id="swal-card-exp" class="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white font-mono text-sm" placeholder="12/28" />
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">CVC/CVV</label>
              <input id="swal-card-cvc" class="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white font-mono text-sm" placeholder="123" />
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'บันทึกบัตรชำระเงิน',
      confirmButtonColor: '#4f46e5',
      background: '#0f172a',
      color: '#fff',
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await processOmiseCharge({
          tenantId: 'TNT-001',
          amount: 3500,
          token: 'tokn_test_4242',
          description: 'SMARTO Professional Plan',
          email: 'admin@company.com',
        });

        if (res.status === 'SUCCEEDED') {
          Swal.fire({
            title: 'ผูกบัตรชำระเงินสำเร็จ!',
            text: 'ระบบจะตัดค่าบริการอัตโนมัติเมื่อครบกำหนดรอบบิล',
            icon: 'success',
            background: '#0f172a',
            color: '#fff',
          });
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
            <CreditCard className="w-4 h-4" />
            <span>Tenant Billing & Subscriptions</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            💳 การจัดการแพ็กเกจ และใบแจ้งหนี้ (Billing)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            ตรวจสอบรอบบิล ผูกบัตรชำระเงินอัตโนมัติผ่าน Omise และดาวน์โหลดใบกำกับภาษี PDF
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan Overview */}
        <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 space-y-4">
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
            Current Plan
          </span>
          <h2 className="text-3xl font-black text-white">{currentPlan} PLAN</h2>
          <p className="text-sm text-slate-300">฿3,500 / เดือน (สูงสุด 50 พนักงาน)</p>

          <div className="pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
            <p className="flex justify-between">
              <span>สถานะการชำระเงิน:</span>
              <span className="text-emerald-400 font-bold">Active (ตัดผ่านบัตรอัตโนมัติ)</span>
            </p>
            <p className="flex justify-between">
              <span>วันตัดรอบบิลถัดไป:</span>
              <span className="text-white font-mono">1 ตุลาคม 2569</span>
            </p>
          </div>

          <button
            onClick={handleUpdatePaymentCard}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg shadow-indigo-600/30"
          >
            อัปเดตบัตรชำระเงิน (Omise)
          </button>
        </div>

        {/* Invoice History */}
        <div className="lg:col-span-2 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-400" />
            ประวัติใบแจ้งหนี้ / ใบกำกับภาษี (Invoice History)
          </h2>

          <div className="space-y-3">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{inv.id}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold">
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{inv.plan} • {inv.date}</p>
                </div>

                <div className="text-right">
                  <p className="font-mono font-bold text-white text-base">฿{inv.amount.toLocaleString()}</p>
                  <button
                    onClick={() => Swal.fire({ title: 'ดาวน์โหลดใบกำกับภาษี PDF สำเร็จ', icon: 'success', background: '#0f172a', color: '#fff' })}
                    className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold mt-0.5"
                  >
                    ดาวน์โหลด PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
