"use client";

import { X, Cpu, ShieldCheck, Phone, Mail, MessageSquare, ExternalLink, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { showSuccess } from "@/lib/swal";

interface DeveloperInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeveloperInfoModal({ isOpen, onClose }: DeveloperInfoModalProps) {
  if (!isOpen) return null;

  const copyText = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("คัดลอกสำเร็จ!", `คัดลอก ${label}: ${text} ลงในคลิปบอร์ดแล้ว`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-100 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">ระบบแนะนำผู้พัฒนาโปรแกรม</h3>
              <p className="text-xs text-slate-400">SMARTO Platform by Tomvis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg border border-white/20 shrink-0">
            T
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-white text-sm">Tomvis (Smart Jeff Software)</h4>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Verified Dev ✅
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ผู้พัฒนาและสถาปนิกซอฟต์แวร์ระบบ SMARTO (Workforce & License Engine)
            </p>
          </div>
        </div>

        {/* Contact Links */}
        <div className="space-y-2 text-xs">
          <div
            onClick={() => copyText("เบอร์โทรศัพท์", "081-999-8888")}
            className="bg-slate-950 hover:bg-slate-800/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-2.5 text-slate-300">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>เบอร์โทรศัพท์: <strong className="text-white font-mono">081-999-8888</strong></span>
            </div>
            <span className="text-[10px] text-brand-400 font-bold">คัดลอก</span>
          </div>

          <div
            onClick={() => copyText("LINE", "@tomvis")}
            className="bg-slate-950 hover:bg-slate-800/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-2.5 text-slate-300">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>LINE ID: <strong className="text-white font-mono">@tomvis</strong></span>
            </div>
            <span className="text-[10px] text-brand-400 font-bold">คัดลอก</span>
          </div>

          <div
            onClick={() => copyText("อีเมล", "support@smartjeff.com")}
            className="bg-slate-950 hover:bg-slate-800/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-2.5 text-slate-300">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>Email: <strong className="text-white font-mono">support@smartjeff.com</strong></span>
            </div>
            <span className="text-[10px] text-brand-400 font-bold">คัดลอก</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/about-developer"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl text-center border border-slate-700 transition-all flex items-center justify-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>ดูพอร์ตและรายละเอียดเต็ม</span>
          </Link>

          <Link
            href="/tomvis"
            onClick={onClose}
            className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-2xl text-center shadow-lg transition-all flex items-center justify-center space-x-1.5"
          >
            <Cpu className="w-4 h-4" />
            <span>เข้า Tomvis Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
