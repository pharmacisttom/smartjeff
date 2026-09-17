'use me'
'use client';

import React, { useState } from 'react';
import { KeyRound, ShieldCheck, CheckCircle2, Lock, FileCode, Server } from 'lucide-react';
import Swal from 'sweetalert2';

export default function SSOSettingsPage() {
  const [ssoType, setSsoType] = useState<'OIDC' | 'SAML'>('OIDC');
  const [enabled, setEnabled] = useState(true);
  const [clientId, setClientId] = useState('smarto-client-azure-ad-001');
  const [discoveryUrl, setDiscoveryUrl] = useState('https://login.microsoftonline.com/tenant-id/v2.0/.well-known/openid-configuration');

  const handleSaveSSO = (e: React.FormEvent) => {
    e.preventDefault();
    Swal.fire({
      title: 'บันทึกการตั้งค่า SSO สำเร็จ',
      text: 'เปิดใช้งาน Single Sign-On (Google Workspace / Microsoft Azure AD) เรียบร้อยแล้ว',
      icon: 'success',
      confirmButtonColor: '#4f46e5',
      background: '#0f172a',
      color: '#fff',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <KeyRound className="w-4 h-4" />
            <span>Enterprise Security & Identity</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            🔐 Single Sign-On (SSO) & Identity Governance
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            รองรับ SAML 2.0 และ OIDC (Microsoft Azure AD, Google Workspace, Okta) สำหรับองค์กร Enterprise
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 max-w-3xl space-y-6">
        <form onSubmit={handleSaveSSO} className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-slate-800/60 rounded-xl border border-slate-700">
            <div>
              <p className="font-bold text-white text-sm">เปิดใช้งาน SSO สำหรับ Tenant นี้</p>
              <p className="text-xs text-slate-400">บังคับพนักงานเข้าใช้งานผ่านระบบยืนยันตัวตนกลางของบริษัท</p>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 cursor-pointer accent-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-semibold">เลือกโปรโตคอล SSO</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSsoType('OIDC')}
                className={`p-3 rounded-xl border text-sm font-bold transition ${
                  ssoType === 'OIDC' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                OIDC (Google / Azure AD)
              </button>
              <button
                type="button"
                onClick={() => setSsoType('SAML')}
                className={`p-3 rounded-xl border text-sm font-bold transition ${
                  ssoType === 'SAML' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                SAML 2.0 (Okta / Ping Identity)
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-semibold">Client ID / Issuer</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-sm font-mono text-white"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-semibold">Discovery / Metadata URL</label>
            <input
              type="text"
              value={discoveryUrl}
              onChange={(e) => setDiscoveryUrl(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-sm font-mono text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-indigo-600/30"
          >
            บันทึกการตั้งค่า SSO
          </button>
        </form>
      </div>
    </div>
  );
}
