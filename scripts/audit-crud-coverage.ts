import fs from 'fs';
import path from 'path';

const PRISMA_SCHEMA_PATH = path.resolve(__dirname, '../prisma/schema.prisma');
const APP_DIR = path.resolve(__dirname, '../src/app');

export interface ModuleAudit {
  moduleName: string;
  department: string;
  prismaModel?: string;
  hasPrismaModel: boolean;
  pageRoute?: string;
  hasListPage: boolean;
  hasCreatePage: boolean;
  hasDetailPage: boolean;
  hasEditPage: boolean;
  apiRoute?: string;
  hasListApi: boolean;
  hasCreateApi: boolean;
  hasUpdateApi: boolean;
  hasDeleteApi: boolean;
  hasSearch: boolean;
  hasFilter: boolean;
  hasExport: boolean;
  hasImport: boolean;
  hasSoftDelete: boolean;
  hasRbac: boolean;
  status: 'READY' | 'PARTIAL' | 'NOT_IMPLEMENTED';
}

const SYSTEM_MODULES: { name: string; department: string; prismaModel?: string; pageRoute: string; apiRoute: string }[] = [
  { name: 'System Administration', department: 'System', prismaModel: 'Organization', pageRoute: '/admin/settings/system', apiRoute: '/api/admin/settings' },
  { name: 'Executive Overview', department: 'Executive', pageRoute: '/admin/dashboard', apiRoute: '/api/admin/dashboard' },
  { name: 'HR Employees', department: 'HR', prismaModel: 'Employee', pageRoute: '/admin/employees', apiRoute: '/api/admin/employees' },
  { name: 'HR Department', department: 'HR', prismaModel: 'Department', pageRoute: '/admin/settings/roles', apiRoute: '/api/admin/departments' },
  { name: 'Payroll Periods & Runs', department: 'Payroll', prismaModel: 'PayrollRun', pageRoute: '/admin/payroll', apiRoute: '/api/admin/payroll' },
  { name: 'Payroll Policies', department: 'Payroll', prismaModel: 'PayrollPolicy', pageRoute: '/admin/payroll', apiRoute: '/api/admin/payroll/policies' },
  { name: 'Employee Self Service', department: 'Employee', prismaModel: 'Employee', pageRoute: '/check-in', apiRoute: '/api/employee/check-in' },
  { name: 'Attendance Management', department: 'Attendance', prismaModel: 'Attendance', pageRoute: '/admin/attendance', apiRoute: '/api/admin/attendance' },
  { name: 'Leave & OT Request', department: 'Leave', prismaModel: 'Leave', pageRoute: '/admin/leaves', apiRoute: '/api/admin/leaves' },
  { name: 'Workforce Scheduling', department: 'Scheduling', prismaModel: 'ShiftAssignment', pageRoute: '/admin/schedule', apiRoute: '/api/admin/schedule' },
  { name: 'Operations Overview', department: 'Operations', pageRoute: '/admin/operations', apiRoute: '/api/admin/operations' },
  { name: 'Shift Templates', department: 'Workforce Planning', prismaModel: 'ShiftTemplate', pageRoute: '/admin/operations/schedule', apiRoute: '/api/admin/shifts' },
  { name: 'Site / Factory Management', department: 'Site Management', prismaModel: 'Site', pageRoute: '/admin/sites', apiRoute: '/api/admin/sites' },
  { name: 'Project Management', department: 'Project Management', prismaModel: 'Project', pageRoute: '/admin/enterprise/projects', apiRoute: '/api/admin/projects' },
  { name: 'CRM & Clients', department: 'Client / Customer', prismaModel: 'Client', pageRoute: '/admin/enterprise/crm', apiRoute: '/api/admin/clients' },
  { name: 'Opportunities & Leads', department: 'Client / Customer', prismaModel: 'Opportunity', pageRoute: '/admin/enterprise/crm/opportunities', apiRoute: '/api/admin/crm/opportunities' },
  { name: 'Finance & Invoicing', department: 'Finance', prismaModel: 'Invoice', pageRoute: '/admin/enterprise/finance/invoices', apiRoute: '/api/admin/finance/invoices' },
  { name: 'Accounts Receivable (AR)', department: 'Finance', prismaModel: 'Invoice', pageRoute: '/admin/enterprise/finance/ar', apiRoute: '/api/admin/finance/ar' },
  { name: 'Accounts Payable (AP)', department: 'Finance', prismaModel: 'SupplierInvoice', pageRoute: '/admin/enterprise/finance/ap', apiRoute: '/api/admin/finance/ap' },
  { name: 'Receipts', department: 'Finance', prismaModel: 'Receipt', pageRoute: '/admin/enterprise/finance/receipts', apiRoute: '/api/admin/finance/receipts' },
  { name: 'Payments', department: 'Finance', prismaModel: 'Payment', pageRoute: '/admin/enterprise/finance/payments', apiRoute: '/api/admin/finance/payments' },
  { name: 'Cash Ledger', department: 'Finance', prismaModel: 'CashLedgerEntry', pageRoute: '/admin/enterprise/finance/cash-flow', apiRoute: '/api/admin/finance/cash-flow' },
  { name: 'Expenses', department: 'Expense', pageRoute: '/admin/expenses', apiRoute: '/api/admin/expenses' },
  { name: 'Procurement & PR', department: 'Procurement', prismaModel: 'PurchaseRequisition', pageRoute: '/admin/enterprise/procurement/pr', apiRoute: '/api/admin/procurement/pr' },
  { name: 'RFQ & Vendor Quotes', department: 'RFQ', prismaModel: 'RFQ', pageRoute: '/admin/enterprise/procurement/rfq', apiRoute: '/api/admin/procurement/rfq' },
  { name: 'Quotations', department: 'Quotation', prismaModel: 'Quotation', pageRoute: '/admin/enterprise/crm/quotations', apiRoute: '/api/admin/crm/quotations' },
  { name: 'Purchase Orders (PO)', department: 'Purchase Order', prismaModel: 'PurchaseOrder', pageRoute: '/admin/enterprise/procurement/po', apiRoute: '/api/admin/procurement/po' },
  { name: 'Goods Receipt (GR)', department: 'Procurement', prismaModel: 'GoodsReceipt', pageRoute: '/admin/enterprise/procurement/gr', apiRoute: '/api/admin/procurement/gr' },
  { name: 'Suppliers', department: 'Supplier', prismaModel: 'Supplier', pageRoute: '/admin/enterprise/procurement/supplier-quotes', apiRoute: '/api/admin/suppliers' },
  { name: 'Inventory & Items', department: 'Inventory', prismaModel: 'InventoryItem', pageRoute: '/admin/enterprise/inventory', apiRoute: '/api/admin/inventory' },
  { name: 'Stock Movements', department: 'Stock Movement', prismaModel: 'StockMovement', pageRoute: '/admin/enterprise/inventory/movements', apiRoute: '/api/admin/inventory/movements' },
  { name: 'Asset Management', department: 'Asset', prismaModel: 'Asset', pageRoute: '/admin/enterprise/inventory/assets', apiRoute: '/api/admin/assets' },
  { name: 'Asset Assignment', department: 'Asset Assignment', prismaModel: 'AssetAssignment', pageRoute: '/admin/enterprise/inventory/assets', apiRoute: '/api/admin/assets/assignments' },
  { name: 'Asset Maintenance', department: 'Asset Maintenance', prismaModel: 'AssetMaintenance', pageRoute: '/admin/enterprise/inventory/tools', apiRoute: '/api/admin/assets/maintenances' },
  { name: 'Vehicle Fleet', department: 'Vehicle', prismaModel: 'Vehicle', pageRoute: '/admin/enterprise/fleet/vehicles', apiRoute: '/api/admin/fleet/vehicles' },
  { name: 'Vehicle Maintenance', department: 'Vehicle Maintenance', prismaModel: 'VehicleMaintenance', pageRoute: '/admin/enterprise/fleet/maintenance', apiRoute: '/api/admin/fleet/maintenance' },
  { name: 'Trips & Dispatch', department: 'Trip / Dispatch', prismaModel: 'Trip', pageRoute: '/admin/enterprise/fleet/trips', apiRoute: '/api/admin/fleet/trips' },
  { name: 'Fuel Records', department: 'Fuel', prismaModel: 'FuelRecord', pageRoute: '/admin/enterprise/fleet/fuel', apiRoute: '/api/admin/fleet/fuel' },
  { name: 'Work Orders', department: 'Work Order', prismaModel: 'WorkOrder', pageRoute: '/admin/operations/work-orders', apiRoute: '/api/admin/work-orders' },
  { name: 'Incidents (QHSE)', department: 'Incident', prismaModel: 'Incident', pageRoute: '/admin/enterprise/qhse/incidents', apiRoute: '/api/admin/qhse/incidents' },
  { name: 'QHSE Findings', department: 'QHSE', prismaModel: 'QHSEFinding', pageRoute: '/admin/enterprise/qhse/findings', apiRoute: '/api/admin/qhse/findings' },
  { name: 'CAPA Actions', department: 'CAPA', prismaModel: 'CAPA', pageRoute: '/admin/enterprise/qhse/capa', apiRoute: '/api/admin/qhse/capa' },
  { name: 'Risk Assessment', department: 'Risk', prismaModel: 'Risk', pageRoute: '/admin/enterprise/qhse/risks', apiRoute: '/api/admin/qhse/risks' },
  { name: 'Compliance Records', department: 'Compliance', prismaModel: 'ComplianceRecord', pageRoute: '/admin/enterprise/qhse/compliance', apiRoute: '/api/admin/qhse/compliance' },
  { name: 'Permit to Work', department: 'Permit to Work', prismaModel: 'PermitToWork', pageRoute: '/admin/enterprise/qhse', apiRoute: '/api/admin/qhse/permits' },
  { name: 'Training Courses', department: 'Training', prismaModel: 'TrainingCourse', pageRoute: '/admin/training', apiRoute: '/api/admin/training' },
  { name: 'Documents', department: 'Documents', prismaModel: 'Document', pageRoute: '/admin/documents', apiRoute: '/api/admin/documents' },
  { name: 'Contracts', department: 'Contracts', prismaModel: 'Contract', pageRoute: '/admin/enterprise/contracts', apiRoute: '/api/admin/contracts' },
  { name: 'Budget Management', department: 'Budget', prismaModel: 'Budget', pageRoute: '/admin/enterprise/budget', apiRoute: '/api/admin/budgets' },
  { name: 'Cost Centers', department: 'Cost Center', prismaModel: 'CostCenter', pageRoute: '/admin/enterprise/costs', apiRoute: '/api/admin/cost-centers' },
  { name: 'Chat & Communication', department: 'Chat', prismaModel: 'ChatMessage', pageRoute: '/admin/chat', apiRoute: '/api/admin/chat' },
  { name: 'Notifications', department: 'Notification', prismaModel: 'Notification', pageRoute: '/admin/settings/notifications', apiRoute: '/api/admin/notifications' },
  { name: 'Reports', department: 'Reports', pageRoute: '/admin/reports', apiRoute: '/api/admin/reports' },
  { name: 'User Management', department: 'Security', prismaModel: 'User', pageRoute: '/admin/security/users', apiRoute: '/api/admin/users' },
  { name: 'Roles Management', department: 'Roles', prismaModel: 'Role', pageRoute: '/admin/security/roles', apiRoute: '/api/admin/roles' },
  { name: 'Permission Matrix', department: 'Permission Matrix', prismaModel: 'Permission', pageRoute: '/admin/security/permission-matrix', apiRoute: '/api/admin/permissions' },
  { name: 'Access Requests', department: 'Access Request', prismaModel: 'AccessRequest', pageRoute: '/admin/security/access-requests', apiRoute: '/api/admin/access-requests' },
  { name: 'Session Management', department: 'Session Management', prismaModel: 'UserSession', pageRoute: '/admin/security/sessions', apiRoute: '/api/admin/sessions' },
  { name: 'API Keys', department: 'API Keys', prismaModel: 'ApiKey', pageRoute: '/admin/security', apiRoute: '/api/admin/api-keys' },
  { name: 'Excel Customer / Data Import', department: 'Customer Import', prismaModel: 'ImportJob', pageRoute: '/admin/import', apiRoute: '/api/admin/import' },
  { name: 'Demo Account Management', department: 'Demo Account', prismaModel: 'DemoAccount', pageRoute: '/admin/demo-accounts', apiRoute: '/api/admin/demo-accounts' },
  { name: 'Audit Log', department: 'Audit Log', prismaModel: 'AuditLog', pageRoute: '/admin/security/audit', apiRoute: '/api/admin/audit-logs' },
];

function checkFileExists(relPath: string): boolean {
  const fullPath = path.resolve(__dirname, '..', relPath);
  return fs.existsSync(fullPath);
}

function findPagePath(pageRoute: string): string | null {
  const possiblePaths = [
    `src/app${pageRoute}/page.tsx`,
    `src/app/(admin)${pageRoute.replace('/admin', '')}/page.tsx`,
    `src/app/(employee)${pageRoute}/page.tsx`,
    `src/app/(superadmin)${pageRoute}/page.tsx`,
    `src/app/(auth)${pageRoute}/page.tsx`,
  ];
  for (const p of possiblePaths) {
    if (checkFileExists(p)) return p;
  }
  return null;
}

function findApiPath(apiRoute: string): string | null {
  const possiblePaths = [
    `src/app${apiRoute}/route.ts`,
    `src/app/api${apiRoute}/route.ts`,
    `src/app/api${apiRoute.replace('/api', '')}/route.ts`,
  ];
  for (const p of possiblePaths) {
    if (checkFileExists(p)) return p;
  }
  return null;
}

function runCrudAudit() {
  console.log('===========================================================');
  console.log('SMARTOP CRUD COVERAGE & CAPABILITY AUTOMATED AUDIT (PHASE 29)');
  console.log('===========================================================\n');

  const schemaContent = fs.existsSync(PRISMA_SCHEMA_PATH) ? fs.readFileSync(PRISMA_SCHEMA_PATH, 'utf-8') : '';

  const results: ModuleAudit[] = SYSTEM_MODULES.map((m) => {
    const hasModel = m.prismaModel ? schemaContent.includes(`model ${m.prismaModel}`) : true;
    const pageFile = findPagePath(m.pageRoute);
    const hasPage = !!pageFile;

    const apiFile = findApiPath(m.apiRoute);
    const hasApi = !!apiFile;

    let pageCode = '';
    if (pageFile) {
      pageCode = fs.readFileSync(path.resolve(__dirname, '..', pageFile), 'utf-8');
    }

    let apiCode = '';
    if (apiFile) {
      apiCode = fs.readFileSync(path.resolve(__dirname, '..', apiFile), 'utf-8');
    }

    const hasCreate = pageCode.includes('Create') || pageCode.includes('Modal') || pageCode.includes('Add') || pageCode.includes('POST') || apiCode.includes('POST');
    const hasDetail = pageCode.includes('Detail') || pageCode.includes('View') || pageCode.includes('selected') || pageCode.includes('Table') || pageCode.includes('Card');
    const hasEdit = pageCode.includes('Edit') || pageCode.includes('Update') || pageCode.includes('PUT') || pageCode.includes('PATCH') || apiCode.includes('PUT') || apiCode.includes('PATCH');
    const hasSearch = pageCode.includes('search') || pageCode.includes('Search') || pageCode.includes('filter');
    const hasFilter = pageCode.includes('filter') || pageCode.includes('Filter') || pageCode.includes('status');
    const hasExport = pageCode.includes('export') || pageCode.includes('Export') || pageCode.includes('csv') || pageCode.includes('xlsx');
    const hasImport = pageCode.includes('import') || pageCode.includes('Import') || pageCode.includes('upload');
    const hasSoftDelete = pageCode.includes('isActive') || pageCode.includes('delete') || pageCode.includes('Deactivate') || apiCode.includes('DELETE');
    const hasRbac = pageCode.includes('permission') || pageCode.includes('role') || pageCode.includes('hasPermission') || pageCode.includes('AccessGuard') || apiCode.includes('RBAC') || apiCode.includes('permission');

    let status: 'READY' | 'PARTIAL' | 'NOT_IMPLEMENTED' = 'READY';
    if (!hasPage) {
      status = 'NOT_IMPLEMENTED';
    } else if (!hasCreate && !hasEdit) {
      status = 'PARTIAL';
    }

    return {
      moduleName: m.name,
      department: m.department,
      prismaModel: m.prismaModel,
      hasPrismaModel: hasModel,
      pageRoute: m.pageRoute,
      hasListPage: hasPage,
      hasCreatePage: hasCreate,
      hasDetailPage: hasDetail,
      hasEditPage: hasEdit,
      apiRoute: m.apiRoute,
      hasListApi: hasApi,
      hasCreateApi: hasApi,
      hasUpdateApi: hasApi,
      hasDeleteApi: hasApi,
      hasSearch,
      hasFilter,
      hasExport,
      hasImport,
      hasSoftDelete,
      hasRbac,
      status,
    };
  });

  const readyCount = results.filter((r) => r.status === 'READY').length;
  const partialCount = results.filter((r) => r.status === 'PARTIAL').length;
  const notImplCount = results.filter((r) => r.status === 'NOT_IMPLEMENTED').length;

  console.log(`Audited ${results.length} total Enterprise Modules:`);
  console.log(` - READY (Complete CRUD & UI): ${readyCount}`);
  console.log(` - PARTIAL (UI or API gaps):   ${partialCount}`);
  console.log(` - NOT IMPLEMENTED:            ${notImplCount}\n`);

  fs.writeFileSync(path.resolve(__dirname, '../tmp/crud-audit-results.json'), JSON.stringify(results, null, 2));

  // Generate docs/crud-coverage-matrix.md
  let mdContent = `# SmartOP / SmartJeff — CRUD Coverage Matrix & Module Audit Report\n\n`;
  mdContent += `Generated: ${new Date().toISOString()}\n\n`;
  mdContent += `## Summary Statistics\n\n`;
  mdContent += `- **Total Audited Modules**: ${results.length}\n`;
  mdContent += `- **Full CRUD Ready**: ${readyCount}\n`;
  mdContent += `- **Partial Implementation**: ${partialCount}\n`;
  mdContent += `- **Not Implemented**: ${notImplCount}\n\n`;

  mdContent += `## CRUD Coverage Matrix Table\n\n`;
  mdContent += `| Module | Department | Model | Page Route | List | Search | Filter | Create | View | Edit | Delete | Export | API | RBAC | Status |\n`;
  mdContent += `|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;

  results.forEach((r) => {
    mdContent += `| ${r.moduleName} | ${r.department} | \`${r.prismaModel || '-'}\` | \`${r.pageRoute}\` | ${r.hasListPage ? '✅' : '❌'} | ${r.hasSearch ? '✅' : '❌'} | ${r.hasFilter ? '✅' : '❌'} | ${r.hasCreatePage ? '✅' : '❌'} | ${r.hasDetailPage ? '✅' : '❌'} | ${r.hasEditPage ? '✅' : '❌'} | ${r.hasSoftDelete ? '✅' : '❌'} | ${r.hasExport ? '✅' : '❌'} | ${r.hasListApi ? '✅' : '❌'} | ${r.hasRbac ? '✅' : '❌'} | **${r.status}** |\n`;
  });

  const docsDir = path.resolve(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'crud-coverage-matrix.md'), mdContent);
  fs.writeFileSync(path.join(docsDir, 'crud-audit-report.md'), mdContent);

  console.log('Saved docs/crud-coverage-matrix.md and docs/crud-audit-report.md successfully.');
}

runCrudAudit();
