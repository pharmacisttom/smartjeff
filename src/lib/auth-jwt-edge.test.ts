import { describe, it, expect, beforeEach } from "vitest";
import { signToken } from "./auth-jwt";
import { verifyTokenAtEdge } from "./auth-edge";

describe("JWT Node vs Edge Compatibility", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "dev-secret-key-1234567890-min-64-chars-asdfasdfasdfasdfasdfasdfasdf";
  });

  it("should verify token signed in Node environment using verifyTokenAtEdge", async () => {
    const payload = {
      sub: "user-123456",
      email: "admin@smartjeff.com",
      role: "ADMIN",
      type: "INTERNAL",
      name: "Admin User",
    };

    const token = signToken(payload);
    expect(token).toBeTypeOf("string");

    const session = await verifyTokenAtEdge(token);
    expect(session).not.toBeNull();
    expect(session?.sub).toBe("user-123456");
    expect(session?.email).toBe("admin@smartjeff.com");
    expect(session?.role).toBe("ADMIN");
    expect(session?.type).toBe("INTERNAL");
  });

  it("should verify employee token signed in Node using verifyTokenAtEdge", async () => {
    const payload = {
      sub: "emp-789012",
      email: "star",
      role: "EMPLOYEE",
      type: "EMPLOYEE",
      name: "Star Employee",
    };

    const token = signToken(payload);
    const session = await verifyTokenAtEdge(token);
    expect(session).not.toBeNull();
    expect(session?.sub).toBe("emp-789012");
    expect(session?.role).toBe("EMPLOYEE");
  });
});
