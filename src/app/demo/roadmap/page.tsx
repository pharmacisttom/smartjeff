"use client";

import { ChevronLeft, CheckCircle2, Clock, Sparkles, Rocket } from "lucide-react";
import Link from "next/link";

interface RoadmapItem {
  stage: "AVAILABLE" | "PILOT" | "REQUESTED" | "PLANNED";
  titleTh: string;
  descriptionTh: string;
  modules: string[];
}

const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    stage: "AVAILABLE",
    titleTh: "ระบบหลักบริหารกำลังคนและลงเวลา (Core Workforce)",
    descriptionTh: "พร้อมใช้งานสมบูรณ์ในระบบ Production สำหรับบริหารพนักงาน ลงเวลา GPS คำนวณเงินเดือน และอนุมัติสิทธิ์",
    modules: ["HR", "Attendance", "Leave & OT", "Payroll", "Security IAM"],
  },
  {
    stage: "PILOT",
    titleTh: "แผนที่ติดตามและจัดการหน้าไซต์ (GIS & Operations)",
    descriptionTh: "เปิดทดสอบนำร่องร่วมกับลูกค้ากลุ่มโรงงานและนิคมอุตสาหกรรมในพื้นที่ภาคตะวันออก",
    modules: ["GIS Command", "Workforce Planning", "Work Orders", "Longdo Map"],
  },
  {
    stage: "REQUESTED",
    titleTh: "ระบบบริหารยานพาหนะและพัสดุ (Fleet & Inventory)",
    descriptionTh: "รวบรวมข้อเสนอแนะและฟีเจอร์ที่ลูกค้าขอเพิ่มเติมในการจัดคิวรถ เบิกพัสดุ และตรวจซ่อมสินทรัพย์",
    modules: ["Fleet Management", "Inventory", "Asset & Tools", "Procurement"],
  },
  {
    stage: "PLANNED",
    titleTh: "ระบบอัตโนมัติและปัญญาประดิษฐ์ (Automation & AI Copilot)",
    descriptionTh: "วางแผนพัฒนาโมเดล AI ช่วยวิเคราะห์จุดเสี่ยงของกำลังคนและสรุปรายงานผู้บริหารแบบอัตโนมัติ",
    modules: ["AI Copilot", "Automated Workflows", "QHSE Safety", "Predictive Analytics"],
  },
];

export default function DemoRoadmapPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6 sm:p-10 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          href="/demo/features"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>กลับไปยัง Demo Features</span>
        </Link>
        <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
          SmartOP Product Roadmap
        </span>
      </div>

      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent flex items-center justify-center space-x-2">
          <Rocket className="w-8 h-8 text-indigo-400" />
          <span>แผนการพัฒนาผลิตภัณฑ์ (Product Roadmap)</span>
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          สรุปสถานะการพัฒนา ความพร้อมใช้งาน และทิศทางการต่อยอดฟีเจอร์ของ SmartOP Enterprise Operations Platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {ROADMAP_ITEMS.map((item) => {
          const badgeColor =
            item.stage === "AVAILABLE"
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
              : item.stage === "PILOT"
              ? "bg-brand-500/20 text-brand-300 border-brand-500/30"
              : item.stage === "REQUESTED"
              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
              : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";

          return (
            <div
              key={item.stage}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeColor}`}>
                  {item.stage}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{item.titleTh}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">{item.descriptionTh}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                <p className="text-[11px] font-bold text-slate-400 mb-2">โมดูลที่เกี่ยวข้อง:</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.modules.map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
