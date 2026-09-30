export interface DemoAccountConfig {
  key: string;
  email: string;
  alternateEmails?: string[];
  roleCode: string;
  fallbackRoleCode?: string;
  titleTh: string;
  titleEn: string;
  descriptionTh: string;
  landingRoute: string;
  coreMenus: string[];
  scopeType: "GLOBAL" | "SITE" | "PROJECT" | "OWN";
  badge: "DEMO" | "READY" | "BETA";
  status: "READY" | "DEMO" | "IN_DEVELOPMENT" | "NOT_READY";
}

export const DEMO_ACCOUNTS_CONFIG: DemoAccountConfig[] = [
  {
    key: "ADMIN",
    email: "admin@j2k.com",
    alternateEmails: ["pharmacisttom@gmail.com"],
    roleCode: "SUPER_ADMIN",
    titleTh: "ผู้ดูแลระบบ (Admin)",
    titleEn: "System Administrator",
    descriptionTh: "บริหารระบบ ผู้ใช้ สิทธิ์ Security และ Settings",
    landingRoute: "/admin/dashboard",
    coreMenus: [
      "/admin/dashboard",
      "/admin/security/users",
      "/admin/security/roles",
      "/admin/security/permissions",
      "/admin/platform",
      "/admin/settings",
    ],
    scopeType: "GLOBAL",
    badge: "DEMO",
    status: "READY",
  },
  {
    key: "EXECUTIVE",
    email: "executive@j2k.com",
    roleCode: "EXECUTIVE",
    titleTh: "ผู้บริหารระดับสูง (Executive)",
    titleEn: "Executive Management",
    descriptionTh: "Dashboard, KPI, Analytics, Reports",
    landingRoute: "/admin/dashboard",
    coreMenus: [
      "/admin/dashboard",
      "/admin/analytics",
      "/admin/analytics/dashboards",
      "/admin/reports",
      "/admin/roi",
    ],
    scopeType: "GLOBAL",
    badge: "DEMO",
    status: "READY",
  },
  {
    key: "HR",
    email: "hr@j2k.com",
    roleCode: "HR_MANAGER",
    titleTh: "หัวหน้าฝ่าย HR / Payroll",
    titleEn: "HR & Payroll Manager",
    descriptionTh: "Employee, Attendance, Leave, Payroll, Import",
    landingRoute: "/admin/dashboard",
    coreMenus: [
      "/admin/employees",
      "/admin/import",
      "/admin/attendance",
      "/admin/leaves",
      "/admin/payroll",
    ],
    scopeType: "GLOBAL",
    badge: "DEMO",
    status: "READY",
  },
  {
    key: "COORDINATOR",
    email: "coordinator@j2k.com",
    roleCode: "PROJECT_MANAGER",
    titleTh: "ผู้ประสานงาน / โครงการ",
    titleEn: "Operations Coordinator",
    descriptionTh: "Operations, Workforce Planning, Sites, Map, Assignment",
    landingRoute: "/admin/dashboard",
    coreMenus: [
      "/admin/operations",
      "/admin/operations/map",
      "/admin/schedule",
      "/admin/sites",
    ],
    scopeType: "PROJECT",
    badge: "DEMO",
    status: "READY",
  },
  {
    key: "SUPERVISOR",
    email: "supervisor@j2k.com",
    roleCode: "SUPERVISOR",
    fallbackRoleCode: "SITE_MANAGER",
    titleTh: "หัวหน้าไซต์งาน (Supervisor)",
    titleEn: "Site Supervisor",
    descriptionTh: "Team, Attendance, Approval, Work Orders, Incident",
    landingRoute: "/operations",
    coreMenus: [
      "/operations",
      "/admin/attendance",
      "/admin/operations/work-orders",
      "/admin/incidents",
    ],
    scopeType: "SITE",
    badge: "DEMO",
    status: "READY",
  },
  {
    key: "EMPLOYEE",
    email: "employee@j2k.com",
    roleCode: "EMPLOYEE",
    titleTh: "พนักงานทั่วไป (Employee)",
    titleEn: "Standard Employee",
    descriptionTh: "My Dashboard, Check-in, Leave, Expense, Profile",
    landingRoute: "/check-in",
    coreMenus: [
      "/check-in",
      "/history",
      "/leave",
      "/payslip",
      "/expenses",
      "/chat",
    ],
    scopeType: "OWN",
    badge: "DEMO",
    status: "READY",
  },
];

export function getDemoAccountByEmail(email: string): DemoAccountConfig | undefined {
  const normalized = email.toLowerCase().trim();
  return DEMO_ACCOUNTS_CONFIG.find(
    (account) =>
      account.email.toLowerCase() === normalized ||
      account.alternateEmails?.some((alt) => alt.toLowerCase() === normalized)
  );
}
