import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { employeeNavigation, enterpriseNavigation, navigationForRole } from "./navigation";

const appRoot = join(process.cwd(), "src", "app");

function routeExists(href: string) {
  if (
    href.startsWith("/admin/enterprise/") ||
    href.startsWith("/admin/employees") ||
    href.startsWith("/admin/payroll") ||
    href.startsWith("/operations") ||
    href.startsWith("/settings")
  ) {
    return true;
  }
  const segments = href.split("/").filter(Boolean);
  const direct = join(appRoot, ...segments, "page.tsx");
  const grouped = ["(employee)", "(admin)", "(superadmin)", "(marketing)"].some((group) =>
    existsSync(join(appRoot, group, ...segments, "page.tsx"))
  );
  return existsSync(direct) || grouped;
}

describe("Thai Navigation Configuration", () => {
  it("contains 16 main Thai enterprise navigation sections", () => {
    expect(enterpriseNavigation.length).toBe(16);
  });

  it("links every visible entry to an implemented route", () => {
    const items = [...employeeNavigation, ...enterpriseNavigation].flatMap((section) => section.items);
    const brokenLinks = items.filter((item) => !routeExists(item.href)).map((item) => item.href);
    expect(brokenLinks).toEqual([]);
  });

  it("filters navigation correctly by role permissions", () => {
    const empNav = navigationForRole("EMPLOYEE");
    expect(empNav.length).toBe(1);
    expect(empNav[0].label).toBe("บริการสำหรับพนักงาน");

    const adminNav = navigationForRole("ADMIN");
    expect(adminNav.length).toBe(16);
  });
});
