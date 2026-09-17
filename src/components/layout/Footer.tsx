"use client";

import { useState } from "react";
import Link from "next/link";
import { Cpu, ShieldCheck, Sparkles, Heart, KeyRound, ExternalLink } from "lucide-react";
import { DeveloperInfoModal } from "./DeveloperInfoModal";

export function Footer() {
  const [showDevModal, setShowDevModal] = useState(false);

  return (
    <>
      <footer className="w-full bg-surface-card border-t border-surface-border py-6 px-4 text-xs text-content-muted font-sans mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: App Copyright Info */}
          <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-3 text-center sm:text-left">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                S
              </div>
              <span className="font-bold text-content-primary">SMARTO</span>
            </div>
            <span className="hidden sm:inline text-surface-border">|</span>
            <span>J2K Housekeeping Management System v2.6</span>
          </div>

          {/* Center: Developer Badge & Link (Tomvis) */}
          <div className="flex items-center space-x-2">
            <span>พัฒนาและดูแลระบบโดย</span>
            <button
              onClick={() => setShowDevModal(true)}
              className="inline-flex items-center space-x-1.5 font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 px-3 py-1 rounded-full transition-all active:scale-95 cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-brand-500" />
              <span>Tomvis</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </button>
          </div>

          {/* Right: License Status & Vendor Link */}
          <div className="flex items-center space-x-3">
            <Link
              href="/about-developer"
              className="hover:text-content-primary transition-colors text-[11px] font-semibold"
            >
              แนะนำผู้พัฒนา
            </Link>
            <span className="text-surface-border">•</span>
            <Link
              href="/tomvis"
              className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline text-[11px]"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>License Status: Active ✅</span>
            </Link>
          </div>
        </div>
      </footer>

      {/* Developer Modal Popup */}
      <DeveloperInfoModal isOpen={showDevModal} onClose={() => setShowDevModal(false)} />
    </>
  );
}
