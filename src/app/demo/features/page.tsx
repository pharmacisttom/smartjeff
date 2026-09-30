"use client";

import {
  Users,
  Clock,
  CalendarOff,
  ShieldCheck,
  Briefcase,
  MapPin,
  Truck,
  ShoppingCart,
  Package,
  Wrench,
  ShieldAlert,
  CreditCard,
  Lock,
  Workflow,
  Sparkles,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CustomerFeedbackModal } from "@/components/demo/CustomerFeedbackModal";

interface FeatureCardSpec {
  id: string;
  nameTh: string;
  nameEn: string;
  descriptionTh: string;
  icon: any;
  status: "READY" | "DEMO" | "IN_DEVELOPMENT";
  targetRoute: string;
  category: "Core Operational" | "Enterprise" | "Governance & AI";
}

const FEATURE_MODULES: FeatureCardSpec[] = [
  {
    id: "hr",
    nameTh: "การบริหารงานบุคคล (HR & Employees)",
    nameEn: "Human Resources",
    descriptionTh: "จัดการประวัติพนักงาน เอกสาร สิทธิประโยชน์ และสถานะการจ้างงานแบบรวมศูนย์",
    icon: Users,
    status: "READY",
    targetRoute: "/admin/employees",
    category: "Core Operational",
  },
  {
    id: "attendance",
    nameTh: "ระบบเวลาปฏิบัติงาน (Attendance & Geofence)",
    nameEn: "Time & Attendance",
    descriptionTh: "ลงเวลาเข้า-ออกงานผ่านพิกัด GPS Geofence พร้อมระบบตรวจสอบความถูกต้อง",
    icon: Clock,
    status: "READY",
    targetRoute: "/admin/attendance",
    category: "Core Operational",
  },
  {
    id: "leave-ot",
    nameTh: "การขอลา & ทำงานล่วงเวลา (Leave & OT)",
    nameEn: "Leave & Overtime",
    descriptionTh: "ยื่นคำขออนุมัติการลาและชั่วโมง OT ตามระเบียบข้อบังคับและกฎหมายแรงงาน",
    icon: CalendarOff,
    status: "READY",
    targetRoute: "/admin/leaves",
    category: "Core Operational",
  },
  {
    id: "payroll",
    nameTh: "ระบบประมวลผลเงินเดือน (Payroll Processing)",
    nameEn: "Payroll Management",
    descriptionTh: "คำนวณเงินเดือน ภาษี ประกันสังคม รายได้-รายหัก และออกสลิปเงินเดือนแบบอิเล็กทรอนิกส์",
    icon: ShieldCheck,
    status: "READY",
    targetRoute: "/admin/payroll",
    category: "Core Operational",
  },
  {
    id: "operations",
    nameTh: "การปฏิบัติงานหน้าไซต์ (Workforce Operations)",
    nameEn: "Field Operations",
    descriptionTh: "จัดตารางกะ ออกใบสั่งงาน (Work Orders) และกระจายกำลังคนตามไซต์โรงงาน/นิคมฯ",
    icon: Briefcase,
    status: "READY",
    targetRoute: "/admin/operations",
    category: "Core Operational",
  },
  {
    id: "map",
    nameTh: "ศูนย์ควบคุมแผนที่ GIS (GIS Command & Longdo Map)",
    nameEn: "GIS Command Center",
    descriptionTh: "ติดตามพิกัดตำแหน่งกำลังคน ไซต์งาน ทริปเดินทาง และขอบเขตพื้นที่ Geofence แบบ Real-time",
    icon: MapPin,
    status: "READY",
    targetRoute: "/admin/operations/map",
    category: "Core Operational",
  },
  {
    id: "fleet",
    nameTh: "บริหารยานพาหนะและขนส่ง (Fleet & Logistics)",
    nameEn: "Fleet Management",
    descriptionTh: "จัดการคิวรถ พนักงานขับรถ บันทึกทริป เชื้อเพลิง และประวัติบำรุงรักษา",
    icon: Truck,
    status: "DEMO",
    targetRoute: "/admin/enterprise/fleet",
    category: "Enterprise",
  },
  {
    id: "procurement",
    nameTh: "ระบบจัดซื้อจัดหา (Procurement & PR/PO)",
    nameEn: "Procurement",
    descriptionTh: "ขอซื้อ (PR) เปรียบเทียบราคาซัพพลายเออร์ ออกใบสั่งซื้อ (PO) และตรวจรับพัสดุ (GR)",
    icon: ShoppingCart,
    status: "DEMO",
    targetRoute: "/admin/enterprise/procurement",
    category: "Enterprise",
  },
  {
    id: "inventory",
    nameTh: "บริหารคลังพัสดุ (Inventory & Warehouses)",
    nameEn: "Inventory Management",
    descriptionTh: "เบิก-จ่าย ตรวจนับ ย้ายสถานที่จัดเก็บ และแจ้งเตือนสต็อกพัสดุขั้นต่ำ",
    icon: Package,
    status: "DEMO",
    targetRoute: "/admin/enterprise/inventory",
    category: "Enterprise",
  },
  {
    id: "assets",
    nameTh: "ทะเบียนสินทรัพย์ & เครื่องมือ (Asset Management)",
    nameEn: "Asset & Tools",
    descriptionTh: "ควบคุมทะเบียนสินทรัพย์ เครื่องมือช่าง และประวัติซ่อมบำรุงในไซต์งาน",
    icon: Wrench,
    status: "DEMO",
    targetRoute: "/admin/enterprise/inventory/assets",
    category: "Enterprise",
  },
  {
    id: "qhse",
    nameTh: "ความปลอดภัย & อาชีวอนามัย (QHSE & Safety)",
    nameEn: "QHSE & Safety",
    descriptionTh: "บันทึกอุบัติการณ์ (Incident) ตรวจสอบความปลอดภัย และมาตรการแก้ไข CAPA",
    icon: ShieldAlert,
    status: "DEMO",
    targetRoute: "/admin/enterprise/qhse",
    category: "Enterprise",
  },
  {
    id: "finance",
    nameTh: "การเงิน & งบประมาณ (Finance & Budgeting)",
    nameEn: "Finance & Accounting",
    descriptionTh: "ใบแจ้งหนี้ (Invoices) บัญชีลูกหนี้/เจ้าหนี้ และสรุปกระแสเงินสดโครงการ",
    icon: CreditCard,
    status: "DEMO",
    targetRoute: "/admin/enterprise/finance",
    category: "Enterprise",
  },
  {
    id: "security",
    nameTh: "ความปลอดภัยระบบ & IAM (Security & Access Control)",
    nameEn: "Security & IAM",
    descriptionTh: "จัดการบทบาท (Roles) สิทธิ์ (Permissions) Session การเข้าใช้ และ Audit Trail",
    icon: Lock,
    status: "READY",
    targetRoute: "/admin/security",
    category: "Governance & AI",
  },
  {
    id: "automation",
    nameTh: "ระบบกระบวนการอัตโนมัติ (Intelligent Automation)",
    nameEn: "Automation Engine",
    descriptionTh: "ตั้งค่า Workflow เหตุการณ์ระบบ (Events) และกฎการทำงานอัตโนมัติ",
    icon: Workflow,
    status: "DEMO",
    targetRoute: "/admin/automation",
    category: "Governance & AI",
  },
  {
    id: "ai",
    nameTh: "SmartJeff AI Copilot Assistant",
    nameEn: "AI Operations Assistant",
    descriptionTh: "ผู้ช่วยวิเคราะห์ข้อมูลอัจฉริยะ สรุปอัตรากำลังคน และแจ้งเตือนจุดเสี่ยงอัตโนมัติ",
    icon: Sparkles,
    status: "DEMO",
    targetRoute: "/admin/ai",
    category: "Governance & AI",
  },
];

export default function DemoFeaturesShowcasePage() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState("");

  const handleOpenFeedback = (moduleName: string) => {
    setSelectedModule(moduleName);
    setFeedbackOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6 sm:p-10 space-y-8">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>กลับไปยัง Dashboard</span>
        </Link>
        <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold uppercase tracking-wider">
          SmartOP Demo Showcase
        </span>
      </div>

      {/* Hero Banner */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent">
          ศูนย์รวมโมดูลและศักยภาพระบบ SmartOP
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          เลือกทดลองใช้งานทุกโมดูลปฏิบัติการองค์กร ทั้งระบบบริหารกำลังคน การลงเวลา เงินเดือน การควบคุมไซต์งาน ขนส่ง พัสดุ และความปลอดภัย
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {FEATURE_MODULES.map((module) => {
          const IconComponent = module.icon;
          const statusBadgeColor =
            module.status === "READY"
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
              : module.status === "DEMO"
              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
              : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";

          return (
            <div
              key={module.id}
              className="bg-slate-900/80 border border-slate-800/80 hover:border-brand-500/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all hover:scale-[1.01]"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadgeColor}`}
                  >
                    {module.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {module.nameTh}
                  </h3>
                  <p className="text-[11px] text-brand-300 font-mono mt-0.5">
                    {module.nameEn}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    {module.descriptionTh}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-6">
                <button
                  onClick={() => handleOpenFeedback(module.nameTh)}
                  className="text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  เสนอแนะเพิ่ม
                </button>

                <Link
                  href={module.targetRoute}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 transition-all"
                >
                  <span>ทดลองใช้งาน</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <CustomerFeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        defaultModule={selectedModule || "General Showcase"}
      />
    </div>
  );
}
