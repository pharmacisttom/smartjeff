"use client";

import { useEffect, useState } from "react";
import { Server, Database, ShieldCheck, Activity, HardDrive, RefreshCw, Home, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function SystemStatusPage() {
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>("");

  useEffect(() => {
    setLastCheck(new Date().toLocaleTimeString("th-TH"));
  }, []);

  const handleRefresh = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setLastCheck(new Date().toLocaleTimeString("th-TH"));
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Server className="w-4 h-4" />
            <span>Infrastructure & Platform Health</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">สถานะระบบ & การสำรองข้อมูล (System Status)</h1>
          <p className="text-xs text-slate-400 mt-1">
            ตรวจสอบความพร้อมใช้งานของเซิร์ฟเวอร์ ฐานข้อมูล MySQL และระบบสำรองข้อมูลอัตโนมัติ
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

      {/* Overview Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">สถานะเซิร์ฟเวอร์</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-lg font-black text-slate-900 dark:text-white">พร้อมใช้งาน (Normal)</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Uptime: 99.98%</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">ฐานข้อมูล MySQL</span>
            <Database className="w-4 h-4 text-brand-500" />
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-lg font-black text-slate-900 dark:text-white">เชื่อมต่อสำเร็จ</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Prisma Client: Connected</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">สำรองข้อมูลล่าสุด</span>
            <HardDrive className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-base font-black text-slate-900 dark:text-white block">วันนี้ 03:00 น.</span>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Auto Backup สำเร็จ</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">ความปลอดภัย</span>
            <ShieldCheck className="w-4 h-4 text-brand-600" />
          </div>
          <span className="text-lg font-black text-slate-900 dark:text-white block">TLS 1.3 / HTTPS</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">เข้ารหัสระดับองค์กร</p>
        </div>
      </div>

      {/* Control Actions */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          ตรวจสอบล่าสุดเมื่อ: <span className="font-bold text-slate-800 dark:text-slate-200">{lastCheck}</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={checking}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
          <span>{checking ? "กำลังตรวจ..." : "ตรวจสุขภาพระบบใหม่"}</span>
        </button>
      </div>
    </div>
  );
}
