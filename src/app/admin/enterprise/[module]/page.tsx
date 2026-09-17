import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Metric = { label: string; value: number };
async function moduleData(module: string): Promise<{ title: string; description: string; metrics: Metric[] } | null> {
  switch (module) {
    case "projects": return { title: "Projects", description: "โครงการ สัญญา ใบงาน และต้นทุนจริง", metrics: [
      { label: "โครงการ", value: await prisma.project.count() }, { label: "ใบงาน", value: await prisma.workOrder.count() }, { label: "Milestones", value: await prisma.projectMilestone.count() }, { label: "สัญญา", value: await prisma.contract.count() }] };
    case "crm": return { title: "CRM & Sales", description: "ลูกค้า โอกาสทางการขาย Tender และใบเสนอราคา", metrics: [
      { label: "ลูกค้า", value: await prisma.client.count() }, { label: "Opportunities", value: await prisma.opportunity.count() }, { label: "Tenders", value: await prisma.tender.count() }, { label: "ใบเสนอราคา", value: await prisma.quotation.count() }] };
    case "fleet": return { title: "Fleet", description: "รถ เที่ยวเดินทาง เชื้อเพลิง และการซ่อมบำรุง", metrics: [
      { label: "รถ", value: await prisma.vehicle.count() }, { label: "เที่ยวเดินทาง", value: await prisma.trip.count() }, { label: "ซ่อมบำรุง", value: await prisma.vehicleMaintenance.count() }, { label: "บันทึกเชื้อเพลิง", value: await prisma.fuelRecord.count() }] };
    case "procurement": return { title: "Procurement", description: "PR, RFQ, PO และรับสินค้า", metrics: [
      { label: "Suppliers", value: await prisma.supplier.count() }, { label: "PR", value: await prisma.purchaseRequisition.count() }, { label: "RFQ", value: await prisma.rFQ.count() }, { label: "PO", value: await prisma.purchaseOrder.count() }] };
    case "inventory": return { title: "Inventory & Assets", description: "สินค้า การเคลื่อนไหว และทรัพย์สิน", metrics: [
      { label: "รายการสินค้า", value: await prisma.inventoryItem.count() }, { label: "Stock Movements", value: await prisma.stockMovement.count() }, { label: "Assets", value: await prisma.asset.count() }, { label: "Asset Assignments", value: await prisma.assetAssignment.count() }] };
    case "qhse": return { title: "QHSE", description: "อุบัติการณ์ การตรวจ CAPA และความเสี่ยง", metrics: [
      { label: "Incidents", value: await prisma.incident.count() }, { label: "Findings", value: await prisma.qHSEFinding.count() }, { label: "CAPA", value: await prisma.cAPA.count() }, { label: "Risks", value: await prisma.risk.count() }] };
    case "finance": return { title: "Finance", description: "Invoice, AP/AR, Payment และ Budget", metrics: [
      { label: "Invoices", value: await prisma.invoice.count() }, { label: "Supplier Invoices", value: await prisma.supplierInvoice.count() }, { label: "Payments", value: await prisma.payment.count() }, { label: "Budgets", value: await prisma.budget.count() }] };
    case "analytics": return { title: "Analytics", description: "ข้อมูลปฏิบัติการที่พร้อมวิเคราะห์จากฐานข้อมูล", metrics: [
      { label: "พนักงาน", value: await prisma.employee.count() }, { label: "การลงเวลา", value: await prisma.attendance.count() }, { label: "โครงการ", value: await prisma.project.count() }, { label: "Invoices", value: await prisma.invoice.count() }] };
    case "automation": return { title: "Automation", description: "Approval, Event Outbox และ Notification", metrics: [
      { label: "Approvals", value: await prisma.workflowApproval.count() }, { label: "Events", value: await prisma.eventOutbox.count() }, { label: "Notifications", value: await prisma.notification.count() }, { label: "Alerts", value: await prisma.systemAlert.count() }] };
    case "ai": return { title: "AI Governance", description: "ข้อเสนอ AI ที่ต้องตรวจสอบและอนุมัติ", metrics: [{ label: "AI Proposals", value: await prisma.aIActionProposal.count() }, { label: "Audit Logs", value: await prisma.auditLog.count() }] };
    case "security": return { title: "Security", description: "ผู้ใช้ API Keys และ Audit Trail", metrics: [{ label: "Users", value: await prisma.user.count() }, { label: "API Keys", value: await prisma.apiKey.count() }, { label: "Audit Logs", value: await prisma.auditLog.count() }] };
    case "platform": return { title: "Platform", description: "สถานะฐานข้อมูล งานค้าง และเหตุการณ์ระบบ", metrics: [{ label: "Outbox", value: await prisma.eventOutbox.count() }, { label: "System Alerts", value: await prisma.systemAlert.count() }, { label: "Documents", value: await prisma.document.count() }] };
    default: return null;
  }
}

export default async function EnterpriseModulePage({ params }: { params: { module: string } }) {
  const data = await moduleData(params.module); if (!data) notFound();
  return <div className="space-y-6"><header className="rounded-3xl bg-gradient-to-r from-slate-900 to-brand-900 p-6 text-white"><p className="text-xs font-bold uppercase tracking-widest text-brand-300">SmartJeff Enterprise</p><h1 className="mt-1 text-3xl font-black">{data.title}</h1><p className="mt-2 text-slate-300">{data.description}</p></header><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{data.metrics.map((metric) => <div key={metric.label} className="rounded-2xl border border-surface-border bg-surface-card p-5"><div className="text-sm text-content-muted">{metric.label}</div><div className="mt-2 text-3xl font-black">{metric.value.toLocaleString("th-TH")}</div><div className="mt-2 text-xs text-emerald-600">ข้อมูลปัจจุบันจาก MySQL</div></div>)}</div></div>;
}
