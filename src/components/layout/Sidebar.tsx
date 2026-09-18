"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAVIGATION_REGISTRY, NavGroup, NavItem } from "@/config/navigation";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  primaryRole?: string;
  permissions: string[];
  isSuperAdmin?: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const savedState = localStorage.getItem("smarto_sidebar_collapsed");
    if (savedState !== null) {
      setCollapsed(savedState === "true");
    }

    // Auto-expand items whose children match the current pathname
    const initialExpanded: Record<string, boolean> = {};
    NAVIGATION_REGISTRY.forEach((group) => {
      group.items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          const isChildActive = item.children.some(
            (c) => pathname === c.href || (c.href !== "/" && pathname.startsWith(c.href + "/"))
          );
          const isSelfActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
          if (isChildActive || isSelfActive) {
            initialExpanded[item.id] = true;
          }
        }
      });
    });
    setExpandedItems(initialExpanded);

    // Load User and Permissions directly from Server-side Session (Source of Truth)
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
              primaryRole: data.user.primaryRole,
              permissions: data.user.permissions || [],
              isSuperAdmin: data.user.isSuperAdmin,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load session for navigation:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [pathname]);

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

  const toggleSidebar = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    localStorage.setItem("smarto_sidebar_collapsed", String(nextState));
  };

  const toggleSubmenu = (itemId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Check if item should be visible based on user permissions
  const hasItemPermission = (permission?: string) => {
    if (!permission) return true;
    if (!currentUser) return false;
    if (currentUser.isSuperAdmin) return true;
    return currentUser.permissions.includes(permission);
  };

  // Filter dynamic navigation groups
  const visibleGroups = NAVIGATION_REGISTRY.map((group) => {
    const visibleItems = group.items
      .filter((item) => hasItemPermission(item.permission))
      .map((item) => {
        if (!item.children) return item;
        const visibleChildren = item.children.filter((c) => hasItemPermission(c.permission));
        return { ...item, children: visibleChildren };
      });
    return { ...group, items: visibleItems };
  }).filter((group) => group.items.length > 0);

  return (
    <aside
      aria-label="Sidebar Navigation"
      className={cn(
        "hidden md:flex flex-col border-r border-surface-border bg-surface-bg transition-all duration-300 relative z-30 h-screen sticky top-0 font-sans",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-surface-border">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md border border-white/20">
              S
            </div>
            <div>
              <span className="font-black text-lg text-content-primary tracking-tight">SMARTO</span>
              <span className="block text-[10px] text-content-muted leading-none font-semibold">
                SmartJeff Enterprise
              </span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg mx-auto shadow-md">
            S
          </div>
        )}

        <button
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className="p-1.5 rounded-xl text-content-secondary hover:bg-surface-subtle transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Dynamic Permission-Filtered Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
        {loading ? (
          <div className="px-3 py-4 text-xs text-content-muted animate-pulse">
            กำลังโหลดสิทธิ์เมนู...
          </div>
        ) : visibleGroups.length === 0 ? (
          <div className="px-3 py-4 text-xs text-content-muted text-center">
            ไม่พบเมนูที่ได้รับสิทธิ์
          </div>
        ) : (
          visibleGroups.map((group) => (
            <div key={group.id}>
              {!collapsed && (
                <h2 className="px-3 text-[11px] font-bold text-content-muted uppercase tracking-wider mb-2">
                  {group.titleTh}
                </h2>
              )}
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const hasChildren = Boolean(item.children && item.children.length > 0);
                  const isExpanded = Boolean(expandedItems[item.id]);
                  
                  // Active checks
                  const isDirectActive = pathname === item.href;
                  const isChildActive = hasChildren && item.children!.some(
                    (c) => pathname === c.href || (c.href !== "/" && pathname.startsWith(c.href + "/"))
                  );
                  const isActive = isDirectActive || isChildActive;

                  return (
                    <div key={item.id} className="space-y-0.5">
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center flex-1 px-3 py-2 rounded-xl font-medium text-xs transition-all",
                            isActive
                              ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-bold shadow-sm"
                              : "text-content-secondary hover:bg-surface-subtle hover:text-content-primary"
                          )}
                          title={collapsed ? item.labelTh : undefined}
                        >
                          <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-brand-600" : "text-slate-400")} />
                          {!collapsed && <span className="ml-3 truncate flex-1">{item.labelTh}</span>}
                        </Link>

                        {!collapsed && hasChildren && (
                          <button
                            type="button"
                            onClick={(e) => toggleSubmenu(item.id, e)}
                            aria-label={isExpanded ? "Collapse submenu" : "Expand submenu"}
                            className="p-1.5 ml-1 rounded-lg text-content-muted hover:bg-surface-subtle hover:text-content-primary transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Nested sub-menu items */}
                      {!collapsed && hasChildren && isExpanded && (
                        <div className="ml-4 pl-3 border-l-2 border-brand-100 dark:border-brand-950 space-y-0.5 py-1">
                          {item.children!.map((child) => {
                            const isSubActive = pathname === child.href;
                            return (
                              <Link
                                key={child.id}
                                href={child.href}
                                className={cn(
                                  "block px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors truncate",
                                  isSubActive
                                    ? "bg-brand-100/70 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200 font-bold"
                                    : "text-content-muted hover:text-content-primary hover:bg-surface-subtle"
                                )}
                              >
                                {child.labelTh}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          ))
        )}
      </div>

      {/* Footer / User Profile snippet */}
      <div className="p-3 border-t border-surface-border space-y-2 bg-surface-subtle/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-brand-500/15 text-brand-600 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 border border-brand-500/20">
            {currentUser?.name?.slice(0, 2) || "U"}
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-bold text-content-primary truncate">
                {currentUser?.name || "ผู้ใช้งานระบบ"}
              </p>
              <p className="text-[10px] text-brand-600 dark:text-brand-400 truncate font-semibold flex items-center">
                <Shield className="w-3 h-3 mr-1 flex-shrink-0 inline" />
                {currentUser?.primaryRole || currentUser?.role || "ผู้ใช้งานทั่วไป"}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          title={collapsed ? "ออกจากระบบ" : undefined}
          className={cn(
            "w-full flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all border border-rose-500/20 active:scale-95",
            collapsed ? "px-0" : "space-x-2"
          )}
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          {!collapsed && <span>ออกจากระบบ</span>}
        </button>
      </div>
    </aside>
  );
}
