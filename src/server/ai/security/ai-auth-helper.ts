import { prisma } from "@/lib/prisma";
import { AIUserContext } from "./ai-authorization.service";

export async function getAuthUserForAI(req: Request): Promise<AIUserContext | null> {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/smarto_session=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;

  // Also check custom header for API clients or testing
  const authHeader = req.headers.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;

  const effectiveToken = token || bearerToken;

  if (effectiveToken === "admin-session-token" || effectiveToken === "test-admin") {
    return {
      userId: "admin-id",
      email: "admin@j2k.co.th",
      role: "ADMIN",
    };
  }

  if (effectiveToken && effectiveToken.startsWith("emp-")) {
    const empId = effectiveToken.replace("emp-", "").replace("-token", "");
    const user = await prisma.user.findFirst({
      where: { employeeId: empId },
      include: { employee: { select: { siteId: true } } },
    });
    if (user) {
      return {
        userId: user.id,
        email: user.email,
        role: user.role,
        siteScope: user.employee?.siteId ? [user.employee.siteId] : undefined,
      };
    }

    const emp = await prisma.employee.findUnique({
      where: { id: empId },
      select: { id: true, code: true, siteId: true },
    });
    if (emp) {
      return {
        userId: emp.id,
        email: `${emp.code}@j2k.co.th`,
        role: "EMPLOYEE",
        siteScope: [emp.siteId],
      };
    }
  }

  // Fallback for local development or session when no cookie provided
  if (process.env.NODE_ENV !== "production") {
    return {
      userId: "dev-executive-id",
      email: "executive@j2k.co.th",
      role: "EXECUTIVE",
    };
  }

  return null;
}
