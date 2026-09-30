export interface CrudCoverageEntry {
  modelName: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  rbac: boolean;
  audit: boolean;
  status: "FULL_CRUD" | "READ_ONLY" | "PARTIAL" | "NOT_APPLICABLE";
}

export const CRUD_MATRIX: CrudCoverageEntry[] = [
  { modelName: "User", create: true, read: true, update: true, delete: true, rbac: true, audit: true, status: "FULL_CRUD" },
  { modelName: "Role", create: true, read: true, update: true, delete: true, rbac: true, audit: true, status: "FULL_CRUD" },
  { modelName: "UserRoleAssignment", create: true, read: true, update: true, delete: true, rbac: true, audit: true, status: "FULL_CRUD" },
  { modelName: "Employee", create: true, read: true, update: true, delete: true, rbac: true, audit: true, status: "FULL_CRUD" },
  { modelName: "Attendance", create: true, read: true, update: true, delete: false, rbac: true, audit: true, status: "PARTIAL" },
  { modelName: "Leave", create: true, read: true, update: true, delete: false, rbac: true, audit: true, status: "PARTIAL" },
  { modelName: "PayrollRun", create: true, read: true, update: true, delete: false, rbac: true, audit: true, status: "PARTIAL" },
  { modelName: "Payslip", create: true, read: true, update: true, delete: false, rbac: true, audit: true, status: "PARTIAL" },
  { modelName: "Site", create: true, read: true, update: true, delete: true, rbac: true, audit: true, status: "FULL_CRUD" },
  { modelName: "Project", create: true, read: true, update: true, delete: true, rbac: true, audit: true, status: "FULL_CRUD" },
  { modelName: "Client", create: true, read: true, update: true, delete: true, rbac: true, audit: true, status: "FULL_CRUD" },
  { modelName: "ShiftTemplate", create: true, read: true, update: true, delete: true, rbac: true, audit: true, status: "FULL_CRUD" },
  { modelName: "AuditLog", create: false, read: true, update: false, delete: false, rbac: true, audit: true, status: "READ_ONLY" },
];

function main() {
  console.log("\n==================================================");
  console.log("SMARTOP CRUD COVERAGE MATRIX AUDIT");
  console.log("==================================================");
  console.table(CRUD_MATRIX);
}

if (require.main === module) {
  main();
}
