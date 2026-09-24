import { describe, it, expect, vi } from "vitest";
import { AuthorizationService } from "./authorization.service";
import { RoleConflictService } from "./role-conflict.service";
import { EmployeeSerializer } from "../../lib/serializers/employee.serializer";
import { SessionSerializer } from "../../lib/serializers/session.serializer";

describe("SMARTJEFF — Central IAM & Authorization Architecture Tests", () => {
  describe("1. Employee Isolation & Principle of Least Privilege", () => {
    it("should allow an employee to access their own resources (scope OWN)", async () => {
      vi.spyOn(AuthorizationService, "getUserContext").mockResolvedValueOnce({
        userId: "cmu6dzk9p0001a1uhsbn0jqxd",
        authzVersion: 1,
        roles: [{ id: "r1", code: "EMPLOYEE", nameTh: "พนักงาน", level: 1, departmentType: "OPERATIONS" }],
        assignments: [
          { roleCode: "EMPLOYEE", scopeType: "OWN", scopeId: null, permissions: ["attendance.submit"], startAt: null, endAt: null },
        ],
        permissions: new Set(["attendance.submit"]),
        scopes: [{ type: "OWN", id: null }],
        isSuperAdmin: false,
        isSecurityAdmin: false,
        isPlatformAdmin: false,
      });

      const result = await AuthorizationService.authorize({
        userId: "cmu6dzk9p0001a1uhsbn0jqxd", // star user
        permission: "attendance.submit",
      });
      expect(result.allowed).toBe(true);
    });

    it("should deny standard employee from accessing privileged admin permissions", async () => {
      vi.spyOn(AuthorizationService, "getUserContext").mockResolvedValueOnce({
        userId: "cmu6dzk9p0001a1uhsbn0jqxd",
        authzVersion: 1,
        roles: [{ id: "r1", code: "EMPLOYEE", nameTh: "พนักงาน", level: 1, departmentType: "OPERATIONS" }],
        assignments: [
          { roleCode: "EMPLOYEE", scopeType: "OWN", scopeId: null, permissions: ["attendance.submit"], startAt: null, endAt: null },
        ],
        permissions: new Set(["attendance.submit"]),
        scopes: [{ type: "OWN", id: null }],
        isSuperAdmin: false,
        isSecurityAdmin: false,
        isPlatformAdmin: false,
      });

      const result = await AuthorizationService.authorize({
        userId: "cmu6dzk9p0001a1uhsbn0jqxd", // star user
        permission: "security.role.manage",
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("ไม่พบสิทธิ์");
    });
  });

  describe("2. Field-Level Security & Data Masking (EmployeeSerializer)", () => {
    const rawEmployee = {
      id: "emp-101",
      code: "EMP-998877",
      prefix: "นาย",
      firstName: "สมชาย",
      lastName: "ใจดี",
      position: "เจ้าหน้าที่ความปลอดภัย",
      siteId: "site-a",
      phone: "0891234567",
      bankAccount: "1234567890",
      bankName: "KBANK",
      salaryType: "MONTHLY",
      baseSalary: 35000,
      dailyRate: 1200,
      isActive: true,
    };

    it("should mask Employee Code as EMP****** when user lacks employee.code.read", () => {
      const mockViewerContext = {
        userId: "viewer-1",
        authzVersion: 1,
        roles: [],
        assignments: [],
        permissions: new Set(["employee.read"]), // NO employee.code.read
        scopes: [],
        isSuperAdmin: false,
        isSecurityAdmin: false,
        isPlatformAdmin: false,
      };

      const serialized = EmployeeSerializer.serialize(rawEmployee, mockViewerContext, "different-emp");
      expect(serialized.code).toBe("EMP******");
      expect(serialized.isCodeMasked).toBe(true);
    });

    it("should reveal unmasked Employee Code when user has employee.code.read", () => {
      const mockViewerContext = {
        userId: "viewer-hr",
        authzVersion: 1,
        roles: [],
        assignments: [],
        permissions: new Set(["employee.read", "employee.code.read"]),
        scopes: [],
        isSuperAdmin: false,
        isSecurityAdmin: false,
        isPlatformAdmin: false,
      };

      const serialized = EmployeeSerializer.serialize(rawEmployee, mockViewerContext, "different-emp");
      expect(serialized.code).toBe("EMP-998877");
      expect(serialized.isCodeMasked).toBe(false);
    });

    it("should always reveal unmasked Employee Code when an employee views their own profile", () => {
      const mockViewerContext = {
        userId: "star-user",
        authzVersion: 1,
        roles: [],
        assignments: [],
        permissions: new Set<string>(), // No special permissions
        scopes: [],
        isSuperAdmin: false,
        isSecurityAdmin: false,
        isPlatformAdmin: false,
      };

      // viewerEmployeeId matches rawEmployee.id
      const serialized = EmployeeSerializer.serialize(rawEmployee, mockViewerContext, "emp-101");
      expect(serialized.code).toBe("EMP-998877");
      expect(serialized.isCodeMasked).toBe(false);
    });

    it("should mask Salary and Daily Rate if viewer lacks employee.salary.read", () => {
      const mockViewerContext = {
        userId: "security-admin",
        authzVersion: 1,
        roles: [],
        assignments: [],
        permissions: new Set(["employee.read", "security.role.manage"]), // NO employee.salary.read
        scopes: [],
        isSuperAdmin: false,
        isSecurityAdmin: true,
        isPlatformAdmin: false,
      };

      const serialized = EmployeeSerializer.serialize(rawEmployee, mockViewerContext, "different-emp");
      expect(serialized.baseSalary).toBeNull();
      expect(serialized.dailyRate).toBeNull();
      expect(serialized.isSalaryMasked).toBe(true);
      expect(serialized.salaryMaskedDisplay).toBe("••••••");
    });

    it("should mask Phone and Bank Account if viewer lacks specific permissions", () => {
      const mockViewerContext = {
        userId: "regular-staff",
        authzVersion: 1,
        roles: [],
        assignments: [],
        permissions: new Set(["employee.read"]),
        scopes: [],
        isSuperAdmin: false,
        isSecurityAdmin: false,
        isPlatformAdmin: false,
      };

      const serialized = EmployeeSerializer.serialize(rawEmployee, mockViewerContext, "different-emp");
      expect(serialized.phone).toMatch(/^08x-xxx-\d{4}$/);
      expect(serialized.bankAccount).toMatch(/^xxx-x-xxx\d{3}$/);
      expect(serialized.isPhoneMasked).toBe(true);
      expect(serialized.isBankMasked).toBe(true);
    });
  });

  describe("3. Privacy-Preserving Session Serializer (SessionSerializer)", () => {
    it("should mask client IP address and omit personal employee/salary data", () => {
      const mockSession = {
        id: "sess-1",
        sessionId: "sess-uuid-1234",
        userId: "user-99",
        deviceInfo: "Chrome Windows",
        ipAddress: "192.168.1.150",
        status: "ACTIVE",
        authStrength: "PASSWORD",
        authzVersion: 1,
        lastSeenAt: new Date(),
        expiresAt: new Date(),
        createdAt: new Date(),
        user: {
          id: "user-99",
          email: "officer@smartjeff.com",
          displayName: "นายเจ้าหน้าที่",
          type: "INTERNAL",
        },
      };

      const serialized = SessionSerializer.serialize(mockSession);
      expect(serialized.ipAddress).toBe("192.168.***.***");
      expect(serialized.userName).toBe("นายเจ้าหน้าที่");
      expect(serialized).not.toHaveProperty("employeeCode");
      expect(serialized).not.toHaveProperty("salary");
      expect(serialized).not.toHaveProperty("bankAccount");
    });
  });

  describe("4. Separation of Duties (SoD) & Conflict Enforcement", () => {
    it("should block a user from being both the Creator and Final Approver for the same action", () => {
      const sodResult = RoleConflictService.validateSeparationOfDuties({
        creatorId: "user-123",
        approverId: "user-123", // Same person
        actionName: "Payment Voucher #PV-001",
      });

      expect(sodResult.valid).toBe(false);
      expect(sodResult.error).toContain("ละเมิดหลักการแบ่งแยกหน้าที่ (Separation of Duties)");
    });

    it("should allow distinct creator and approver", () => {
      const sodResult = RoleConflictService.validateSeparationOfDuties({
        creatorId: "user-123",
        approverId: "user-456", // Different person
        actionName: "Payment Voucher #PV-001",
      });

      expect(sodResult.valid).toBe(true);
      expect(sodResult.error).toBeUndefined();
    });
  });

  describe("5. Data Scope Isolation & IDOR Protection", () => {
    it("should reject access when user has permission but their scope does not match resource scope", async () => {
      vi.spyOn(AuthorizationService, "getUserContext").mockResolvedValueOnce({
        userId: "user-mock-site-a",
        authzVersion: 1,
        roles: [{ id: "r2", code: "SUPERVISOR", nameTh: "หัวหน้างาน", level: 2, departmentType: "OPERATIONS" }],
        assignments: [
          { roleCode: "SUPERVISOR", scopeType: "SITE", scopeId: "SITE-A", permissions: ["attendance.approve"], startAt: null, endAt: null },
        ],
        permissions: new Set(["attendance.approve"]),
        scopes: [{ type: "SITE", id: "SITE-A" }],
        isSuperAdmin: false,
        isSecurityAdmin: false,
        isPlatformAdmin: false,
      });

      // Mock an authorize call with mismatched Site scope (user has SITE-A, requests SITE-B)
      const mockOptions = {
        userId: "user-mock-site-a",
        permission: "attendance.approve",
        scope: {
          type: "SITE" as const,
          id: "SITE-B", // Requesting Site B
        },
      };

      const result = await AuthorizationService.authorize(mockOptions);
      expect(result.allowed).toBe(false);
    });
  });
});
