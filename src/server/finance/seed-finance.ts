import { prisma } from "@/lib/prisma";

export async function ensureFinanceBaselineData() {
  const accountCount = await prisma.financialAccount.count();
  if (accountCount === 0) {
    const acc1 = await prisma.financialAccount.create({
      data: {
        accountCode: "KTB-001",
        accountName: "ธนาคารกรุงไทย (กระแสรายวัน - บัญชีหลัก)",
        bankCode: "KTB",
        branchName: "สาขามาบตาพุด",
        accountNo: "219-1-84920-3",
        maskedAccountNo: "xxx-x-xx920-3",
        currency: "THB",
        accountType: "CURRENT",
        ledgerBalance: 3450000.0,
        lastBankBalance: 3450000.0,
        reconciledBalance: 3450000.0,
        lastReconciledDate: new Date("2026-09-10"),
        status: "ACTIVE",
        statementImportType: "CSV",
        reconciliationEnabled: true,
      },
    });

    const acc2 = await prisma.financialAccount.create({
      data: {
        accountCode: "SCB-002",
        accountName: "ธนาคารไทยพาณิชย์ (ออมทรัพย์ - ปฏิบัติการ)",
        bankCode: "SCB",
        branchName: "สาขาระยอง",
        accountNo: "508-2-33411-9",
        maskedAccountNo: "xxx-x-xx411-9",
        currency: "THB",
        accountType: "SAVINGS",
        ledgerBalance: 1280000.0,
        lastBankBalance: 1280000.0,
        reconciledBalance: 1280000.0,
        lastReconciledDate: new Date("2026-09-12"),
        status: "ACTIVE",
        statementImportType: "CSV",
        reconciliationEnabled: true,
      },
    });

    const acc3 = await prisma.financialAccount.create({
      data: {
        accountCode: "KBANK-003",
        accountName: "ธนาคารกสิกรไทย (ออมทรัพย์ - สำรองสภาพคล่อง)",
        bankCode: "KBANK",
        branchName: "สาขาเซ็นทรัลพลาซา ระยอง",
        accountNo: "411-2-99081-4",
        maskedAccountNo: "xxx-x-xx081-4",
        currency: "THB",
        accountType: "SAVINGS",
        ledgerBalance: 850000.0,
        lastBankBalance: 850000.0,
        reconciledBalance: 850000.0,
        lastReconciledDate: new Date("2026-09-14"),
        status: "ACTIVE",
        statementImportType: "XLSX",
        reconciliationEnabled: true,
      },
    });

    // Create initial unreconciled CashTransactions
    await prisma.cashTransaction.createMany({
      data: [
        {
          transactionNo: "RC-2026-00124",
          financialAccountId: acc1.id,
          transactionDate: new Date("2026-09-15"),
          amount: 150000.0,
          direction: "CREDIT",
          category: "RECEIPT",
          referenceType: "CUSTOMER_RECEIPT",
          referenceId: "INV-2026-089",
          description: "รับชำระเงินงวดบริการ บริษัท ไออาร์พีซี จำกัด (มหาชน)",
          partyType: "CUSTOMER",
          partyName: "บริษัท ไออาร์พีซี จำกัด (มหาชน)",
          reconciled: false,
        },
        {
          transactionNo: "RC-2026-00125",
          financialAccountId: acc1.id,
          transactionDate: new Date("2026-09-16"),
          amount: 85000.0,
          direction: "CREDIT",
          category: "RECEIPT",
          referenceType: "CUSTOMER_RECEIPT",
          referenceId: "INV-2026-090",
          description: "รับชำระค่าบริการทำความสะอาด Site Bangna",
          partyType: "CUSTOMER",
          partyName: "บริษัท ปตท. โกลบอล เคมิคอล",
          reconciled: false,
        },
        {
          transactionNo: "PY-2026-00311",
          financialAccountId: acc1.id,
          transactionDate: new Date("2026-09-16"),
          amount: 42000.0,
          direction: "DEBIT",
          category: "PAYMENT",
          referenceType: "SUPPLIER_PAYMENT",
          referenceId: "PO-2026-014",
          description: "ชำระค่าน้ำยาเคมีภัณฑ์และอุปกรณ์ทำความสะอาด",
          partyType: "SUPPLIER",
          partyName: "บจก. เคมีภัณฑ์ไทยแลนด์",
          reconciled: false,
        },
        {
          transactionNo: "PY-2026-00312",
          financialAccountId: acc2.id,
          transactionDate: new Date("2026-09-15"),
          amount: 12500.0,
          direction: "DEBIT",
          category: "EXPENSE",
          referenceType: "EXPENSE",
          referenceId: "EXP-2026-055",
          description: "ค่าน้ำมันเชื้อเพลิงยานพาหนะสายตรวจระยอง",
          partyType: "SUPPLIER",
          partyName: "บมจ. ปตท. น้ำมันและการค้าปลีก",
          reconciled: false,
        },
      ],
    });
  }

  // Cost Centers
  const ccCount = await prisma.costCenter.count();
  if (ccCount === 0) {
    await prisma.costCenter.createMany({
      data: [
        { code: "CC-OPS-EAST", name: "ปฏิบัติการภาคตะวันออก", type: "OPERATIONS", department: "OPERATIONS" },
        { code: "CC-LOG-FLEET", name: "งานยานพาหนะและขนส่ง", type: "LOGISTICS", department: "LOGISTICS" },
        { code: "CC-ADM-HQ", name: "งานบริหารสำนักงานใหญ่", type: "ADMINISTRATIVE", department: "MANAGEMENT" },
        { code: "CC-PRC-MAT", name: "จัดซื้อวัสดุและอุปกรณ์", type: "OVERHEAD", department: "PROCUREMENT" },
      ],
    });
  }

  // Budget Plan
  const budgetCount = await prisma.budgetPlan.count();
  if (budgetCount === 0) {
    const plan = await prisma.budgetPlan.create({
      data: {
        planNo: "BGT-2026-0001",
        name: "งบประมาณประจำปี 2569 (Enterprise Operational Budget 2026)",
        fiscalYear: 2026,
        version: 1,
        status: "ACTIVE",
        currency: "THB",
        totalBudget: 15500000.0,
        createdBy: "admin-id",
        approvedBy: "admin-id",
        approvedAt: new Date("2026-01-05"),
        notes: "งบประมาณประจำปีหลัก ผ่านการอนุมัติจากคณะกรรมการบริหาร",
      },
    });

    const lines = [
      { category: "LABOR", allocated: 7200000.0, consumed: 4800000.0, committed: 600000.0, period: "2026-ANNUAL" },
      { category: "OT", allocated: 1500000.0, consumed: 1100000.0, committed: 150000.0, period: "2026-ANNUAL" },
      { category: "MATERIAL", allocated: 2200000.0, consumed: 1450000.0, committed: 300000.0, period: "2026-ANNUAL" },
      { category: "FLEET", allocated: 950000.0, consumed: 620000.0, committed: 80000.0, period: "2026-ANNUAL" },
      { category: "FUEL", allocated: 1200000.0, consumed: 890000.0, committed: 95000.0, period: "2026-ANNUAL" },
      { category: "MAINTENANCE", allocated: 650000.0, consumed: 380000.0, committed: 45000.0, period: "2026-ANNUAL" },
      { category: "TRAVEL", allocated: 300000.0, consumed: 185000.0, committed: 20000.0, period: "2026-ANNUAL" },
      { category: "PROCUREMENT", allocated: 800000.0, consumed: 450000.0, committed: 120000.0, period: "2026-ANNUAL" },
      { category: "CAPEX", allocated: 700000.0, consumed: 350000.0, committed: 50000.0, period: "2026-ANNUAL" },
    ];

    for (const l of lines) {
      const available = Math.round((l.allocated - l.consumed - l.committed) * 100) / 100;
      await prisma.budgetLine.create({
        data: {
          budgetPlanId: plan.id,
          category: l.category,
          period: l.period,
          allocatedAmount: l.allocated,
          consumedAmount: l.consumed,
          committedAmount: l.committed,
          forecastAmount: Math.round((l.consumed + l.committed * 1.2) * 100) / 100,
          availableAmount: available,
        },
      });
    }
  }

  // Config
  await prisma.financeControlConfig.upsert({
    where: { key: "DEFAULT" },
    update: {},
    create: {
      key: "DEFAULT",
      matchingThreshold: 90.0,
      dateToleranceDays: 2,
      minimumCashBuffer: 500000.0,
      forecastHorizonWeeks: 13,
      budgetControlMode: "WARNING",
      budgetAlertThresholdPct: 90.0,
      separationOfDutiesEnabled: true,
    },
  });
}
