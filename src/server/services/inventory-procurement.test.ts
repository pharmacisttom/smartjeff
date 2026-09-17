import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { ItemService } from "./inventory/item.service";
import { WarehouseService } from "./inventory/warehouse.service";
import { StockMovementService } from "./inventory/stock-movement.service";
import { MaterialRequirementService } from "./inventory/material-requirement.service";
import { SupplierService } from "./procurement/supplier.service";
import { PurchaseRequestService } from "./procurement/purchase-request.service";
import { PurchaseOrderService } from "./procurement/purchase-order.service";
import { GoodsReceiptService } from "./inventory/goods-receipt.service";
import { MaterialIssueService } from "./inventory/material-issue.service";
import { AssetService } from "./inventory/asset.service";
import { AIOperationsToolRegistry } from "../ai/tools/tool-registry";
import { AIUserContext } from "../ai/security/ai-authorization.service";

describe("SmartJeff Phase 16 — Procurement, Inventory, Asset & Material Operations", () => {
  let categoryId: string;
  let unitId: string;
  let itemId: string;
  let warehouseId: string;
  let supplierId: string;
  let clientId: string;
  let projectId: string;

  beforeAll(async () => {
    // 1. Create base Unit and Category
    const unit = await ItemService.createUnit({
      code: `UNIT-${Date.now()}`,
      nameTh: "ชิ้น",
      nameEn: "Pieces",
    });
    unitId = unit.id;

    const category = await ItemService.createCategory({
      code: `CAT-${Date.now()}`,
      name: "วัสดุก่อสร้างและงานระบบ",
    });
    categoryId = category.id;

    // 2. Create Item
    const item = await ItemService.createItem({
      code: `ITEM-${Date.now()}`,
      name: "ปูนซีเมนต์ปอร์ตแลนด์ Type 1",
      categoryId,
      unitId,
      minimumStock: 10,
      reorderPoint: 20,
      standardCost: 100,
    });
    itemId = item.id;

    // 3. Create Warehouse
    const warehouse = await WarehouseService.createWarehouse({
      code: `WH-${Date.now()}`,
      name: "คลังพัสดุหลักส่วนกลาง",
      type: "CENTRAL",
    });
    warehouseId = warehouse.id;

    // 4. Create Supplier
    const supplier = await SupplierService.createSupplier({
      code: `SUP-${Date.now()}`,
      name: "บริษัท สยาม แมททีเรียล ซัพพลาย จำกัด",
      contactName: "คุณสมชาย จัดหา",
      phone: "081-999-8888",
    });
    supplierId = supplier.id;

    // 5. Create Client & Project
    const client = await prisma.client.create({
      data: {
        code: `CLI-${Date.now()}`,
        name: "บริษัท อมตะ คอร์ปอเรชั่น จำกัด",
      },
    });
    clientId = client.id;

    const project = await prisma.project.create({
      data: {
        projectCode: `PRJ-${Date.now()}`,
        clientId: client.id,
        name: "โครงการขยายอาคารโรงงานอมตะซิตี้",
        budgetAmount: 1000000,
      },
    });
    projectId = project.id;
  });

  // 1. Stock Movement & Weighted Average Cost
  it("ควรคำนวณต้นทุนถัวเฉลี่ยถ่วงน้ำหนัก (Weighted Average Cost) ได้อย่างถูกต้องเมื่อรับสินค้าเข้า", async () => {
    // Step 1: รับสินค้าเข้าล็อตแรก 100 ชิ้น @ 10 บาท (มูลค่า 1,000)
    await StockMovementService.recordMovement({
      warehouseId,
      itemId,
      movementType: "PURCHASE_RECEIPT",
      quantity: 100,
      unitCost: 10,
      referenceType: "MANUAL",
      referenceId: "TEST-GR-01",
      createdBy: "Tester",
    });

    let balance = await prisma.stockBalance.findUnique({
      where: { warehouseId_itemId: { warehouseId, itemId } },
    });
    expect(balance?.quantity).toBe(100);
    expect(balance?.averageCost).toBe(10);

    // Step 2: รับสินค้าเข้าล็อตสอง 50 ชิ้น @ 16 บาท (มูลค่า 800)
    // มูลค่ารวม = 1,000 + 800 = 1,800 บาท, ปริมาณรวม = 150 ชิ้น
    // ต้นทุนเฉลี่ยใหม่ = 1,800 / 150 = 12.00 บาท/ชิ้น
    await StockMovementService.recordMovement({
      warehouseId,
      itemId,
      movementType: "PURCHASE_RECEIPT",
      quantity: 50,
      unitCost: 16,
      referenceType: "MANUAL",
      referenceId: "TEST-GR-02",
      createdBy: "Tester",
    });

    balance = await prisma.stockBalance.findUnique({
      where: { warehouseId_itemId: { warehouseId, itemId } },
    });
    expect(balance?.quantity).toBe(150);
    expect(balance?.availableQuantity).toBe(150);
    expect(balance?.averageCost).toBe(12);
  });

  // 2. Negative Stock Guard
  it("ต้องบล็อคไม่ให้เบิกสินค้าเกินจำนวนที่มีในคลัง (Negative Stock Guard)", async () => {
    const balance = await prisma.stockBalance.findUnique({
      where: { warehouseId_itemId: { warehouseId, itemId } },
    });
    const currentAvailable = balance?.availableQuantity || 0;

    // พยายามตัดสต็อกเกินยอดคงเหลือ (เช่น 150 + 10 = 160)
    await expect(
      StockMovementService.recordMovement({
        warehouseId,
        itemId,
        movementType: "ISSUE",
        quantity: currentAvailable + 10,
        referenceType: "MANUAL",
        referenceId: "TEST-OVER-ISSUE",
        createdBy: "Tester",
      })
    ).rejects.toThrow(/ยอดสต็อกคงเหลือไม่เพียงพอ/);
  });

  // 3. Material Planning & Shortage Check
  it("ควรคำนวณ Shortage ได้อย่างถูกต้อง และแจ้งเตือนเมื่อต้องจัดซื้อเพิ่ม", async () => {
    // สต็อกมีอยู่ 150 ชิ้น, สร้างความต้องการใช้ 200 ชิ้น
    const req = await MaterialRequirementService.createRequirement({
      itemId,
      projectId,
      quantityRequired: 200,
      requiredDate: new Date(),
      requestedBy: "วิศวกรโครงการ",
    });

    const check = await MaterialRequirementService.checkShortage(req.id);
    expect(check.quantityRequired).toBe(200);
    expect(check.totalAvailable).toBe(150);
    expect(check.shortage).toBe(50);
    expect(check.needsPurchase).toBe(true);
  });

  // 4. Stock Reservation
  it("ควรจองสต็อกและปลดการจองได้อย่างถูกต้องโดยไม่ทำให้สต็อกรวมสูญหาย", async () => {
    // จอง 30 ชิ้น จาก 150 ชิ้น -> Available เหลือ 120, Reserved เป็น 30
    const res = await MaterialRequirementService.reserveStock({
      warehouseId,
      itemId,
      projectId,
      quantity: 30,
      reservedBy: "Tester",
    });

    let balance = await prisma.stockBalance.findUnique({
      where: { warehouseId_itemId: { warehouseId, itemId } },
    });
    expect(balance?.quantity).toBe(150);
    expect(balance?.reservedQuantity).toBe(30);
    expect(balance?.availableQuantity).toBe(120);

    // ปลดการจอง (Release Reservation)
    await MaterialRequirementService.releaseReservation(res.id);

    balance = await prisma.stockBalance.findUnique({
      where: { warehouseId_itemId: { warehouseId, itemId } },
    });
    expect(balance?.quantity).toBe(150);
    expect(balance?.reservedQuantity).toBe(0);
    expect(balance?.availableQuantity).toBe(150);
  });

  // 5. Procurement Flow: PR -> PO -> Committed Cost -> Goods Receipt
  it("ควรดำเนินกระบวนการจัดซื้อ (PR -> PO -> Committed Cost -> Goods Receipt) ได้อย่างสมบูรณ์", async () => {
    // 1. สร้าง PR
    const pr = await PurchaseRequestService.createPR({
      requesterId: "หัวหน้าฝ่ายจัดซื้อ",
      projectId,
      requiredDate: new Date(Date.now() + 86400000),
      reason: "จัดซื้อวัสดุเพิ่มตาม Shortage",
      items: [
        {
          itemId,
          description: "ปูนซีเมนต์ปอร์ตแลนด์",
          quantity: 50,
          estimatedUnitPrice: 100,
        },
      ],
    });
    expect(pr.status).toBe("SUBMITTED");

    // 2. อนุมัติ PR
    const approvedPr = await PurchaseRequestService.approvePR(pr.id, "ผู้จัดการโครงการ", "APPROVED");
    expect(approvedPr.status).toBe("APPROVED");

    // 3. สร้าง PO ผูกกับ Supplier และโครงการ
    const po = await PurchaseOrderService.createPO({
      supplierId,
      projectId,
      purchaseRequestId: pr.id,
      expectedDeliveryDate: new Date(Date.now() + 3 * 86400000),
      subtotal: 5000,
      tax: 350,
      total: 5350,
      createdBy: "เจ้าหน้าที่จัดซื้อ",
      items: [
        {
          itemId,
          description: "ปูนซีเมนต์ปอร์ตแลนด์",
          quantity: 50,
          unitPrice: 100,
          tax: 7,
          total: 5350,
        },
      ],
    });
    expect(po.status).toBe("PENDING_APPROVAL");

    // 4. อนุมัติ PO -> ต้องสร้าง Committed Cost ใน ProjectCostEntry ของโครงการ
    const approvedPo = await PurchaseOrderService.approvePO(po.id, "ผู้จัดการฝ่ายจัดซื้อ");
    expect(approvedPo.status).toBe("APPROVED");

    const committedCost = await prisma.projectCostEntry.findFirst({
      where: {
        projectId,
        sourceType: "PO",
        sourceId: po.id,
      },
    });
    expect(committedCost).toBeDefined();
    expect(committedCost?.isCommitted).toBe(true);
    expect(committedCost?.amount).toBe(5350);

    // 5. ตรวจรับสินค้า (Goods Receipt) 50 ชิ้น เข้าคลัง
    const gr = await GoodsReceiptService.recordGoodsReceipt({
      purchaseOrderId: po.id,
      warehouseId,
      receivedBy: "เจ้าหน้าที่ตรวจรับ",
      items: [
        {
          poItemId: approvedPo.items[0].id,
          itemId,
          quantityReceived: 50,
          quantityAccepted: 50,
          quantityRejected: 0,
          qualityStatus: "PASS",
          unitCost: 100,
        },
      ],
    });
    expect(gr.status).toBe("COMPLETED");

    // ตรวจสอบว่า PO ปรับเป็น RECEIVED
    const updatedPo = await prisma.purchaseOrder.findUnique({ where: { id: po.id } });
    expect(updatedPo?.status).toBe("RECEIVED");

    // ตรวจสอบว่ายอดสต็อกเพิ่มขึ้นอีก 50 ชิ้น (150 + 50 = 200)
    const balance = await prisma.stockBalance.findUnique({
      where: { warehouseId_itemId: { warehouseId, itemId } },
    });
    expect(balance?.quantity).toBe(200);
  });

  // 6. Material Issue & Project Actual Cost Integration
  it("ควรเบิกจ่ายวัสดุเข้าโครงการ และบันทึก Actual Cost เข้าสู่ Project Costing ทันที", async () => {
    const issue = await MaterialIssueService.issueMaterial({
      warehouseId,
      projectId,
      requestedBy: "โฟร์แมนประจำไซต์ A",
      items: [
        {
          itemId,
          requestedQty: 40,
          issuedQty: 40,
          unitCost: 100,
        },
      ],
    });

    expect(issue.status).toBe("ISSUED");

    // ตรวจสอบว่าสต็อกลดลง 40 ชิ้น (200 - 40 = 160)
    const balance = await prisma.stockBalance.findUnique({
      where: { warehouseId_itemId: { warehouseId, itemId } },
    });
    expect(balance?.quantity).toBe(160);

    // ตรวจสอบว่ามี ProjectCostEntry ชนิด MATERIAL บันทึกเป็น Actual Cost (isCommitted = false)
    const costEntry = await prisma.projectCostEntry.findFirst({
      where: {
        projectId,
        sourceType: "MATERIAL_ISSUE",
        sourceId: issue.id,
      },
    });

    expect(costEntry).toBeDefined();
    expect(costEntry?.costType).toBe("MATERIAL");
    expect(costEntry?.isCommitted).toBe(false);
    expect(costEntry?.amount).toBe(4000); // 40 * 100
  });

  // 7. Tool Assignment Lifecycle
  it("ควรจัดการวงจรชีวิตการยืม-คืนเครื่องมือ (Tool Assignment) และอัปเดตสถานะได้อย่างถูกต้อง", async () => {
    // สร้าง Employee ทดสอบ
    const emp = await prisma.employee.create({
      data: {
        code: `EMP-${Date.now()}`,
        firstName: "สมชาย",
        lastName: "ช่างเชื่อม",
        position: "ช่างเชื่อมโลหะ",
        site: {
          create: {
            code: `STE-${Date.now()}`,
            name: "ไซต์ทดสอบระยอง",
          },
        },
      },
    });

    // สร้าง Asset เครื่องมือ
    const asset = await AssetService.createAsset({
      assetCode: `AST-WLD-${Date.now()}`,
      name: "ตู้เชื่อมไฟฟ้าอินเวอร์เตอร์ Jasic",
      category: "POWER_TOOL",
      purchaseCost: 8500,
      status: "AVAILABLE",
    });
    expect(asset.status).toBe("AVAILABLE");

    // ยืมเครื่องมือ
    const assignment = await AssetService.assignTool({
      assetId: asset.id,
      employeeId: emp.id,
      issuedBy: "หัวหน้าคลัง",
    });
    expect(assignment.status).toBe("ISSUED");

    let updatedAsset = await prisma.asset.findUnique({ where: { id: asset.id } });
    expect(updatedAsset?.status).toBe("IN_USE");
    expect(updatedAsset?.currentEmployeeId).toBe(emp.id);

    // คืนเครื่องมือ
    await AssetService.returnTool(assignment.id, "GOOD");

    updatedAsset = await prisma.asset.findUnique({ where: { id: asset.id } });
    expect(updatedAsset?.status).toBe("AVAILABLE");
    expect(updatedAsset?.currentEmployeeId).toBeNull();
  });

  // 8. AI Copilot 7 Tools Execution
  it("AI Operations Copilot Tool Registry ต้องมี 7 เครื่องมือสำหรับคลังและจัดซื้อ พร้อมรันในโหมด Read-only", async () => {
    AIOperationsToolRegistry.initialize();

    const expectedTools = [
      "getInventorySummary",
      "getLowStockItems",
      "getProjectMaterialStatus",
      "getPurchaseRequestSummary",
      "getPurchaseOrderSummary",
      "getSupplierDeliverySummary",
      "getAssetSummary",
    ];

    for (const toolName of expectedTools) {
      const tool = AIOperationsToolRegistry.getTool(toolName);
      expect(tool).toBeDefined();
    }

    const adminUser: AIUserContext = {
      role: "ADMIN",
    };

    // รัน getInventorySummary
    const invSummary = await AIOperationsToolRegistry.executeTool("getInventorySummary", {}, adminUser);
    expect(invSummary).toBeDefined();
    expect(typeof invSummary.totalSKUs).toBe("number");
    expect(typeof invSummary.totalQuantity).toBe("number");
    expect(typeof invSummary.totalInventoryValue).toBe("number");

    // รัน getLowStockItems
    const lowStock = await AIOperationsToolRegistry.executeTool("getLowStockItems", {}, adminUser);
    expect(Array.isArray(lowStock)).toBe(true);

    // รัน getProjectMaterialStatus
    const matStatus = await AIOperationsToolRegistry.executeTool(
      "getProjectMaterialStatus",
      { projectId },
      adminUser
    );
    expect(Array.isArray(matStatus)).toBe(true);
  });
});
