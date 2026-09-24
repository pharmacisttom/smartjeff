"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, History, CalendarOff, FileText, MessageSquare } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

export function BottomNav() {
  const pathname = usePathname();
  const { triggerHaptic } = useHaptic();
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { href: "/check-in", label: t("nav.checkin"), icon: Clock },
    { href: "/history", label: t("nav.history"), icon: History },
    { href: "/leave", label: t("nav.leave"), icon: CalendarOff },
    { href: "/payslip", label: t("nav.payslip"), icon: FileText },
    { href: "/chat", label: t("nav.chat"), icon: MessageSquare },
  ];

  return (
    <nav aria-label="Bottom Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-bg border-t border-surface-border safe-pb shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => triggerHaptic(40)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full min-h-[48px] min-w-[48px] rounded-lg transition-colors active-press",
                isActive
                  ? "text-brand-600 font-semibold"
                  : "text-content-secondary hover:text-content-primary"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-6 h-6 transition-transform", isActive && "scale-110")} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand-500 rounded-full" />
                )}
              </div>
              <span className="text-[11px] mt-1 leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
