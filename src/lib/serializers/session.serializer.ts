export interface RawSession {
  id: string;
  sessionId: string;
  userId: string;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  status: string;
  authStrength: string;
  authzVersion: number;
  lastSeenAt: Date;
  expiresAt: Date;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    displayName?: string | null;
    type: string;
    roleAssignments?: {
      role: {
        code: string;
        nameTh: string;
      };
    }[];
  } | null;
}

export class SessionSerializer {
  /**
   * Mask IP address for privacy protection
   */
  static maskIp(ip: string | null | undefined): string {
    if (!ip) return "N/A";
    if (ip === "::1" || ip === "127.0.0.1") return "127.0.0.1 (Localhost)";
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
    // IPv6 masking
    if (ip.includes(":")) {
      const v6Parts = ip.split(":");
      return `${v6Parts[0]}:${v6Parts[1]}:****:****`;
    }
    return "***.***.***";
  }

  static serialize(session: RawSession): Record<string, any> {
    const roles = session.user?.roleAssignments?.map((a) => a.role.nameTh) || [];
    const primaryRole = roles[0] || "ผู้ใช้งานทั่วไป";

    return {
      id: session.id,
      sessionId: session.sessionId,
      userId: session.userId,
      userName: session.user?.displayName || session.user?.email || "ผู้ใช้งาน",
      userEmail: session.user?.email || "N/A",
      accountType: session.user?.type || "INTERNAL",
      primaryRole,
      deviceInfo: session.deviceInfo || "Web Browser",
      ipAddress: this.maskIp(session.ipAddress),
      authStrength: session.authStrength,
      status: session.status,
      loginAt: session.createdAt,
      lastSeenAt: session.lastSeenAt,
      expiresAt: session.expiresAt,
    };
  }

  static serializeMany(sessions: RawSession[]): Record<string, any>[] {
    return sessions.map((s) => this.serialize(s));
  }
}
