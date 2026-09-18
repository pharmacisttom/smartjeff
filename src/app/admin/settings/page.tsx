"use client";

import Link from "next/link";
import { Settings, Shield, Bell, CreditCard, Key, Home, ArrowLeft } from "lucide-react";

const SETTINGS_LINKS = [
  {
    title: "จัดการบทบาทและสิทธิ์ (Security Roles)",
    description: "กำหนดสิทธิ์การใช้งาน การควบคุม Separation of Duties และ IAM",
    href: "/admin/security/roles",
    icon: Shield,
  },
  {
    title: "การแจ้งเตือน (Notifications)",
    description: "ตั้งค่า LINE Notify, Email และการแจ้งเตือนฉุกเฉิน",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    title: "การชำระเงินและแพ็กเกจ (Billing & License)",
    description: "ตรวจสอบอายุสัญญา การต่ออายุไลเซนส์ และใบเสร็จรับเงิน",
    href: "/settings/billing",
    icon: CreditCard,
  },
  {
    title: "ระบบลงชื่อเข้าใช้ SSO (Single Sign-On)",
    description: "เชื่อมต่อ Azure AD, Google Workspace หรือ SAML 2.0",
    href: "/settings/sso",
    icon: Key,
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Settings className="w-4 h-4" />
            <span>Platform Configuration</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">ตั้งค่าระบบทั่วไป (System Settings)</h1>
          <p className="text-xs text-slate-400 mt-1">
            จัดการการตั้งค่าระบบความปลอดภัย การแจ้งเตือน และการเชื่อมต่อขององค์กร
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/dashboard"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 shadow-sm transition-all active:scale-95"
            title="กลับไปยังหน้าแรกแดชบอร์ด"
          >
            <Home className="w-4 h-4 text-brand-400" />
            <span>กลับหน้าแรก</span>
          </Link>
        </div>
      </div>

      {/* Grid of Settings Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SETTINGS_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-brand-500/40 transition-all flex items-start space-x-4 group"
            >
              <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 group-hover:scale-110 transition-transform shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
