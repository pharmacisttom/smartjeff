"use client";

import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "pills" | "compact" | "cards";
  showLabel?: boolean;
}

export function LanguageSwitcher({
  className,
  variant = "pills",
  showLabel = false,
}: LanguageSwitcherProps) {
  const { locale, setLocale, languages, t } = useLanguage();

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center p-0.5 rounded-xl bg-surface-subtle border border-surface-border",
          className
        )}
        role="group"
        aria-label="Language selector"
      >
        {languages.map((lang) => {
          const isActive = locale === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLocale(lang.code)}
              className={cn(
                "px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1",
                isActive
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-600/25 scale-[1.02]"
                  : "text-content-muted hover:text-content-primary hover:bg-surface-card"
              )}
              title={lang.nativeName}
            >
              <span>{lang.flag}</span>
              <span className="text-[11px]">{lang.short}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className={cn("grid grid-cols-3 gap-2 w-full", className)}>
        {languages.map((lang) => {
          const isActive = locale === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLocale(lang.code)}
              className={cn(
                "flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all text-center group",
                isActive
                  ? "bg-brand-500/10 border-brand-500 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 ring-2 ring-brand-500/20 shadow-sm"
                  : "bg-surface-card/60 border-surface-border text-content-secondary hover:border-brand-500/40 hover:bg-surface-card"
              )}
            >
              <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                {lang.flag}
              </span>
              <span className="text-xs font-black tracking-tight">{lang.label}</span>
              <span className="text-[10px] text-content-muted font-medium mt-0.5">
                {lang.nativeName}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Default: Segmented Pills
  return (
    <div className={cn("inline-flex items-center space-x-1.5", className)}>
      {showLabel && (
        <div className="flex items-center space-x-1 text-xs text-content-muted font-semibold mr-1">
          <Globe className="w-3.5 h-3.5 text-brand-500" />
          <span>{t("common.language")}:</span>
        </div>
      )}
      <div
        className="inline-flex items-center p-1 rounded-2xl bg-surface-subtle/80 dark:bg-slate-900/60 border border-surface-border shadow-inner"
        role="group"
        aria-label="Language selector"
      >
        {languages.map((lang) => {
          const isActive = locale === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLocale(lang.code)}
              className={cn(
                "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95",
                isActive
                  ? "bg-brand-600 text-white shadow-md shadow-brand-600/30 scale-100"
                  : "text-content-secondary hover:text-content-primary hover:bg-surface-card/60"
              )}
              title={lang.nativeName}
            >
              <span className="text-sm leading-none">{lang.flag}</span>
              <span className="tracking-tight">{lang.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
