"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  History,
  CalendarOff,
  FileText,
  MessageSquare,
  LayoutDashboard,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Radio,
  Sparkles,
  Calendar,
  Bot,
  Boxes,
  ShoppingCart,
  Wrench,
  Briefcase,
  Kanban,
  Target,
  Compass,
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  Landmark,
  Scale,
  PieChart,
  DollarSign,
  Zap,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EMPLOYEE_NAV = [
  { href: "/check-in", label: "ลงเวลาปฏิบัติงาน", icon: Clock },
  { href: "/my-schedule", label: "ตารางกะของฉัน", icon: Calendar },
  { href: "/history", label: "ประวัติลงเวลา", icon: History },
  { href: "/leave", label: "ขอลา & ทำ OT", icon: CalendarOff },
  { href: "/payslip", label: "สลิปเงินเดือน", icon: FileText },
  { href: "/chat", label: "AI ผู้ช่วย HR", icon: MessageSquare },
  { href: "/mobile/inventory", label: "คลังพัสดุมือถือ", icon: Boxes },
  { href: "/mobile/site-survey", label: "สำรวจพื้นที่ (Site Survey)", icon: Compass },
  { href: "/mobile/qhse", label: "ความปลอดภัยมือถือ (QHSE)", icon: ShieldAlert },
];

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "แดชบอร์ดผู้บริหาร", icon: LayoutDashboard },
  { href: "/admin/platform", label: "เสถียรภาพระบบ & DR (SRE)", icon: Activity },
  { href: "/admin/automation", label: "ระบบอัตโนมัติ (Automation)", icon: Zap },
  { href: "/admin/executive/financial-control", label: "ศูนย์ควบคุมการเงิน (Financial Control)", icon: Landmark },
  { href: "/admin/finance/treasury", label: "การเงินและสภาพคล่อง (Treasury)", icon: DollarSign },
  { href: "/admin/finance/reconciliation", label: "กระทบยอดธนาคาร (Reconciliation)", icon: Scale },
  { href: "/admin/finance/budget", label: "งบประมาณองค์กร (Budget Plan)", icon: PieChart },
  { href: "/admin/qhse", label: "ศูนย์ความปลอดภัย (QHSE)", icon: ShieldAlert },
  { href: "/admin/risk", label: "บริหารความเสี่ยง (Risk)", icon: AlertTriangle },
  { href: "/admin/compliance", label: "การปฏิบัติตามเกณฑ์ (Compliance)", icon: FileCheck2 },
  { href: "/admin/crm", label: "ภาพรวมการขาย (CRM)", icon: Briefcase },
  { href: "/admin/crm/pipeline", label: "ไปป์ไลน์การขาย (Pipeline)", icon: Kanban },
  { href: "/admin/crm/leads", label: "ลูกค้าเป้าหมาย (Leads)", icon: Target },
  { href: "/admin/tenders", label: "งานประมูล (Tenders)", icon: FileText },
  { href: "/admin/executive/copilot", label: "AI Operations Copilot", icon: Bot },
  { href: "/admin/ai/governance", label: "กำกับดูแล AI (AI Governance)", icon: ShieldAlert },
  { href: "/admin/operations/live-map", label: "ศูนย์บัญชาการสด (Live Map)", icon: Radio },
  { href: "/admin/inventory", label: "คลังสินค้าและสต็อก (Inventory)", icon: Boxes },
  { href: "/admin/procurement", label: "บริหารงานจัดซื้อ (Procurement)", icon: ShoppingCart },
  { href: "/admin/assets", label: "เครื่องมือและทรัพย์สิน (Assets)", icon: Wrench },
  { href: "/admin/operations/workforce-planning", label: "วางแผนกำลังคน (DSS)", icon: Sparkles },
  { href: "/admin/operations/schedule", label: "จัดตารางกะ (Scheduler)", icon: Calendar },
  { href: "/admin/operations/shifts", label: "ติดตามกะสด (Shifts)", icon: Clock },
  { href: "/admin/employees", label: "จัดการพนักงาน", icon: Users },
  { href: "/admin/sites", label: "จัดการโรงงาน & นิคมฯ", icon: Building2 },
  { href: "/admin/attendance", label: "อนุมัติเวลาปฏิบัติงาน", icon: UserCheck },
  { href: "/admin/payroll", label: "ระบบคำนวณเงินเดือน", icon: ShieldCheck },
  { href: "/admin/chat", label: "HR Admin Chat", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem("smarto_sidebar_collapsed");
    if (savedState !== null) {
      setCollapsed(savedState === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    localStorage.setItem("smarto_sidebar_collapsed", String(nextState));
  };

  const isAdminArea = pathname.startsWith("/admin");

  return (
    <aside
      aria-label="Sidebar Navigation"
      className={cn(
        "hidden md:flex flex-col border-r border-surface-border bg-surface-bg transition-all duration-300 relative z-30 h-screen sticky top-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-surface-border">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              S
            </div>
            <div>
              <span className="font-bold text-lg text-content-primary tracking-tight">SMARTO</span>
              <span className="block text-[10px] text-content-muted leading-none">J2K Housekeeping</span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-lg mx-auto">
            S
          </div>
        )}

        <button
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className="p-1.5 rounded-lg text-content-secondary hover:bg-surface-subtle transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div>
          {!collapsed && (
            <h2 className="px-3 text-xs font-semibold text-content-muted uppercase tracking-wider mb-2">
              เมนูพนักงาน
            </h2>
          )}
          <nav className="space-y-1">
            {EMPLOYEE_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-xl font-medium text-sm transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-semibold"
                      : "text-content-secondary hover:bg-surface-subtle hover:text-content-primary"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-brand-600")} />
                  {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          {!collapsed && (
            <h2 className="px-3 text-xs font-semibold text-content-muted uppercase tracking-wider mb-2">
              ผู้ดูแลระบบ (Admin/HR)
            </h2>
          )}
          <nav className="space-y-1">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-xl font-medium text-sm transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-semibold"
                      : "text-content-secondary hover:bg-surface-subtle hover:text-content-primary"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-brand-600")} />
                  {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / User Profile snippet */}
      <div className="p-3 border-t border-surface-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-content-primary">
            พม
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-content-primary truncate">พัดมา วงค์คำ</p>
              <p className="text-[10px] text-content-muted truncate">นิคมฯ AAM ระยอง</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
