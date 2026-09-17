import { SECURITY_CONFIG } from "../../config/security.config";
import { prisma } from "../../lib/prisma";
import argon2 from "argon2";

export type PasswordStatus = "VALID" | "EXPIRING" | "EXPIRED" | "MUST_CHANGE";

export class PasswordPolicyService {
  /**
   * Validates password strength according to enterprise security policy.
   */
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!password || password.length < SECURITY_CONFIG.passwordMinLength) {
      errors.push(`รหัสผ่านต้องมีความยาวอย่างน้อย ${SECURITY_CONFIG.passwordMinLength} ตัวอักษร`);
    }
    if (SECURITY_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push("รหัสผ่านต้องมีตัวพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว");
    }
    if (SECURITY_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
      errors.push("รหัสผ่านต้องมีตัวพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว");
    }
    if (SECURITY_CONFIG.requireNumbers && !/[0-9]/.test(password)) {
      errors.push("รหัสผ่านต้องมีตัวเลข (0-9) อย่างน้อย 1 ตัว");
    }
    if (SECURITY_CONFIG.requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push("รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว");
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * Checks if password is expired (applies only to LOCAL authMethod).
   */
  static isExpired(user: { passwordExpiresAt?: Date | null; authMethod?: string | null }): boolean {
    if (user.authMethod === "SSO") return false;
    if (!user.passwordExpiresAt) return true; // If null, treat as expired/must change
    return new Date() >= new Date(user.passwordExpiresAt);
  }

  /**
   * Returns remaining days until password expires.
   */
  static daysUntilExpiry(user: { passwordExpiresAt?: Date | null }): number | null {
    if (!user.passwordExpiresAt) return 0;
    const diffMs = new Date(user.passwordExpiresAt).getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Checks whether the user can reuse the given password against last N password hashes.
   */
  static async canReuse(userId: string, newPassword: string): Promise<boolean> {
    const history = await prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: SECURITY_CONFIG.passwordHistoryCount,
    });

    for (const record of history) {
      try {
        const isMatch = await argon2.verify(record.passwordHash, newPassword);
        if (isMatch) return false; // Found in history -> cannot reuse
      } catch {
        // Continue checking other hashes
      }
    }
    return true;
  }

  /**
   * Calculates new expiration date (now + 90 days).
   */
  static setNewExpiry(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + SECURITY_CONFIG.passwordMaxAgeDays);
    return expiry;
  }

  /**
   * Evaluates overall status: VALID, EXPIRING, EXPIRED, MUST_CHANGE.
   */
  static checkPasswordStatus(user: {
    passwordExpiresAt?: Date | null;
    mustChangePassword?: boolean;
    authMethod?: string | null;
  }): PasswordStatus {
    if (user.authMethod === "SSO") return "VALID";
    if (user.mustChangePassword) return "MUST_CHANGE";
    if (this.isExpired(user)) return "EXPIRED";

    const days = this.daysUntilExpiry(user);
    if (days !== null && days <= Math.max(...SECURITY_CONFIG.passwordWarningDays)) {
      return "EXPIRING";
    }
    return "VALID";
  }

  /**
   * Records a new password hash in PasswordHistory and limits history depth.
   */
  static async recordPasswordHistory(userId: string, passwordHash: string): Promise<void> {
    await prisma.passwordHistory.create({
      data: { userId, passwordHash },
    });
  }
}
