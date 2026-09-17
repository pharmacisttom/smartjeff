"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Cpu,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  Award,
  Layers,
  Terminal,
  KeyRound,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Heart,
  Briefcase,
  Headphones,
} from "lucide-react";
import { showSuccess } from "@/lib/swal";

export default function AboutDeveloperPage() {
  const [copied, setCopied] = useState("");

  const handleCopyContact = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    showSuccess("คัดลอกข้อมูลเรียบร้อย!", `คัดลอก ${label}: ${text} ลงในคลิปบอร์ดแล้ว`);
    setTimeout(() => setCopied(""), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-brand-500 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        {/* Top Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 border border-slate-800 p-6 md:p-10 shadow-2xl space-y-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
            {/* Avatar Badge */}
            <div className="relative">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-amber-500 p-1 shadow-2xl">
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center font-black text-4xl text-white">
                  T
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-1.5 rounded-full border-2 border-slate-950 shadow">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="text-center md:text-left space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="bg-brand-500/20 text-brand-300 border border-brand-500/30 px-3 py-0.5 rounded-full text-xs font-bold">
                  LEAD SOFTWARE ARCHITECT
                </span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>SMARTO SYSTEM CREATOR</span>
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Tomvis (ทีมพัฒนา Smart Jeff Software)
              </h1>

              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                ผู้เชี่ยวชาญด้านการพัฒนาระบบบริหารจัดการกำลังพลภาคสนาม (Workforce Management System), ระบบสแกนเวลาผ่าน Geofence GPS, ใบอนุญาตซอฟต์แวร์เข้ารหัส (Cryptographic License) และสถาปัตยกรรมระบบ Multi-Tenant SaaS
              </p>
            </div>
          </div>
        </div>

        {/* Developer Highlights KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>ผลงานระบบ</span>
              <Briefcase className="w-4 h-4 text-brand-400" />
            </div>
            <div className="text-2xl font-black text-white">SMARTO Platform</div>
            <p className="text-[11px] text-brand-400 font-bold">ระบบบริหารพนักงาน J2K</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>ความปลอดภัย</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">AES-256 HMAC</div>
            <p className="text-[11px] text-slate-400">ระบบถอดรหัสสัญญา License Key</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>เทคโนโลยี</span>
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-indigo-400">Next.js 14 PWA</div>
            <p className="text-[11px] text-slate-400">รองรับออฟไลน์ ไซต์งานไม่มีเน็ต</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>การซัพพอร์ต</span>
              <Headphones className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">24/7 Support</div>
            <p className="text-[11px] text-slate-400">ดูแลสัญญาซอฟต์แวร์โดยตรง</p>
          </div>
        </div>

        {/* Main Content Grid: Skills & Contact Channels */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Technical Skills & System Architecture (7 cols) */}
          <div className="md:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
                <Code2 className="w-5 h-5 text-brand-300" />
              </div>
              <div>
                <h2 className="font-bold text-white text-base">จุดเด่นและเทคโนโลยีที่ใช้พัฒนา</h2>
                <p className="text-xs text-slate-400">สถาปัตยกรรมระบบ SMARTO โดย Tomvis</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-brand-400 font-bold">
                  <KeyRound className="w-4 h-4" />
                  <span>1. Cryptographic License & Subscription Engine</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  พัฒนาระบบออกใบอนุญาตซอฟต์แวร์ (License Key System) เข้ารหัสด้วย HMAC-SHA256 ป้องกันการปลอมแปลง ตรวจจับและล็อกอุปกรณ์ผ่าน Fingerprint และควบคุมวันหมดอายุสัญญาใช้งานระบบ
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>2. Geofence Radius GPS & Real-time Audit</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  ระบบตรวจจับพิกัดเข้างานของพนักงานตามรัศมีไซต์งาน (เช่น 200m) พร้อมบันทึก IP Address, Browser User-Agent และเก็บ Audit Log ทุกกิจกรรมเพื่อความโปร่งใส
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold">
                  <Layers className="w-4 h-4" />
                  <span>3. Offline First PWA & Queue Conflict Resolution</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  รองรับการทำงานในพื้นที่จุดอับสัญญาณเน็ต (IndexedDB Offline Sync) บันทึกการเข้างานลงเครื่องก่อนส่งขึ้นเซิร์ฟเวอร์เมื่อเน็ตกลับมาอัตโนมัติ
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Channels & Vendor Access (5 cols) */}
          <div className="md:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">ช่องทางติดต่อผู้พัฒนา</h2>
                  <p className="text-xs text-slate-400">รับคำปรึกษา สั่งซื้อระบบ และต่ออายุสัญญา</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <button
                  onClick={() => handleCopyContact("เบอร์โทรศัพท์", "081-999-8888")}
                  className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">เบอร์โทรศัพท์สายตรง:</span>
                      <strong className="text-white font-mono">081-999-8888</strong>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full group-hover:bg-brand-500/20">
                    {copied === "เบอร์โทรศัพท์" ? "คัดลอกแล้ว!" : "คัดลอก"}
                  </span>
                </button>

                <button
                  onClick={() => handleCopyContact("Line ID", "@tomvis")}
                  className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">LINE Official Account:</span>
                      <strong className="text-white font-mono">@tomvis</strong>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full group-hover:bg-brand-500/20">
                    {copied === "Line ID" ? "คัดลอกแล้ว!" : "คัดลอก"}
                  </span>
                </button>

                <button
                  onClick={() => handleCopyContact("อีเมลสนับสนุน", "support@smartjeff.com")}
                  className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">อีเมลฝ่ายบริการลูกค้า:</span>
                      <strong className="text-white font-mono">support@smartjeff.com</strong>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full group-hover:bg-brand-500/20">
                    {copied === "อีเมลสนับสนุน" ? "คัดลอกแล้ว!" : "คัดลอก"}
                  </span>
                </button>
              </div>
            </div>

            {/* Link to Tomvis Vendor Master Console */}
            <div className="pt-4 border-t border-slate-800">
              <Link
                href="/tomvis"
                className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-xl transition-all active:scale-98 flex items-center justify-center space-x-2"
              >
                <Cpu className="w-4 h-4 text-amber-300" />
                <span>เข้าสู่ระบบจัดการของผู้พัฒนา (Tomvis Console)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
