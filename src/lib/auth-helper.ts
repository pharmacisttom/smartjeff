import { prisma } from "@/lib/prisma";

export const ALLOWED_EXECUTIVE_ROLES = [
  "ADMIN",
  "SUPERADMIN",
  "SUPER_ADMIN",
  "EXECUTIVE",
  "HR",
  "SITE_MANAGER",
];

export async function getAuthUser(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/smarto_session=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;

  if (!token) return null;

  if (token === "admin-session-token") {
    return {
      id: "admin-id",
      email: "admin@j2k.co.th",
      role: "ADMIN",
    };
  }

  if (token.startsWith("emp-")) {
    const empId = token.replace("emp-", "").replace("-token", "");
    const user = await prisma.user.findFirst({
      where: { employeeId: empId },
    });
    if (user) {
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
      };
    }

    const emp = await prisma.employee.findUnique({
      where: { id: empId },
    });
    if (emp) {
      return {
        id: emp.id,
        email: `${emp.code}@j2k.co.th`,
        role: "EMPLOYEE",
        employeeId: emp.id,
      };
    }
  }

  return null;
}
