"use client";

import { Sparkles, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CustomerFeedbackModal } from "./CustomerFeedbackModal";

export function DemoHeaderBanner() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <>
      <div className="w-full bg-gradient-to-r from-amber-600 via-brand-600 to-indigo-600 text-white px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-between gap-2 flex-wrap z-50">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
            DEMO ENVIRONMENT
          </span>
          <span className="hidden sm:inline">
            ข้อมูลในระบบเป็นข้อมูลจำลองสำหรับการสาธิตเพื่อการทดลองใช้งาน
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <Link
            href="/demo/features"
            className="hover:underline flex items-center space-x-1 font-bold text-amber-100 hover:text-white"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>สำรวจ ฟีเจอร์ทั้งหมด</span>
          </Link>
          <span className="text-white/40">|</span>
          <Link
            href="/demo/roadmap"
            className="hover:underline font-medium text-slate-100 hover:text-white"
          >
            Roadmap
          </Link>
          <span className="text-white/40">|</span>
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="bg-white/15 hover:bg-white/25 text-white px-2.5 py-1 rounded-lg transition-all font-bold flex items-center space-x-1"
          >
            <Info className="w-3.5 h-3.5 text-emerald-300" />
            <span>เสนอแนะการพัฒนา</span>
          </button>
        </div>
      </div>

      <CustomerFeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </>
  );
}
