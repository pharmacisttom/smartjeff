"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Menu, X, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigationForRole, type NavigationSection } from "@/config/navigation";

type SessionUser = { name?: string; email?: string; role?: string; employeeCode?: string };

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCollapsed(localStorage.getItem("smarto_sidebar_collapsed") === "true");
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => setUser(body?.user || null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sections = navigationForRole(user?.role);

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("smarto_sidebar_collapsed", String(next));
  };

  // Filter sections by search query
  const filteredSections: NavigationSection[] = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.label.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-40 rounded-xl border border-surface-border bg-surface-bg p-2 shadow md:hidden"
        aria-label="เปิดเมนูหลัก"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="ปิดเมนูหลัก"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-surface-border bg-surface-bg transition-all duration-300 ease-in-out md:sticky md:top-0 md:z-30",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "md:w-20" : "w-72 md:w-72"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-surface-border px-4">
          <Link href={user?.role === "EMPLOYEE" ? "/check-in" : "/admin/dashboard"} className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 font-black text-white shadow-md">
              S
            </span>
            {!collapsed && (
              <div>
                <b className="text-base font-black text-content-primary">SmartJeff</b>
                <small className="block text-[10px] text-content-muted leading-none">Enterprise Operations</small>
              </div>
            )}
          </Link>
          <button onClick={() => setMobileOpen(false)} className="md:hidden">
            <X className="h-5 w-5 text-content-muted" />
          </button>
          <button
            onClick={toggleCollapse}
            className="hidden rounded-xl p-1.5 hover:bg-surface-subtle md:block text-content-muted transition-colors"
            title={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Search Input */}
        {!collapsed && (
          <div className="p-3 pb-1 border-b border-surface-border/50">
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาเมนู..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-surface-card px-3 py-1.5 pl-8 text-xs text-content-primary placeholder-content-muted focus:border-brand-500 focus:outline-none"
              />
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-content-muted" />
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 space-y-4 overflow-y-auto p-3 scrollbar-thin">
          {filteredSections.map((section) => {
            const isOpen = openSections[section.label] !== false; // open by default
            return (
              <div key={section.label} className="space-y-1">
                {!collapsed && (
                  <button
                    onClick={() => toggleSection(section.label)}
                    className="flex w-full items-center justify-between px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-content-muted hover:text-content-primary transition-colors"
                  >
                    <span>{section.label}</span>
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen ? "" : "-rotate-90")}
                    />
                  </button>
                )}

                {(isOpen || collapsed || searchQuery.length > 0) && (
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href + "/"));
                      return (
                        <Link
                          key={item.href + item.label}
                          href={item.href}
                          title={collapsed ? `${section.label}: ${item.label}` : undefined}
                          className={cn(
                            "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                            active
                              ? "bg-brand-600 text-white shadow-sm font-semibold"
                              : "text-content-secondary hover:bg-surface-subtle hover:text-content-primary"
                          )}
                        >
                          <Icon className={cn("h-5 w-5 shrink-0 transition-transform group-hover:scale-105", active ? "text-white" : "text-content-muted group-hover:text-brand-600")} />
                          {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="border-t border-surface-border p-3 bg-surface-bg">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/50 font-bold text-brand-700 dark:text-brand-300 text-xs">
              {(user?.name || user?.email || "U").slice(0, 2).toUpperCase()}
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-content-primary">{user?.name || user?.email || "กำลังโหลด..."}</p>
                <p className="text-[10px] font-semibold text-content-muted">{user?.role || ""}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
