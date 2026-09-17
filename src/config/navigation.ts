import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Bot,
  Boxes,
  BriefcaseBusiness,
  Building2,
  Calculator,
  Calendar,
  CalendarClock,
  Car,
  CheckCircle,
  CheckCircle2,
  CheckSquare,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Cpu,
  CreditCard,
  Database,
  DollarSign,
  Eye,
  FileCheck,
  FileCheck2,
  FileCode,
  FileSearch,
  FileText,
  FolderKanban,
  Fuel,
  Gauge,
  GitBranch,
  Hammer,
  HardDrive,
  HelpCircle,
  History,
  Key,
  Landmark,
  Laptop,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  ListOrdered,
  Lock,
  MapPin,
  MessageSquare,
  Navigation,
  PackageCheck,
  PackageMinus,
  PackageSearch,
  PieChart,
  Receipt,
  Search,
  Send,
  Server,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Siren,
  Sliders,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
  UserCheck,
  UserPlus,
  Users,
  Vault,
  Wallet,
  Warehouse,
  Workflow,
  Wrench,
  Zap,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  roles?: string[];
};

export type NavigationSection = {
  label: string;
  items: NavigationItem[];
};

const MANAGEMENT_ROLES = ["SUPERADMIN", "ADMIN", "HR", "FINANCE", "EXECUTIVE", "OPERATIONS", "SUPERVISOR"];
const HIGH_PRIVILEGE_ROLES = ["SUPERADMIN", "ADMIN", "FINANCE", "EXECUTIVE"];
const ADMIN_ONLY_ROLES = ["SUPERADMIN", "ADMIN"];

export const employeeNavigation: NavigationSection[] = [
  {
    label: "บริการสำหรับพนักงาน",
    items: [
      { label: "หน้าหลัก / ลงเวลา", href: "/check-in", icon: Clock, permission: "attendance.checkin" },
      { label: "ประวัติลงเวลา", href: "/history", icon: History, permission: "attendance.read.self" },
      { label: "การลา / OT", href: "/leave", icon: CalendarClock, permission: "leave.request" },
      { label: "งานและค่าใช้จ่าย", href: "/expenses", icon: BriefcaseBusiness, permission: "employee.read" },
      { label: "สลิปเงินเดือน", href: "/payslip", icon: FileText, permission: "payroll.read.self" },
      { label: "แจ้งเหตุ / Safety", href: "/sos", icon: Siren, permission: "employee.read" },
      { label: "AI ผู้ช่วยอัจฉริยะ", href: "/chat", icon: Bot, permission: "employee.read" },
    ],
  },
];

export const enterpriseNavigation: NavigationSection[] = [
  {
    label: "ภาพรวมผู้บริหาร",
    items: [
      { label: "ศูนย์บัญชาการผู้บริหาร", href: "/admin/dashboard", icon: Gauge, roles: MANAGEMENT_ROLES },
      { label: "แผนที่ปฏิบัติการ", href: "/operations", icon: MapPin, roles: MANAGEMENT_ROLES },
      { label: "ตัวชี้วัดองค์กร", href: "/admin/enterprise/analytics", icon: BarChart3, roles: MANAGEMENT_ROLES },
      { label: "ความเสี่ยงสำคัญ", href: "/admin/enterprise/qhse/risks", icon: ShieldAlert, roles: MANAGEMENT_ROLES },
      { label: "รายงานสรุปผู้บริหาร", href: "/admin/enterprise/reports", icon: FileText, roles: MANAGEMENT_ROLES },
    ],
  },
  {
    label: "การปฏิบัติงาน",
    items: [
      { label: "แผนที่ปฏิบัติการ", href: "/operations", icon: MapPin, roles: MANAGEMENT_ROLES },
      { label: "สถานะไซต์งาน", href: "/admin/sites", icon: Building2, roles: MANAGEMENT_ROLES },
      { label: "วางแผนกำลังคน", href: "/operations/planning", icon: CalendarClock, roles: MANAGEMENT_ROLES },
      { label: "ตารางปฏิบัติงาน", href: "/operations/schedule", icon: Clock, roles: MANAGEMENT_ROLES },
      { label: "ใบสั่งงาน", href: "/operations/work-orders", icon: ClipboardList, roles: MANAGEMENT_ROLES },
      { label: "การลงเวลาปฏิบัติงาน", href: "/admin/attendance", icon: ClipboardCheck, roles: MANAGEMENT_ROLES },
      { label: "การแจ้งเตือน", href: "/alerts", icon: Siren, roles: MANAGEMENT_ROLES },
    ],
  },
  {
    label: "พนักงานและกำลังคน",
    items: [
      { label: "ข้อมูลพนักงาน", href: "/admin/employees", icon: Users, roles: MANAGEMENT_ROLES },
      { label: "ทักษะและคุณสมบัติ", href: "/admin/employees/skills", icon: Award, roles: MANAGEMENT_ROLES },
      { label: "ตารางงาน", href: "/admin/employees/shifts", icon: Calendar, roles: MANAGEMENT_ROLES },
      { label: "การลา", href: "/leave", icon: CalendarClock, roles: MANAGEMENT_ROLES },
      { label: "OT", href: "/admin/payroll/ot", icon: Clock, roles: ["SUPERADMIN", "ADMIN", "HR", "OPERATIONS", "SUPERVISOR"] },
      { label: "เงินเดือน", href: "/admin/payroll", icon: CircleDollarSign, roles: ["SUPERADMIN", "ADMIN", "HR", "FINANCE"] },
      { label: "เอกสารพนักงาน", href: "/admin/employees/documents", icon: FileText, roles: MANAGEMENT_ROLES },
    ],
  },
  {
    label: "โครงการและสัญญา",
    items: [
      { label: "โครงการ", href: "/admin/enterprise/projects", icon: FolderKanban, roles: MANAGEMENT_ROLES },
      { label: "ไซต์งาน", href: "/admin/sites", icon: Building2, roles: MANAGEMENT_ROLES },
      { label: "สัญญา", href: "/admin/enterprise/contracts", icon: FileCheck, roles: HIGH_PRIVILEGE_ROLES },
      { label: "งบประมาณ", href: "/admin/enterprise/budget", icon: Calculator, roles: HIGH_PRIVILEGE_ROLES },
      { label: "ต้นทุน", href: "/admin/enterprise/costs", icon: DollarSign, roles: HIGH_PRIVILEGE_ROLES },
      { label: "รายได้", href: "/admin/enterprise/revenue", icon: TrendingUp, roles: HIGH_PRIVILEGE_ROLES },
      { label: "กำไรโครงการ", href: "/admin/enterprise/profitability", icon: PieChart, roles: HIGH_PRIVILEGE_ROLES },
    ],
  },
  {
    label: "ลูกค้าและงานขาย",
    items: [
      { label: "ลูกค้า", href: "/admin/enterprise/crm", icon: BriefcaseBusiness, roles: MANAGEMENT_ROLES },
      { label: "Lead", href: "/admin/enterprise/crm/leads", icon: UserPlus, roles: MANAGEMENT_ROLES },
      { label: "Opportunity", href: "/admin/enterprise/crm/opportunities", icon: Target, roles: MANAGEMENT_ROLES },
      { label: "Tender", href: "/admin/enterprise/crm/tenders", icon: FileText, roles: MANAGEMENT_ROLES },
      { label: "ประมาณราคา", href: "/admin/enterprise/crm/estimates", icon: Calculator, roles: MANAGEMENT_ROLES },
      { label: "ใบเสนอราคา", href: "/admin/enterprise/crm/quotations", icon: FileCode, roles: MANAGEMENT_ROLES },
      { label: "Pipeline", href: "/admin/enterprise/crm/pipeline", icon: Layers, roles: MANAGEMENT_ROLES },
    ],
  },
  {
    label: "ยานพาหนะและการเดินทาง",
    items: [
      { label: "ภาพรวมรถ", href: "/admin/enterprise/fleet", icon: Car, roles: MANAGEMENT_ROLES },
      { label: "รถทั้งหมด", href: "/admin/enterprise/fleet/vehicles", icon: Truck, roles: MANAGEMENT_ROLES },
      { label: "คนขับ", href: "/admin/enterprise/fleet/drivers", icon: UserCheck, roles: MANAGEMENT_ROLES },
      { label: "เที่ยวรถ", href: "/admin/enterprise/fleet/trips", icon: Navigation, roles: MANAGEMENT_ROLES },
      { label: "Dispatch", href: "/admin/enterprise/fleet/dispatch", icon: Send, roles: MANAGEMENT_ROLES },
      { label: "น้ำมัน", href: "/admin/enterprise/fleet/fuel", icon: Fuel, roles: MANAGEMENT_ROLES },
      { label: "การบำรุงรักษา", href: "/admin/enterprise/fleet/maintenance", icon: Wrench, roles: MANAGEMENT_ROLES },
    ],
  },
  {
    label: "จัดซื้อ",
    items: [
      { label: "ความต้องการวัสดุ", href: "/admin/enterprise/procurement/materials", icon: ShoppingBag, roles: MANAGEMENT_ROLES },
      { label: "ใบขอซื้อ", href: "/admin/enterprise/procurement/pr", icon: FileText, roles: MANAGEMENT_ROLES },
      { label: "RFQ", href: "/admin/enterprise/procurement/rfq", icon: HelpCircle, roles: MANAGEMENT_ROLES },
      { label: "ใบเสนอราคาผู้ขาย", href: "/admin/enterprise/procurement/supplier-quotes", icon: FileSearch, roles: MANAGEMENT_ROLES },
      { label: "ใบสั่งซื้อ", href: "/admin/enterprise/procurement/po", icon: ShoppingCart, roles: MANAGEMENT_ROLES },
      { label: "รับสินค้า", href: "/admin/enterprise/procurement/gr", icon: PackageCheck, roles: MANAGEMENT_ROLES },
    ],
  },
  {
    label: "คลังสินค้าและทรัพย์สิน",
    items: [
      { label: "คลังสินค้า", href: "/admin/enterprise/inventory/warehouses", icon: Warehouse, roles: MANAGEMENT_ROLES },
      { label: "สินค้าคงคลัง", href: "/admin/enterprise/inventory", icon: Boxes, roles: MANAGEMENT_ROLES },
      { label: "การเคลื่อนไหวสต็อก", href: "/admin/enterprise/inventory/movements", icon: ArrowLeftRight, roles: MANAGEMENT_ROLES },
      { label: "เบิก-คืน", href: "/admin/enterprise/inventory/requisitions", icon: PackageMinus, roles: MANAGEMENT_ROLES },
      { label: "ทรัพย์สิน", href: "/admin/enterprise/inventory/assets", icon: HardDrive, roles: MANAGEMENT_ROLES },
      { label: "เครื่องมือ", href: "/admin/enterprise/inventory/tools", icon: Hammer, roles: MANAGEMENT_ROLES },
    ],
  },
  {
    label: "คุณภาพ ความปลอดภัย และความเสี่ยง",
    items: [
      { label: "อุบัติการณ์", href: "/admin/enterprise/qhse/incidents", icon: AlertTriangle, roles: MANAGEMENT_ROLES },
      { label: "Near Miss", href: "/admin/enterprise/qhse/near-miss", icon: Eye, roles: MANAGEMENT_ROLES },
      { label: "การตรวจประเมิน", href: "/admin/enterprise/qhse/audits", icon: CheckSquare, roles: MANAGEMENT_ROLES },
      { label: "Finding / NCR", href: "/admin/enterprise/qhse/findings", icon: Search, roles: MANAGEMENT_ROLES },
      { label: "RCA", href: "/admin/enterprise/qhse/rca", icon: Activity, roles: MANAGEMENT_ROLES },
      { label: "CAPA", href: "/admin/enterprise/qhse/capa", icon: ShieldCheck, roles: MANAGEMENT_ROLES },
      { label: "Risk Register", href: "/admin/enterprise/qhse/risks", icon: ShieldAlert, roles: MANAGEMENT_ROLES },
      { label: "Compliance", href: "/admin/enterprise/qhse/compliance", icon: FileCheck2, roles: MANAGEMENT_ROLES },
    ],
  },
  {
    label: "การเงิน",
    items: [
      { label: "ภาพรวมการเงิน", href: "/admin/enterprise/finance", icon: Landmark, roles: ["SUPERADMIN", "ADMIN", "FINANCE", "EXECUTIVE"] },
      { label: "ใบแจ้งหนี้", href: "/admin/enterprise/finance/invoices", icon: Receipt, roles: ["SUPERADMIN", "ADMIN", "FINANCE", "EXECUTIVE"] },
      { label: "ลูกหนี้", href: "/admin/enterprise/finance/ar", icon: ArrowDownRight, roles: ["SUPERADMIN", "ADMIN", "FINANCE", "EXECUTIVE"] },
      { label: "เจ้าหนี้", href: "/admin/enterprise/finance/ap", icon: ArrowUpRight, roles: ["SUPERADMIN", "ADMIN", "FINANCE", "EXECUTIVE"] },
      { label: "การรับเงิน", href: "/admin/enterprise/finance/receipts", icon: Wallet, roles: ["SUPERADMIN", "ADMIN", "FINANCE", "EXECUTIVE"] },
      { label: "การจ่ายเงิน", href: "/admin/enterprise/finance/payments", icon: CreditCard, roles: ["SUPERADMIN", "ADMIN", "FINANCE", "EXECUTIVE"] },
      { label: "กระทบยอดธนาคาร", href: "/admin/enterprise/finance/reconciliation", icon: CheckCircle2, roles: ["SUPERADMIN", "ADMIN", "FINANCE", "EXECUTIVE"] },
      { label: "กระแสเงินสด", href: "/admin/enterprise/finance/cashflow", icon: LineChart, roles: ["SUPERADMIN", "ADMIN", "FINANCE", "EXECUTIVE"] },
      { label: "งบประมาณ", href: "/admin/enterprise/finance/budget", icon: Calculator, roles: ["SUPERADMIN", "ADMIN", "FINANCE", "EXECUTIVE"] },
      { label: "Treasury", href: "/admin/enterprise/finance/treasury", icon: Vault, roles: ["SUPERADMIN", "ADMIN", "FINANCE", "EXECUTIVE"] },
    ],
  },
  {
    label: "วิเคราะห์ข้อมูล",
    items: [
      { label: "BI ผู้บริหาร", href: "/admin/enterprise/analytics", icon: BarChart3, roles: MANAGEMENT_ROLES },
      { label: "Dashboard", href: "/admin/enterprise/analytics/dashboard", icon: LayoutDashboard, roles: MANAGEMENT_ROLES },
      { label: "KPI", href: "/admin/enterprise/analytics/kpi", icon: Target, roles: MANAGEMENT_ROLES },
      { label: "แนวโน้ม", href: "/admin/enterprise/analytics/trends", icon: TrendingUp, roles: MANAGEMENT_ROLES },
      { label: "Forecast", href: "/admin/enterprise/analytics/forecast", icon: Sparkles, roles: MANAGEMENT_ROLES },
      { label: "Data Quality", href: "/admin/enterprise/analytics/data-quality", icon: Database, roles: MANAGEMENT_ROLES },
    ],
  },
  {
    label: "ระบบอัตโนมัติ",
    items: [
      { label: "Workflow", href: "/admin/enterprise/automation", icon: Workflow, roles: ADMIN_ONLY_ROLES },
      { label: "Rule Engine", href: "/admin/enterprise/automation/rules", icon: Cpu, roles: ADMIN_ONLY_ROLES },
      { label: "Event", href: "/admin/enterprise/automation/events", icon: Zap, roles: ADMIN_ONLY_ROLES },
      { label: "Queue", href: "/admin/enterprise/automation/queue", icon: ListOrdered, roles: ADMIN_ONLY_ROLES },
      { label: "Webhook", href: "/admin/enterprise/automation/webhooks", icon: Share2, roles: ADMIN_ONLY_ROLES },
      { label: "Dead Letter Queue", href: "/admin/enterprise/automation/dlq", icon: AlertCircle, roles: ADMIN_ONLY_ROLES },
    ],
  },
  {
    label: "AI ผู้ช่วยอัจฉริยะ",
    items: [
      { label: "SmartJeff Copilot", href: "/admin/enterprise/ai", icon: Bot, roles: MANAGEMENT_ROLES },
      { label: "งานที่ AI เตรียมให้", href: "/admin/enterprise/ai/proposals", icon: Sparkles, roles: MANAGEMENT_ROLES },
      { label: "Simulation", href: "/admin/enterprise/ai/simulation", icon: Sliders, roles: MANAGEMENT_ROLES },
      { label: "AI Action Proposal", href: "/admin/enterprise/ai/action-proposals", icon: CheckCircle, roles: MANAGEMENT_ROLES },
      { label: "AI Governance", href: "/admin/enterprise/ai/governance", icon: Shield, roles: ADMIN_ONLY_ROLES },
    ],
  },
  {
    label: "ความปลอดภัยระบบ",
    items: [
      { label: "ผู้ใช้งาน", href: "/admin/enterprise/security/users", icon: Users, roles: ADMIN_ONLY_ROLES },
      { label: "บทบาทและสิทธิ์", href: "/admin/enterprise/security/roles", icon: Key, roles: ADMIN_ONLY_ROLES },
      { label: "Session", href: "/admin/enterprise/security/sessions", icon: Smartphone, roles: ADMIN_ONLY_ROLES },
      { label: "อุปกรณ์", href: "/admin/enterprise/security/devices", icon: Laptop, roles: ADMIN_ONLY_ROLES },
      { label: "2FA", href: "/admin/enterprise/security/mfa", icon: Lock, roles: ADMIN_ONLY_ROLES },
      { label: "Security Event", href: "/admin/enterprise/security/events", icon: ShieldAlert, roles: ADMIN_ONLY_ROLES },
      { label: "SOC", href: "/admin/enterprise/security/soc", icon: Eye, roles: ADMIN_ONLY_ROLES },
    ],
  },
  {
    label: "สถานะระบบ",
    items: [
      { label: "สุขภาพระบบ", href: "/admin/enterprise/platform", icon: Activity, roles: ADMIN_ONLY_ROLES },
      { label: "Database", href: "/admin/enterprise/platform/db", icon: Database, roles: ADMIN_ONLY_ROLES },
      { label: "Redis", href: "/admin/enterprise/platform/redis", icon: Server, roles: ADMIN_ONLY_ROLES },
      { label: "Worker", href: "/admin/enterprise/platform/worker", icon: Cpu, roles: ADMIN_ONLY_ROLES },
      { label: "Queue", href: "/admin/enterprise/platform/queue", icon: Layers, roles: ADMIN_ONLY_ROLES },
      { label: "Backup", href: "/admin/enterprise/platform/backup", icon: HardDrive, roles: ADMIN_ONLY_ROLES },
      { label: "Disaster Recovery", href: "/admin/enterprise/platform/dr", icon: LifeBuoy, roles: ADMIN_ONLY_ROLES },
      { label: "Deployment", href: "/admin/enterprise/platform/deployment", icon: GitBranch, roles: ADMIN_ONLY_ROLES },
    ],
  },
  {
    label: "ตั้งค่าระบบ",
    items: [
      { label: "ตั้งค่าระบบ", href: "/settings/notifications", icon: Settings, roles: MANAGEMENT_ROLES },
    ],
  },
];

export function navigationForRole(role?: string): NavigationSection[] {
  if (!role || ["EMPLOYEE", "USER"].includes(role)) return employeeNavigation;
  return enterpriseNavigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);
}
