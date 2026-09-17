'use me'
'use client';

import React, { useState } from 'react';
import { provisionTenant, SignupInput } from '@/lib/tenant/provision';
import { Building2, User, Mail, Phone, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<SignupInput>({
    companyName: '',
    industry: 'Manufacturing',
    size: '1-50',
    adminName: '',
    email: '',
    phone: '',
    planCode: 'PROFESSIONAL',
  });

  const [provisionResult, setProvisionResult] = useState<any | null>(null);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      const res = provisionTenant(formData);
      setProvisionResult(res);
      setStep(4);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl space-y-6">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">SMARTO SaaS Self-Service</span>
          <h1 className="text-2xl font-black text-white mt-1">สมัครใช้งาน SMARTO (14-Day Free Trial)</h1>
          <p className="text-xs text-slate-400 mt-1">ขั้นตอนที่ {step} จาก 4 — ไม่ต้องใช้บัตรเครดิต ยกเลิกได้ตลอดเวลา</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-500 h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-semibold">ชื่อบริษัท / องค์กร *</label>
              <input
                required
                type="text"
                placeholder="เช่น บริษัท สยาม ออโต้แมค จำกัด"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-semibold">อุตสาหกรรม</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Manufacturing">โรงงานอุตสาหกรรม (Manufacturing)</option>
                <option value="Security">รักษาความปลอดภัย (Security Services)</option>
                <option value="Cleaning">แม่บ้าน & การทำความสะอาด (Cleaning Services)</option>
                <option value="Logistics">ขนส่ง & โลจิสติกส์ (Logistics)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              <span>ถัดไป: ข้อมูลผู้ดูแลระบบ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-semibold">ชื่อ-นามสกุล ผู้ดูแลระบบ (Admin) *</label>
              <input
                required
                type="text"
                placeholder="เช่น นายวิศรุต ผู้บริหาร"
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-semibold">อีเมลติดต่อองค์กร *</label>
              <input
                required
                type="email"
                placeholder="admin@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-semibold">เบอร์โทรศัพท์ติดต่อ *</label>
              <input
                required
                type="tel"
                placeholder="081-234-5678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              <span>ถัดไป: ยืนยันแพ็กเกจ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2 text-xs">
              <p className="font-bold text-white text-sm">สรุปการลงทะเบียน Tenant</p>
              <p className="text-slate-300">บริษัท: {formData.companyName}</p>
              <p className="text-slate-300">ผู้ดูแล: {formData.adminName} ({formData.email})</p>
              <p className="text-indigo-400 font-semibold">แพ็กเกจ: {formData.planCode} (ทดลองใช้ฟรี 14 วัน)</p>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>ยืนยันสร้างบัญชีองค์กรทันที</span>
            </button>
          </form>
        )}

        {step === 4 && provisionResult && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-white">ต้อนรับสู่ SMARTO!</h2>
            <p className="text-xs text-slate-300">
              สร้างองค์กร <span className="font-bold text-white">{provisionResult.companyName}</span> สำเร็จแล้ว
            </p>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-left text-xs space-y-2 font-mono">
              <p><span className="text-slate-400">Tenant Code:</span> <span className="text-indigo-400 font-bold">{provisionResult.tenantCode}</span></p>
              <p><span className="text-slate-400">License Key:</span> <span className="text-emerald-400 font-bold">{provisionResult.licenseKey}</span></p>
              <p><span className="text-slate-400">ทดลองใช้ฟรีถึง:</span> <span className="text-amber-400 font-bold">{new Date(provisionResult.trialEndsAt).toLocaleDateString()}</span></p>
            </div>

            <a
              href="/admin/dashboard"
              className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-indigo-600/30"
            >
              เข้าสู่ Dashboard ผู้บริหาร
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
