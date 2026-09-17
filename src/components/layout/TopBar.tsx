"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Wifi, WifiOff, AlertTriangle, Cpu, LogOut, KeyRound, User as UserIcon, ShieldAlert, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { DeveloperInfoModal } from "./DeveloperInfoModal";

type SessionInfo = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    passwordStatus?: string;
    daysUntilExpiry?: number | null;
  };
  employee?: {
    id: string;
    code: string;
    name: string;
  } | null;
};

export function TopBar() {
  const router = useRouter();
  const { isOffline, isSlow } = useNetworkStatus();
  const [darkMode, setDarkMode] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);

    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setSession(data);
        else setSession(null);
      })
      .catch(() => setSession(null));
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
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    router.push("/login");
    router.refresh();
  };

  const user = session?.user;
  const isExpiring = user?.passwordStatus === "EXPIRING" || (user?.daysUntilExpiry != null && user.daysUntilExpiry <= 30);
  const daysLeft = user?.daysUntilExpiry ?? 0;

  return (
    <>
      <header className="sticky top-0 z-20 w-full bg-surface-bg/95 backdrop-blur border-b border-surface-border safe-pt font-sans">
        {/* Password Expiry Warning Banner */}
        {user && isExpiring && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>แจ้งเตือนความปลอดภัย:</strong> รหัสผ่านของคุณจะหมดอายุในอีก <strong>{daysLeft} วัน</strong>
              </span>
            </div>
            <Link
              href="/account/change-password"
              className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1 font-bold text-white shadow-sm hover:bg-amber-700 transition-colors"
            >
              <KeyRound className="h-3.5 w-3.5" /> เปลี่ยนรหัสผ่าน
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between h-14 px-4">
          {/* Mobile Title */}
          <div className="flex items-center space-x-2 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
              S
            </div>
            <div>
              <h1 className="text-base font-bold text-content-primary leading-tight">SmartJeff</h1>
              <p className="text-[10px] text-content-muted leading-none">Enterprise Operations</p>
            </div>
          </div>

          {/* Network Status Indicator */}
          <div className="flex items-center space-x-2">
            {isOffline && (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                <span>ออฟไลน์</span>
              </div>
            )}

            {isSlow && !isOffline && (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>เน็ตช้า</span>
              </div>
            )}

            {!isOffline && !isSlow && (
              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                <Wifi className="w-3.5 h-3.5" />
                <span>เชื่อมต่อปกติ</span>
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
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
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* User Profile Menu or Login Button */}
            {user ? (
              <div className="relative border-l border-surface-border pl-3">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-full p-1 hover:bg-surface-subtle transition-colors focus:outline-none"
                  aria-label="เมนูผู้ใช้งาน"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-600 font-bold text-white flex items-center justify-center text-xs shadow-sm">
                    {(user.name || user.email || "U").slice(0, 2).toUpperCase()}
                  </div>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-surface-border bg-surface-card p-3 shadow-xl backdrop-blur-xl z-50 space-y-2">
                    <div className="border-b border-surface-border pb-2 px-2">
                      <p className="font-bold text-sm text-content-primary truncate">{user.name || user.email}</p>
                      <p className="text-xs text-content-muted">{user.role}</p>
                      {session.employee?.code && (
                        <p className="text-[11px] text-brand-600 dark:text-brand-400 font-mono">
                          {session.employee.code}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 text-xs font-semibold">
                      <Link
                        href="/account/change-password"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-content-secondary hover:bg-surface-subtle transition-colors"
                      >
                        <KeyRound className="h-4 w-4 text-brand-500" />
                        <span>ตั้งค่าความปลอดภัย / เปลี่ยนรหัสผ่าน</span>
                      </Link>

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <LogOut className="h-4 w-4 text-rose-500" />
                        <span>ออกจากระบบ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>เข้าสู่ระบบ</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Developer Modal */}
      <DeveloperInfoModal isOpen={showDevModal} onClose={() => setShowDevModal(false)} />
    </>
  );
}
