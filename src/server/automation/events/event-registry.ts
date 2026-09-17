import { EventDomain } from "./event-envelope";

export interface EventDefinition {
  eventType: string;
  domain: EventDomain;
  version: number;
  nameTh: string;
  nameEn: string;
  description: string;
  samplePayload: Record<string, any>;
}

export const ENTERPRISE_EVENT_REGISTRY: Record<string, EventDefinition> = {
  // WORKFORCE & ATTENDANCE
  ATTENDANCE_CHECKED_IN: {
    eventType: "ATTENDANCE_CHECKED_IN",
    domain: "ATTENDANCE",
    version: 1,
    nameTh: "พนักงานลงชื่อเข้าปฏิบัติงาน",
    nameEn: "Employee Checked In",
    description: "Fires when an employee punches in at a site or mobile checkpoint",
    samplePayload: {
      attendanceId: "att_123",
      employeeId: "emp_456",
      employeeName: "สมชาย มั่นคง",
      siteId: "site_789",
      siteName: "โครงการศูนย์ราชการแจ้งวัฒนะ",
      timestamp: new Date().toISOString(),
      location: { lat: 13.882, lng: 100.565 },
      isGeofenceBreached: false,
    },
  },
  ATTENDANCE_CHECKED_OUT: {
    eventType: "ATTENDANCE_CHECKED_OUT",
    domain: "ATTENDANCE",
    version: 1,
    nameTh: "พนักงานลงชื่อออกปฏิบัติงาน",
    nameEn: "Employee Checked Out",
    description: "Fires when an employee punches out",
    samplePayload: {
      attendanceId: "att_123",
      employeeId: "emp_456",
      employeeName: "สมชาย มั่นคง",
      siteId: "site_789",
      durationHours: 8.5,
      isOvertime: true,
    },
  },
  WORKFORCE_GAP_DETECTED: {
    eventType: "WORKFORCE_GAP_DETECTED",
    domain: "WORKFORCE",
    version: 1,
    nameTh: "ตรวจพบกำลังพลขาดแคลนหน้างาน",
    nameEn: "Workforce Gap Detected",
    description: "Fires when checked-in headcount is below required quota for a shift",
    samplePayload: {
      siteId: "site_789",
      siteName: "โครงการศูนย์ราชการแจ้งวัฒนะ",
      shiftId: "shift_101",
      requiredStaff: 10,
      actualStaff: 6,
      deficit: 4,
      severity: "HIGH",
    },
  },

  // SCHEDULE & SHIFT
  SHIFT_PUBLISHED: {
    eventType: "SHIFT_PUBLISHED",
    domain: "SCHEDULE",
    version: 1,
    nameTh: "เผยแพร่ตารางกะการทำงาน",
    nameEn: "Shift Roster Published",
    description: "Fires when next week or month's shift schedule is confirmed and published",
    samplePayload: {
      rosterId: "rst_202",
      siteId: "site_789",
      startDate: "2026-09-20",
      endDate: "2026-09-27",
      totalShifts: 42,
    },
  },

  // PAYROLL
  PAYROLL_APPROVED: {
    eventType: "PAYROLL_APPROVED",
    domain: "PAYROLL",
    version: 1,
    nameTh: "อนุมัติรอบคำนวณเงินเดือน",
    nameEn: "Payroll Cycle Approved",
    description: "Fires when monthly payroll calculation is finalized and approved for payout",
    samplePayload: {
      payrollCycleId: "pay_999",
      month: "2026-09",
      totalAmount: 1850000.0,
      employeeCount: 75,
      approvedBy: "Executive Finance",
    },
  },

  // PROCUREMENT & INVENTORY
  PO_APPROVED: {
    eventType: "PO_APPROVED",
    domain: "PROCUREMENT",
    version: 1,
    nameTh: "ใบสั่งซื้อได้รับการอนุมัติ",
    nameEn: "Purchase Order Approved",
    description: "Fires when a PO exceeds approval criteria and is signed off",
    samplePayload: {
      poId: "po_555",
      poNumber: "PO-2026-09-001",
      supplierId: "sup_111",
      supplierName: "บริษัท สยามคลีนนิ่ง อิควิปเมนท์ จำกัด",
      totalAmount: 75000.0,
      projectId: "prj_001",
    },
  },
  GOODS_RECEIVED: {
    eventType: "GOODS_RECEIVED",
    domain: "INVENTORY",
    version: 1,
    nameTh: "ตรวจรับพัสดุ/สินค้าเข้าคลัง",
    nameEn: "Goods Received Note Created",
    description: "Fires when items arrive at warehouse or site and pass quality inspection",
    samplePayload: {
      grnId: "grn_777",
      poId: "po_555",
      warehouseId: "wh_main",
      itemCount: 5,
      isFullDelivery: true,
    },
  },
  STOCK_LOW_ALERT: {
    eventType: "STOCK_LOW_ALERT",
    domain: "INVENTORY",
    version: 1,
    nameTh: "สินค้าคงคลังต่ำกว่าจุดสั่งซื้อ",
    nameEn: "Inventory Below Reorder Point",
    description: "Fires when item quantity drops below minimum threshold (suggestion only, no auto-PO)",
    samplePayload: {
      itemId: "itm_303",
      itemName: "น้ำยาทำความสะอาดอเนกประสงค์ 5L",
      currentQty: 4,
      reorderPoint: 15,
      suggestedOrderQty: 30,
    },
  },

  // QHSE & SAFETY
  INCIDENT_REPORTED: {
    eventType: "INCIDENT_REPORTED",
    domain: "QHSE",
    version: 1,
    nameTh: "รายงานอุบัติเหตุ/ความเสี่ยงหน้างาน",
    nameEn: "Safety Incident Reported",
    description: "Fires when safety observation or incident report is submitted",
    samplePayload: {
      incidentId: "inc_888",
      siteId: "site_789",
      severity: "CRITICAL", // LOW | MEDIUM | HIGH | CRITICAL
      category: "FALL_HAZARD",
      injuredCount: 0,
      description: "ตรวจพบนั่งร้านชำรุดบริเวณทางเดินชั้น 3",
      reportedBy: "นายอนันต์ ปลอดภัย",
    },
  },
  CAPA_OVERDUE: {
    eventType: "CAPA_OVERDUE",
    domain: "QHSE",
    version: 1,
    nameTh: "มาตรการแก้ไข (CAPA) เกินกำหนดเวลา",
    nameEn: "Corrective Action Overdue",
    description: "Fires when a CAPA deadline has elapsed without verification",
    samplePayload: {
      capaId: "capa_404",
      incidentId: "inc_888",
      ownerId: "emp_111",
      ownerName: "วิชาญ วิศวกร",
      dueDate: "2026-09-15",
      daysOverdue: 2,
    },
  },

  // FINANCE & TREASURY
  INVOICE_ISSUED: {
    eventType: "INVOICE_ISSUED",
    domain: "FINANCE",
    version: 1,
    nameTh: "ออกใบแจ้งหนี้ให้ลูกค้า",
    nameEn: "Sales Invoice Issued",
    description: "Fires when customer billing invoice is generated and posted to Accounts Receivable",
    samplePayload: {
      invoiceId: "inv_1234",
      invoiceNumber: "INV-2026-09-042",
      customerId: "cust_901",
      customerName: "ธนาคารพัฒนาการจำกัด",
      totalAmount: 320000.0,
      dueDate: "2026-10-15",
    },
  },
  PAYMENT_COMPLETED: {
    eventType: "PAYMENT_COMPLETED",
    domain: "FINANCE",
    version: 1,
    nameTh: "รับชำระเงินเรียบร้อย",
    nameEn: "Payment Received & Reconciled",
    description: "Fires when bank statement transaction is matched against customer invoice",
    samplePayload: {
      paymentId: "pmt_5678",
      invoiceId: "inv_1234",
      amountPaid: 320000.0,
      bankAccount: "KBANK-789-0",
      reconciledAt: new Date().toISOString(),
    },
  },
  TREASURY_BUFFER_BREACHED: {
    eventType: "TREASURY_BUFFER_BREACHED",
    domain: "TREASURY",
    version: 1,
    nameTh: "ยอดเงินสดหมุนเวียนต่ำกว่าขั้นต่ำ",
    nameEn: "Cash Runway Below Minimum Buffer",
    description: "Fires when forecasted liquidity drops under executive threshold",
    samplePayload: {
      projectedDate: "2026-10-01",
      projectedBalance: 340000.0,
      minimumBuffer: 500000.0,
      deficit: 160000.0,
      actionRequired: "ACCELERATE_COLLECTION",
    },
  },

  // SYSTEM & INTEGRATION
  EXTERNAL_WEBHOOK_RECEIVED: {
    eventType: "EXTERNAL_WEBHOOK_RECEIVED",
    domain: "SYSTEM",
    version: 1,
    nameTh: "รับข้อมูลจากระบบภายนอก (Webhook)",
    nameEn: "Incoming External Webhook",
    description: "Fires when an authorized external integration (e.g., n8n, CRM) submits payload",
    samplePayload: {
      source: "n8n",
      endpointKey: "n8n_crm_sync",
      action: "LEAD_QUALIFIED",
      data: { leadId: "ld_99", customer: "Modern Logistics Co." },
    },
  },
};

export function getEventDefinition(eventType: string): EventDefinition | undefined {
  return ENTERPRISE_EVENT_REGISTRY[eventType];
}

export function listEventDefinitions(domain?: EventDomain): EventDefinition[] {
  const events = Object.values(ENTERPRISE_EVENT_REGISTRY);
  if (!domain) return events;
  return events.filter((e) => e.domain === domain);
}
