import { prisma } from "../../lib/prisma";

export interface AuthorizeOptions {
  userId: string;
  permission: string;
  resourceType?: string;
  resourceId?: string;
  scope?: {
    type: "OWN" | "TEAM" | "DEPARTMENT" | "SITE" | "PROJECT" | "CLIENT" | "ORGANIZATION" | "GLOBAL";
    id?: string;
  };
}

export interface AuthorizeResult {
  allowed: boolean;
  reason: string;
  matchedRole?: string;
  matchedScope?: string;
}

export interface UserAuthzContext {
  userId: string;
  authzVersion: number;
  roles: {
    id: string;
    code: string;
    nameTh: string;
    level: number;
    departmentType: string | null;
  }[];
  assignments: {
    roleCode: string;
    scopeType: string;
    scopeId: string | null;
    permissions?: string[];
    startAt: Date | null;
    endAt: Date | null;
  }[];
  permissions: Set<string>;
  scopes: {
    type: string;
    id: string | null;
  }[];
  isSuperAdmin: boolean;
  isSecurityAdmin: boolean;
  isPlatformAdmin: boolean;
}

export class AuthorizationService {
  /**
   * Fetch full authorization context for a user with active role assignments
   */
  static async getUserContext(userId: string): Promise<UserAuthzContext | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        authzVersion: true,
        isActive: true,
        isLocked: true,
        roleAssignments: {
          where: {
            status: "ACTIVE",
            OR: [
              { endAt: null },
              { endAt: { gte: new Date() } },
            ],
          },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive || user.isLocked) {
      return null;
    }

    const permissions = new Set<string>();
    const rolesMap = new Map<string, any>();
    const scopes: { type: string; id: string | null }[] = [];
    const assignments: {
      roleCode: string;
      scopeType: string;
      scopeId: string | null;
      permissions?: string[];
      startAt: Date | null;
      endAt: Date | null;
    }[] = [];

    let isSuperAdmin = false;
    let isSecurityAdmin = false;
    let isPlatformAdmin = false;

    for (const assignment of user.roleAssignments) {
      // Check start date for temporary roles
      if (assignment.startAt && assignment.startAt > new Date()) {
        continue;
      }

      const role = assignment.role;
      if (!role.isActive) continue;

      if (role.code === "SUPER_ADMIN" || role.code === "BREAK_GLASS_ADMIN") isSuperAdmin = true;
      if (role.code === "SECURITY_ADMIN") isSecurityAdmin = true;
      if (role.code === "PLATFORM_ADMIN") isPlatformAdmin = true;

      rolesMap.set(role.code, {
        id: role.id,
        code: role.code,
        nameTh: role.nameTh,
        level: role.level,
        departmentType: role.departmentType,
      });

      scopes.push({
        type: assignment.scopeType,
        id: assignment.scopeId,
      });

      const rolePerms: string[] = [];
      for (const rp of role.permissions) {
        if (rp.permission.isActive) {
          permissions.add(rp.permission.code);
          rolePerms.push(rp.permission.code);
        }
      }

      assignments.push({
        roleCode: role.code,
        scopeType: assignment.scopeType,
        scopeId: assignment.scopeId,
        permissions: rolePerms,
        startAt: assignment.startAt,
        endAt: assignment.endAt,
      });
    }

    return {
      userId: user.id,
      authzVersion: user.authzVersion,
      roles: Array.from(rolesMap.values()),
      assignments,
      permissions,
      scopes,
      isSuperAdmin,
      isSecurityAdmin,
      isPlatformAdmin,
    };
  }

  /**
   * Central authorize check: Permission + Scope + Resource
   */
  static async authorize(opts: AuthorizeOptions): Promise<AuthorizeResult> {
    const context = await this.getUserContext(opts.userId);

    if (!context) {
      return {
        allowed: false,
        reason: "บัญชีผู้ใช้ถูกระงับ ปิดการใช้งาน หรือไม่มีสิทธิ์ในระบบ",
      };
    }

    // 1. Super Admin has unrestricted access unless restricted by SoD/Privacy
    if (context.isSuperAdmin) {
      return {
        allowed: true,
        reason: "ได้รับสิทธิ์เต็มรูปแบบในฐานะผู้ดูแลระบบสูงสุด (SUPER_ADMIN)",
        matchedRole: "SUPER_ADMIN",
        matchedScope: "GLOBAL",
      };
    }

    // 2. Check if user has permission
    if (!context.permissions.has(opts.permission)) {
      return {
        allowed: false,
        reason: `ไม่พบสิทธิ์ '${opts.permission}' ในบทบาทใด ๆ ของผู้ใช้`,
      };
    }

    // 3. Find the role that grants this permission and evaluate Scope
    let matchedRole: string | undefined;
    let matchedScope: string | undefined;

    for (const assignment of context.assignments) {
      let hasPermInRole = assignment.permissions?.includes(opts.permission);

      if (hasPermInRole === undefined) {
        // Fallback to DB query if permissions array not present
        const role = await prisma.role.findUnique({
          where: { code: assignment.roleCode },
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        });

        hasPermInRole = role?.permissions.some(
          (rp) => rp.permission.code === opts.permission && rp.permission.isActive
        );
      }

      if (hasPermInRole) {
        matchedRole = assignment.roleCode;
        matchedScope = assignment.scopeType;

        // Scope validation
        if (assignment.scopeType === "GLOBAL" || assignment.scopeType === "ORGANIZATION") {
          return {
            allowed: true,
            reason: `ได้รับสิทธิ์ ${opts.permission} จากบทบาท ${assignment.roleCode} ขอบเขต ${assignment.scopeType}`,
            matchedRole,
            matchedScope,
          };
        }

        if (opts.scope) {
          // If required scope matches or is within user scope
          if (assignment.scopeType === opts.scope.type) {
            if (!assignment.scopeId || assignment.scopeId === opts.scope.id) {
              return {
                allowed: true,
                reason: `ได้รับสิทธิ์ ${opts.permission} จากบทบาท ${assignment.roleCode} ขอบเขต ${assignment.scopeType}:${assignment.scopeId || "ทั้งหมด"}`,
                matchedRole,
                matchedScope,
              };
            }
          }
        } else {
          // If no specific resource scope required, permission is allowed within user's assigned scope
          return {
            allowed: true,
            reason: `ได้รับสิทธิ์ ${opts.permission} จากบทบาท ${assignment.roleCode} ขอบเขต ${assignment.scopeType}`,
            matchedRole,
            matchedScope,
          };
        }
      }
    }

    return {
      allowed: false,
      reason: `มีสิทธิ์ ${opts.permission} แต่ขอบเขตข้อมูล (Scope) ไม่ตรงกับทรัพยากรที่ร้องขอ`,
      matchedRole,
      matchedScope,
    };
  }

  /**
   * Explain Access: "ทำไมผู้ใช้นี้จึงมีสิทธิ์?"
   */
  static async explainAccess(userId: string, permissionCode: string): Promise<{
    hasAccess: boolean;
    explanation: string;
    details: {
      roleCode: string;
      roleNameTh: string;
      scopeType: string;
      scopeId: string | null;
      grantedVia: string;
    }[];
  }> {
    const context = await this.getUserContext(userId);
    if (!context) {
      return {
        hasAccess: false,
        explanation: "ผู้ใช้งานไม่มีสถานะ Active หรือถูกระงับการใช้งาน",
        details: [],
      };
    }

    const details: {
      roleCode: string;
      roleNameTh: string;
      scopeType: string;
      scopeId: string | null;
      grantedVia: string;
    }[] = [];

    for (const assignment of context.assignments) {
      const role = await prisma.role.findUnique({
        where: { code: assignment.roleCode },
        include: {
          permissions: {
            where: { permission: { code: permissionCode, isActive: true } },
            include: { permission: true },
          },
        },
      });

      if (role && role.permissions.length > 0) {
        details.push({
          roleCode: role.code,
          roleNameTh: role.nameTh,
          scopeType: assignment.scopeType,
          scopeId: assignment.scopeId,
          grantedVia: `บทบาท ${role.nameTh} (${role.code}) ขอบเขต ${assignment.scopeType}${assignment.scopeId ? ` ID: ${assignment.scopeId}` : ""}`,
        });
      }
    }

    if (context.isSuperAdmin && details.length === 0) {
      details.push({
        roleCode: "SUPER_ADMIN",
        roleNameTh: "ผู้ดูแลระบบสูงสุด",
        scopeType: "GLOBAL",
        scopeId: null,
        grantedVia: "สิทธิ์ครอบคลุมทุกระบบในฐานะผู้ดูแลระบบสูงสุด (SUPER_ADMIN)",
      });
    }

    const hasAccess = details.length > 0;
    const explanation = hasAccess
      ? `ผู้ใช้งานได้รับสิทธิ์ ${permissionCode} จาก ${details.map((d) => d.grantedVia).join(" และ ")}`
      : `ผู้ใช้งานไม่มีสิทธิ์ ${permissionCode} ในบทบาทใด ๆ`;

    return {
      hasAccess,
      explanation,
      details,
    };
  }

  /**
   * Invalidate all active sessions for a user by incrementing authzVersion
   */
  static async invalidateUserSessions(userId: string): Promise<number> {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        authzVersion: { increment: 1 },
      },
      select: { authzVersion: true },
    });

    // Revoke all active user sessions in UserSession table
    await prisma.userSession.updateMany({
      where: { userId, status: "ACTIVE" },
      data: { status: "REVOKED" },
    });

    return updated.authzVersion;
  }
}
