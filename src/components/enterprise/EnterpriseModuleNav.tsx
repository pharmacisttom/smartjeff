"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavTab {
  label: string;
  href: string;
}

export function EnterpriseModuleNav({
  tabs,
  items,
}: {
  tabs?: NavTab[];
  items?: NavTab[];
}) {
  const pathname = usePathname();
  const navList = tabs || items || [];

  return (
    <div className="flex items-center space-x-1 overflow-x-auto border-b border-surface-border pb-2 custom-scrollbar">
      {navList.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
              isActive
                ? "bg-brand-600 text-white shadow-sm shadow-brand-600/20"
                : "text-content-secondary hover:bg-surface-subtle hover:text-content-primary"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export default EnterpriseModuleNav;
