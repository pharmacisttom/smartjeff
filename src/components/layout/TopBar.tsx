"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Wifi, WifiOff, AlertTriangle, Cpu, LogOut, ShieldCheck, KeyRound, Home } from "lucide-react";
import Link from "next/link";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { DeveloperInfoModal } from "./DeveloperInfoModal";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  primaryRole?: string;
  isSuperAdmin?: boolean;
  isSecurityAdmin?: boolean;
}

export function TopBar() {
  const { isOffline, isSlow } = useNetworkStatus();
  const [darkMode, setDarkMode] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);

    // Fetch user profile from Server-side session API (Source of Truth)
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
        console.error("Failed to load user for topbar:", err);
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
      <header className="sticky top-0 z-20 w-full bg-surface-bg/95 backdrop-blur border-b border-surface-border safe-pt font-sans">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Home Button & Brand */}
          <div className="flex items-center space-x-2.5">
            <Link
              href={currentUser?.isSuperAdmin || currentUser?.isSecurityAdmin || currentUser?.role === "ADMIN" ? "/admin/dashboard" : "/check-in"}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-sm shadow-brand-600/20 transition-all active:scale-95 shrink-0"
              title="ไปยังหน้าแรก"
            >
              <Home className="w-4 h-4" />
              <span>หน้าแรก</span>
            </Link>

            <div className="flex items-center space-x-2 md:hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                S
              </div>
              <div>
                <h1 className="text-sm font-black text-content-primary leading-tight">SMARTO</h1>
                <p className="text-[10px] text-content-muted leading-none font-semibold">SmartJeff Platform</p>
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-2">
            {isOffline && (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                <span>ออฟไลน์ (Offline)</span>
              </div>
            )}

            {isSlow && !isOffline && (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>เน็ตช้า (Slow Network)</span>
              </div>
            )}

            {!isOffline && !isSlow && (
              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <Wifi className="w-3.5 h-3.5" />
                <span>ออนไลน์</span>
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            {/* Quick Link to Security for Admins */}
            {(currentUser?.isSuperAdmin || currentUser?.isSecurityAdmin) && (
              <Link
                href="/admin/security/roles"
                className="hidden md:flex items-center space-x-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2.5 py-1 rounded-full transition-all"
                title="จัดการสิทธิ์และความปลอดภัย"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>ศูนย์ความปลอดภัย</span>
              </Link>
            )}

            {/* Developer Info Button */}
            <button
              onClick={() => setShowDevModal(true)}
              className="flex items-center space-x-1.5 text-[11px] font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 px-2.5 py-1 rounded-full transition-all active:scale-95"
            >
              <Cpu className="w-3.5 h-3.5 text-brand-500" />
              <span className="hidden sm:inline">ผู้พัฒนา Tomvis</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2 rounded-xl text-content-secondary hover:bg-surface-subtle transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile Snippet (Strictly NO Employee Code in Header) */}
            <div className="flex items-center space-x-2 pl-2 border-l border-surface-border">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500/15 text-brand-600 flex items-center justify-center font-bold text-xs uppercase border border-brand-500/20">
                  {currentUser?.name?.slice(0, 2) || "U"}
                </div>
                {currentUser?.name && (
                  <div className="hidden lg:block text-left text-xs leading-tight">
                    <p className="font-bold text-content-primary">{currentUser.name}</p>
                    <p className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                      {currentUser.primaryRole || currentUser.role || "ผู้ใช้งาน"}
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
                <span className="hidden sm:inline">ออกจากระบบ</span>
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
