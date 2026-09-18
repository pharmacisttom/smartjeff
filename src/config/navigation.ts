import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  ShieldCheck,
  MessageSquare,
  History,
  CalendarOff,
  FileText,
  Briefcase,
  TrendingUp,
  Truck,
  ShoppingCart,
  Package,
  ShieldAlert,
  CreditCard,
  BarChart3,
  Cpu,
  Bot,
  Lock,
  Server,
  Settings,
  UserCog,
  Table,
  Layers,
  FileCheck,
  Wrench,
  Workflow,
  Sparkles,
  Shield,
  Activity,
} from "lucide-react";

export interface NavItem {
  id: string;
  labelTh: string;
  href: string;
  icon: any;
  permission?: string;
  scope?: string;
  badge?: string;
  children?: {
    id: string;
    labelTh: string;
    href: string;
    icon?: any;
    permission?: string;
  }[];
}

export interface NavGroup {
  id: string;
  titleTh: string;
  items: NavItem[];
}

export const NAVIGATION_REGISTRY: NavGroup[] = [
  {
    id: "employee-self-service",
    titleTh: "บริการตนเองของพนักงาน",
    items: [
      {
        id: "checkin",
        labelTh: "ลงเวลาปฏิบัติงาน",
        href: "/check-in",
        icon: Clock,
        permission: "attendance.submit",
      },
      {
        id: "history",
        labelTh: "ประวัติลงเวลา",
        href: "/history",
        icon: History,
        permission: "attendance.read",
      },
      {
        id: "leave-ot",
        labelTh: "ขอลา & ทำ OT",
        href: "/leave",
        icon: CalendarOff,
        permission: "leave.submit",
      },
      {
        id: "payslip",
        labelTh: "สลิปเงินเดือน",
        href: "/payslip",
        icon: FileText,
        permission: "attendance.read",
      },
      {
        id: "chat-copilot",
        labelTh: "AI ผู้ช่วย HR",
        href: "/chat",
        icon: MessageSquare,
        permission: "ai.read",
      },
    ],
  },
  {
    id: "executive-overview",
    titleTh: "ภาพรวมและการบริหาร",
    items: [
      {
        id: "admin-dashboard",
        labelTh: "ภาพรวมผู้บริหาร",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        permission: "dashboard.read",
      },
      {
        id: "analytics",
        labelTh: "วิเคราะห์ข้อมูล (Analytics)",
        href: "/admin/analytics",
        icon: BarChart3,
        permission: "analytics.read",
        children: [
          { id: "analytics-overview", labelTh: "ภาพรวมตัวชี้วัด", href: "/admin/analytics" },
          { id: "analytics-kpis", labelTh: "ดัชนีชี้วัด (KPIs)", href: "/admin/analytics/kpis" },
          { id: "analytics-dashboards", labelTh: "แดชบอร์ดฝ่ายบริหาร", href: "/admin/analytics/dashboards" },
          { id: "analytics-quality", labelTh: "คุณภาพข้อมูล (Data Quality)", href: "/admin/analytics/data-quality" },
          { id: "analytics-catalog", labelTh: "คลังข้อมูล (Data Catalog)", href: "/admin/analytics/catalog" },
        ],
      },
      {
        id: "reports",
        labelTh: "รายงานสรุป",
        href: "/admin/reports",
        icon: FileText,
        permission: "analytics.read",
      },
    ],
  },
  {
    id: "workforce",
    titleTh: "พนักงานและกำลังคน",
    items: [
      {
        id: "employees",
        labelTh: "จัดการพนักงาน",
        href: "/admin/employees",
        icon: Users,
        permission: "employee.read",
      },
      {
        id: "attendance-mgmt",
        labelTh: "อนุมัติเวลาปฏิบัติงาน",
        href: "/admin/attendance",
        icon: Clock,
        permission: "attendance.approve",
      },
      {
        id: "payroll-mgmt",
        labelTh: "ระบบคำนวณเงินเดือน",
        href: "/admin/payroll",
        icon: ShieldCheck,
        permission: "payroll.read",
      },
      {
        id: "hr-chat",
        labelTh: "HR Admin Chat",
        href: "/admin/chat",
        icon: MessageSquare,
        permission: "employee.read",
      },
    ],
  },
  {
    id: "operations-sites",
    titleTh: "การปฏิบัติงานและโครงการ",
    items: [
      {
        id: "sites",
        labelTh: "จัดการโรงงาน & นิคมฯ",
        href: "/admin/sites",
        icon: Building2,
        permission: "project.read",
      },
      {
        id: "operations",
        labelTh: "หน้างาน & กำลังคน",
        href: "/admin/operations",
        icon: Briefcase,
        permission: "project.read",
        children: [
          { id: "ops-overview", labelTh: "ภาพรวมการปฏิบัติงาน", href: "/admin/operations" },
          { id: "ops-schedule", labelTh: "ตารางกะปฏิบัติงาน", href: "/admin/operations/schedule" },
          { id: "ops-workorders", labelTh: "ใบสั่งงาน (Work Orders)", href: "/admin/operations/work-orders" },
        ],
      },
      {
        id: "projects",
        labelTh: "โครงการและสัญญา",
        href: "/admin/enterprise/projects",
        icon: Briefcase,
        permission: "project.read",
        children: [
          { id: "proj-overview", labelTh: "ภาพรวมโครงการ", href: "/admin/enterprise/projects" },
          { id: "proj-contracts", labelTh: "สัญญาจ้าง (Contracts)", href: "/admin/enterprise/contracts" },
          { id: "proj-budget", labelTh: "งบประมาณโครงการ", href: "/admin/enterprise/budget" },
          { id: "proj-costs", labelTh: "ต้นทุนโครงการ (Costs)", href: "/admin/enterprise/costs" },
          { id: "proj-revenue", labelTh: "รายรับโครงการ (Revenue)", href: "/admin/enterprise/revenue" },
          { id: "proj-profitability", labelTh: "กำไรสุทธิ (Profitability)", href: "/admin/enterprise/profitability" },
        ],
      },
      {
        id: "crm",
        labelTh: "ลูกค้าและงานขาย (CRM)",
        href: "/admin/enterprise/crm",
        icon: TrendingUp,
        permission: "crm.read",
        children: [
          { id: "crm-overview", labelTh: "ภาพรวมลูกค้า & CRM", href: "/admin/enterprise/crm" },
          { id: "crm-leads", labelTh: "ผู้มีแนวโน้ม (Leads)", href: "/admin/enterprise/crm/leads" },
          { id: "crm-opps", labelTh: "โอกาสทางธุรกิจ (Opportunities)", href: "/admin/enterprise/crm/opportunities" },
          { id: "crm-tenders", labelTh: "การประกวดราคา (Tenders)", href: "/admin/enterprise/crm/tenders" },
          { id: "crm-estimates", labelTh: "ประมาณการต้นทุน (Estimates)", href: "/admin/enterprise/crm/estimates" },
          { id: "crm-quotes", labelTh: "ใบเสนอราคา (Quotations)", href: "/admin/enterprise/crm/quotations" },
          { id: "crm-pipeline", labelTh: "ขั้นตอนการขาย (Pipeline)", href: "/admin/enterprise/crm/pipeline" },
        ],
      },
      {
        id: "fleet",
        labelTh: "ยานพาหนะและขนส่ง (Fleet)",
        href: "/admin/enterprise/fleet",
        icon: Truck,
        permission: "fleet.read",
        children: [
          { id: "fleet-overview", labelTh: "ภาพรวมยานพาหนะ", href: "/admin/enterprise/fleet" },
          { id: "fleet-vehicles", labelTh: "ทะเบียนรถ (Vehicles)", href: "/admin/enterprise/fleet/vehicles" },
          { id: "fleet-drivers", labelTh: "พนักงานขับรถ (Drivers)", href: "/admin/enterprise/fleet/drivers" },
          { id: "fleet-trips", labelTh: "บันทึกทริป (Trips)", href: "/admin/enterprise/fleet/trips" },
          { id: "fleet-dispatch", labelTh: "กระจายคิวรถ (Dispatch)", href: "/admin/enterprise/fleet/dispatch" },
          { id: "fleet-fuel", labelTh: "เชื้อเพลิง & พลังงาน (Fuel)", href: "/admin/enterprise/fleet/fuel" },
          { id: "fleet-maint", labelTh: "บำรุงรักษา (Maintenance)", href: "/admin/enterprise/fleet/maintenance" },
        ],
      },
      {
        id: "procurement",
        labelTh: "จัดซื้อและจัดหา (Procurement)",
        href: "/admin/enterprise/procurement",
        icon: ShoppingCart,
        permission: "procurement.read",
        children: [
          { id: "proc-overview", labelTh: "ภาพรวมจัดซื้อ", href: "/admin/enterprise/procurement" },
          { id: "proc-materials", labelTh: "วัสดุอุปกรณ์ (Materials)", href: "/admin/enterprise/procurement/materials" },
          { id: "proc-pr", labelTh: "ใบขอซื้อ (PR)", href: "/admin/enterprise/procurement/pr" },
          { id: "proc-rfq", labelTh: "ขอใบเสนอราคา (RFQ)", href: "/admin/enterprise/procurement/rfq" },
          { id: "proc-quotes", labelTh: "ราคาจากซัพพลายเออร์", href: "/admin/enterprise/procurement/supplier-quotes" },
          { id: "proc-po", labelTh: "ใบสั่งซื้อ (PO)", href: "/admin/enterprise/procurement/po" },
          { id: "proc-gr", labelTh: "ใบรับพัสดุ (GR)", href: "/admin/enterprise/procurement/gr" },
        ],
      },
      {
        id: "inventory",
        labelTh: "คลังสินค้าและพัสดุ",
        href: "/admin/enterprise/inventory",
        icon: Package,
        permission: "inventory.read",
        children: [
          { id: "inv-overview", labelTh: "ภาพรวมคลังสินค้า", href: "/admin/enterprise/inventory" },
          { id: "inv-warehouses", labelTh: "สถานที่จัดเก็บ (Warehouses)", href: "/admin/enterprise/inventory/warehouses" },
          { id: "inv-movements", labelTh: "การเคลื่อนย้ายสต็อก", href: "/admin/enterprise/inventory/movements" },
          { id: "inv-reqs", labelTh: "ใบเบิกวัสดุ (Requisitions)", href: "/admin/enterprise/inventory/requisitions" },
          { id: "inv-assets", labelTh: "ทะเบียนสินทรัพย์ (Assets)", href: "/admin/enterprise/inventory/assets" },
          { id: "inv-tools", labelTh: "เครื่องมือช่าง (Tools)", href: "/admin/enterprise/inventory/tools" },
        ],
      },
      {
        id: "qhse",
        labelTh: "ความปลอดภัย & อาชีวอนามัย (QHSE)",
        href: "/admin/enterprise/qhse",
        icon: ShieldAlert,
        permission: "qhse.read",
        children: [
          { id: "qhse-overview", labelTh: "ภาพรวมความปลอดภัย", href: "/admin/enterprise/qhse" },
          { id: "qhse-incidents", labelTh: "อุบัติการณ์ (Incidents)", href: "/admin/enterprise/qhse/incidents" },
          { id: "qhse-nearmiss", labelTh: "เกือบเกิดเหตุ (Near Miss)", href: "/admin/enterprise/qhse/near-miss" },
          { id: "qhse-audits", labelTh: "การตรวจสอบ (Audits)", href: "/admin/enterprise/qhse/audits" },
          { id: "qhse-findings", labelTh: "ข้อค้นพบ (Findings)", href: "/admin/enterprise/qhse/findings" },
          { id: "qhse-rca", labelTh: "วิเคราะห์สาเหตุ (RCA)", href: "/admin/enterprise/qhse/rca" },
          { id: "qhse-capa", labelTh: "มาตรการแก้ไข (CAPA)", href: "/admin/enterprise/qhse/capa" },
          { id: "qhse-risks", labelTh: "ประเมินความเสี่ยง (Risks)", href: "/admin/enterprise/qhse/risks" },
          { id: "qhse-compliance", labelTh: "ความสอดคล้อง (Compliance)", href: "/admin/enterprise/qhse/compliance" },
        ],
      },
      {
        id: "finance",
        labelTh: "การเงินและงบประมาณ",
        href: "/admin/enterprise/finance",
        icon: CreditCard,
        permission: "finance.read",
        children: [
          { id: "fin-overview", labelTh: "ภาพรวมการเงิน", href: "/admin/enterprise/finance" },
          { id: "fin-invoices", labelTh: "ใบแจ้งหนี้ (Invoices)", href: "/admin/enterprise/finance/invoices" },
          { id: "fin-ar", labelTh: "ลูกหนี้การค้า (AR)", href: "/admin/enterprise/finance/ar" },
          { id: "fin-ap", labelTh: "เจ้าหนี้การค้า (AP)", href: "/admin/enterprise/finance/ap" },
          { id: "fin-receipts", labelTh: "ใบเสร็จรับเงิน (Receipts)", href: "/admin/enterprise/finance/receipts" },
          { id: "fin-payments", labelTh: "ใบสำคัญจ่าย (Payments)", href: "/admin/enterprise/finance/payments" },
          { id: "fin-treasury", labelTh: "บริหารสภาพคล่อง (Treasury)", href: "/admin/enterprise/treasury" },
          { id: "fin-reconciliation", labelTh: "กระทบยอดบัญชี", href: "/admin/enterprise/finance/reconciliation" },
          { id: "fin-cashflow", labelTh: "กระแสเงินสด (Cash Flow)", href: "/admin/enterprise/finance/cash-flow" },
        ],
      },
    ],
  },
  {
    id: "intelligent-automation",
    titleTh: "ระบบอัตโนมัติและปัญญาประดิษฐ์",
    items: [
      {
        id: "automation",
        labelTh: "ระบบอัตโนมัติ (Automation)",
        href: "/admin/automation",
        icon: Workflow,
        permission: "platform.read",
        children: [
          { id: "auto-overview", labelTh: "ภาพรวมกระบวนการ", href: "/admin/automation" },
          { id: "auto-workflows", labelTh: "ผังกระบวนการ (Workflows)", href: "/admin/automation/workflows" },
          { id: "auto-rules", labelTh: "กฎอัตโนมัติ (Rules)", href: "/admin/automation/rules" },
          { id: "auto-events", labelTh: "เหตุการณ์ระบบ (Events)", href: "/admin/automation/events" },
          { id: "auto-queues", labelTh: "คิวงาน (Queues)", href: "/admin/automation/queues" },
          { id: "auto-deadletter", labelTh: "คิวข้อผิดพลาด (Dead Letter)", href: "/admin/automation/dead-letter" },
        ],
      },
      {
        id: "ai-copilot",
        labelTh: "ปัญญาประดิษฐ์ (AI Copilot)",
        href: "/admin/ai",
        icon: Sparkles,
        permission: "ai.read",
        children: [
          { id: "ai-overview", labelTh: "ศูนย์ควบคุม AI", href: "/admin/ai" },
          { id: "ai-copilot-view", labelTh: "AI Copilot Console", href: "/admin/ai/copilot" },
          { id: "ai-proposals", labelTh: "ข้อเสนอแนะ AI (Proposals)", href: "/admin/ai/proposals" },
          { id: "ai-actions", labelTh: "คำสั่งอัตโนมัติ (Actions)", href: "/admin/ai/actions" },
          { id: "ai-policies", labelTh: "นโยบายความปลอดภัย AI", href: "/admin/ai/policies" },
          { id: "ai-governance", labelTh: "การกำกับดูแล (Governance)", href: "/admin/ai/governance" },
        ],
      },
    ],
  },
  {
    id: "security-governance",
    titleTh: "ความปลอดภัยระบบและสิทธิ์",
    items: [
      {
        id: "security-core",
        labelTh: "ความปลอดภัย & สิทธิ์",
        href: "/admin/security",
        icon: Shield,
        permission: "security.role.manage",
        children: [
          { id: "sec-overview", labelTh: "ภาพรวมความปลอดภัย", href: "/admin/security" },
          { id: "sec-roles", labelTh: "จัดการบทบาท (Roles)", href: "/admin/security/roles" },
          { id: "sec-users", labelTh: "จัดการผู้ใช้งาน (Users)", href: "/admin/security/users" },
          { id: "sec-permissions", labelTh: "รายการสิทธิ์ (Permissions)", href: "/admin/security/permissions" },
          { id: "sec-matrix", labelTh: "ตารางสิทธิ์ (Permission Matrix)", href: "/admin/security/permission-matrix" },
          { id: "sec-sessions", labelTh: "การเข้าสู่ระบบ (Sessions)", href: "/admin/security/sessions" },
          { id: "sec-dept", labelTh: "สิทธิ์ระดับแผนก (Dept Access)", href: "/admin/security/department-access" },
          { id: "sec-approvals", labelTh: "สายอนุมัติ (Approval Matrix)", href: "/admin/security/approval-matrix" },
          { id: "sec-devices", labelTh: "อุปกรณ์ที่เชื่อถือ (Devices)", href: "/admin/security/devices" },
          { id: "sec-audit", labelTh: "ประวัติตรวจสอบ (Audit Trail)", href: "/admin/security/audit" },
          { id: "sec-review", labelTh: "ทบทวนสิทธิ์ (Access Review)", href: "/admin/security/access-review" },
        ],
      },
      {
        id: "platform-infra",
        labelTh: "โครงสร้างพื้นฐาน (Platform)",
        href: "/admin/platform",
        icon: Server,
        permission: "platform.read",
        children: [
          { id: "plat-overview", labelTh: "ภาพรวมเซิร์ฟเวอร์", href: "/admin/platform" },
          { id: "plat-health", labelTh: "สุขภาพระบบ (Health)", href: "/admin/platform/health" },
          { id: "plat-backups", labelTh: "การสำรองข้อมูล (Backups)", href: "/admin/platform/backups" },
          { id: "plat-workers", labelTh: "โปรเซสเบื้องหลัง (Workers)", href: "/admin/platform/workers" },
          { id: "plat-queues", labelTh: "คิวข้อความ (Queues)", href: "/admin/platform/queues" },
          { id: "plat-incidents", labelTh: "เหตุขัดข้อง (Incidents)", href: "/admin/platform/incidents" },
          { id: "plat-dr", labelTh: "กู้คืนระบบ (Disaster Recovery)", href: "/admin/platform/disaster-recovery" },
        ],
      },
      {
        id: "settings",
        labelTh: "ตั้งค่าระบบทั่วไป",
        href: "/admin/settings",
        icon: Settings,
        permission: "security.role.manage",
      },
    ],
  },
];
