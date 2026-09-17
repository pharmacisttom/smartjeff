"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Wifi, WifiOff, AlertTriangle, Cpu, Sparkles } from "lucide-react";
import Link from "next/link";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { DeveloperInfoModal } from "./DeveloperInfoModal";

export function TopBar() {
  const { status, isOffline, isSlow } = useNetworkStatus();
  const [darkMode, setDarkMode] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
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

  return (
    <>
      <header className="sticky top-0 z-20 w-full bg-surface-bg/95 backdrop-blur border-b border-surface-border safe-pt font-sans">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Company Title on Mobile */}
          <div className="flex items-center space-x-2 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
              S
            </div>
            <div>
              <h1 className="text-base font-bold text-content-primary leading-tight">SMARTO</h1>
              <p className="text-[10px] text-content-muted leading-none">J2K Housekeeping</p>
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
              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                <Wifi className="w-3.5 h-3.5" />
                <span>เชื่อมต่อแล้ว</span>
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            {/* Developer Info Button */}
            <button
              onClick={() => setShowDevModal(true)}
              className="flex items-center space-x-1.5 text-[11px] font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 px-2.5 py-1 rounded-full transition-all active:scale-95"
            >
              <Cpu className="w-3.5 h-3.5 text-brand-500" />
              <span className="hidden sm:inline">ผู้พัฒนา Tomvis</span>
            </button>

            <button
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2 rounded-xl text-content-secondary hover:bg-surface-subtle transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="flex items-center space-x-2 pl-2 border-l border-surface-border">
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 flex items-center justify-center font-semibold text-xs">
                พม
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Developer Modal Popup */}
      <DeveloperInfoModal isOpen={showDevModal} onClose={() => setShowDevModal(false)} />
    </>
  );
}
