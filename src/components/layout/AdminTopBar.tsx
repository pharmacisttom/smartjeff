"use client";

import { useState, useEffect } from "react";
import {
  Home,
  ArrowLeft,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  AlertTriangle,
  Cpu,
  LogOut,
  ShieldCheck,
  LayoutGrid,
  ChevronDown,
  Building2,
  Users,
  Clock,
  CreditCard,
  Lock,
  DollarSign,
  FileCheck,
  MessageSquare,
  BarChart3,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { DeveloperInfoModal } from "./DeveloperInfoModal";
import { cn } from "@/lib/utils";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  primaryRole?: string;
  isSuperAdmin?: boolean;
  isSecurityAdmin?: boolean;
}

// Quick navigation menu items for Admin
const ADMIN_NAV_LINKS = [
  { label: "หน้าแรก (แดชบอร์ด)", href: "/admin/dashboard", icon: Home },
  { label: "จัดการพนักงาน", href: "/admin/employees", icon: Users },
  { label: "อนุมัติเวลาทำงาน", href: "/admin/attendance", icon: Clock },
  { label: "คำนวณเงินเดือน", href: "/admin/payroll", icon: DollarSign },
  { label: "โรงงาน & ไซต์งาน", href: "/admin/sites", icon: Building2 },
  { label: "การเงิน & ค่าใช้จ่าย", href: "/admin/expenses", icon: CreditCard },
  { label: "จัดการบทบาท & สิทธิ์", href: "/admin/security/roles", icon: Lock },
  { label: "จัดการผู้ใช้ & สิทธิ์", href: "/admin/security/users", icon: Users },
  { label: "ตรวจสอบทบทวนสิทธิ์", href: "/admin/security/access-review", icon: FileCheck },
  { label: "AI & แชทภายใน", href: "/admin/chat", icon: MessageSquare },
  { label: "รายงานผู้บริหาร", href: "/admin/reports", icon: BarChart3 },
];

function getPageTitle(pathname: string): string {
  if (pathname === "/admin/dashboard" || pathname === "/admin") return "หน้าแรก (แดชบอร์ดผู้บริหาร)";
  if (pathname.includes("/admin/security/roles")) return "จัดการบทบาทและสิทธิ์ (Roles)";
  if (pathname.includes("/admin/security/users")) return "จัดการผู้ใช้งาน (Users)";
  if (pathname.includes("/admin/security/sessions")) return "จัดการ Session ผู้ใช้";
  if (pathname.includes("/admin/security/permission-matrix")) return "ตารางสิทธิ์การใช้งาน (Matrix)";
  if (pathname.includes("/admin/security/access-review")) return "ตรวจสอบและทบทวนสิทธิ์ (Access Review)";
  if (pathname.includes("/admin/security/access-requests")) return "คำขอเข้าถึงข้อมูล";
  if (pathname.includes("/admin/employees")) return "จัดการข้อมูลพนักงาน (Employees)";
  if (pathname.includes("/admin/attendance")) return "อนุมัติเวลาปฏิบัติงาน (Attendance)";
  if (pathname.includes("/admin/payroll")) return "ระบบคำนวณเงินเดือน (Payroll)";
  if (pathname.includes("/admin/sites")) return "จัดการโรงงานและนิคมฯ (Sites)";
  if (pathname.includes("/admin/expenses")) return "การเงินและค่าใช้จ่าย (Expenses)";
  if (pathname.includes("/admin/chat")) return "AI ผู้ช่วย & แชท (Chat)";
  if (pathname.includes("/admin/operations")) return "การปฏิบัติงาน (Operations)";
  if (pathname.includes("/admin/reports")) return "รายงานสรุป (Reports)";
  if (pathname.includes("/admin/settings")) return "ตั้งค่าระบบ (Settings)";
  return "ระบบหลังบ้าน (Admin)";
}

export function AdminTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOffline, isSlow } = useNetworkStatus();
  const [darkMode, setDarkMode] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);

    async function loadUser() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
          }
        }
      } catch (err) {
        console.error("Failed to load session for AdminTopBar:", err);
      }
    }

    loadUser();
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("smarto_theme", "light");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("smarto_theme", "dark");
      setDarkMode(true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem("smarto_user");
      window.location.href = "/login";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs font-sans transition-colors">
        <div className="flex items-center justify-between h-14 px-3 sm:px-4 max-w-7xl mx-auto w-full gap-2">
          {/* Left Controls: Home Button + Back Button + Breadcrumb */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Logo */}
            <Link
              href="/admin/dashboard"
              className="flex items-center space-x-2 group mr-1"
              title="ไปยังหน้าแรก SMARTO Admin"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md group-hover:scale-105 transition-transform">
                S
              </div>
              <div className="hidden lg:block text-left leading-none">
                <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">SMARTO</span>
                <span className="block text-[9px] text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">
                  Admin System
                </span>
              </div>
            </Link>

            {/* Back Button */}
            {pathname !== "/admin/dashboard" && (
              <button
                type="button"
                onClick={() => router.back()}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
                title="ย้อนกลับหน้าก่อนหน้า"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {/* Prominent HOME BUTTON (ปุ่มไปยังหน้าแรก) */}
            <Link
              href="/admin/dashboard"
              className={cn(
                "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95",
                pathname === "/admin/dashboard"
                  ? "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                  : "bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/20"
              )}
              title="กลับไปยังหน้าแรกแดชบอร์ด"
            >
              <Home className="w-4 h-4" />
              <span>หน้าแรก</span>
            </Link>

            {/* Quick Menu Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all"
                title="เลือกเมนูระบบ"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span className="hidden md:inline">เมนูระบบ</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform", showMenuDropdown && "rotate-180")} />
              </button>

              {/* Menu Dropdown Modal / Popup */}
              {showMenuDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenuDropdown(false)}
                  />
                  <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        เมนูระบบหลังบ้าน (Admin Menu)
                      </span>
                      <button
                        onClick={() => setShowMenuDropdown(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto py-1 space-y-0.5">
                      {ADMIN_NAV_LINKS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setShowMenuDropdown(false)}
                            className={cn(
                              "flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors",
                              isActive
                                ? "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800"
                                : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                          >
                            <Icon className={cn("w-4 h-4", isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-400")} />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Page Title Indicator */}
            <div className="hidden xl:flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 pl-1 border-l border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {getPageTitle(pathname)}
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Status Indicator */}
            {isOffline && (
              <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ออฟไลน์</span>
              </div>
            )}
            {isSlow && !isOffline && (
              <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">เน็ตช้า</span>
              </div>
            )}
            {!isOffline && !isSlow && (
              <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <Wifi className="w-3.5 h-3.5" />
                <span>ออนไลน์</span>
              </div>
            )}

            {/* Developer Info Button */}
            <button
              onClick={() => setShowDevModal(true)}
              className="flex items-center space-x-1 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 px-2.5 py-1.5 rounded-xl transition-all active:scale-95"
              title="ข้อมูลผู้พัฒนาโปรแกรม"
            >
              <Cpu className="w-3.5 h-3.5 text-brand-500" />
              <span className="hidden md:inline">Tomvis</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
              title={darkMode ? "เปิดโหมดสว่าง" : "เปิดโหมดมืด"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Profile Snippet & Logout */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs uppercase border border-brand-500/20">
                  {currentUser?.name?.slice(0, 2) || "AD"}
                </div>
                {currentUser?.name && (
                  <div className="hidden lg:block text-left text-xs leading-tight">
                    <p className="font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                      {currentUser.primaryRole || currentUser.role || "Admin"}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                title="ออกจากระบบ"
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors border border-rose-500/20 active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ออก</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Developer Modal Popup */}
      <DeveloperInfoModal isOpen={showDevModal} onClose={() => setShowDevModal(false)} />
    </>
  );
}
