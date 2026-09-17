"use client";

import { useEffect, useState } from "react";
import { PermissionCode } from "@/lib/rbac/permissions";
import { hasPermission } from "@/lib/rbac/check";

interface CanProps {
  permission: PermissionCode | PermissionCode[];
  mode?: "any" | "all";
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function Can({ permission, mode = "any", fallback = null, children }: CanProps) {
  const [currentUser, setCurrentUser] = useState<{ roleCode: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("smarto_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser({ roleCode: parsed.role || "USER" });
      } else {
        // Fallback default role: ADMIN when in admin portal
        setCurrentUser({ roleCode: "ADMIN" });
      }
    } catch (e) {
      setCurrentUser({ roleCode: "USER" });
    }
  }, []);

  if (!currentUser) return <>{fallback}</>;

  const allowed = hasPermission(currentUser, permission, mode);
  return allowed ? <>{children}</> : <>{fallback}</>;
}
