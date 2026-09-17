import { prisma } from "@/lib/prisma";
import { AuditService } from "../audit.service";

export interface BudgetCheckRequest {
  budgetLineId?: string;
  category?: string;
  department?: string;
  projectId?: string;
  amount: number;
  transactionReference: string; // e.g. "PR-2026-0012", "PO-2026-0045"
  requestedBy: string;
}

export interface BudgetCheckResult {
  allowed: boolean;
  status: "APPROVED" | "WARNING" | "APPROVAL_REQUIRED" | "BLOCKED";
  message: string;
  budgetLine?: any;
  allocatedAmount: number;
  consumedAmount: number;
  committedAmount: number;
  availableAmount: number;
  remainingAfterTransaction: number;
  burnRatePercentage: number;
}

export class BudgetControlService {
  /**
   * Check budget availability for PR, PO, or Payment Request
   */
  static async checkBudget(req: BudgetCheckRequest): Promise<BudgetCheckResult> {
    const config = await prisma.financeControlConfig.findUnique({ where: { key: "DEFAULT" } });
    const controlMode = config?.budgetControlMode || "WARNING";

    if (controlMode === "OFF") {
      return {
        allowed: true,
        status: "APPROVED",
        message: "Budget control is turned OFF.",
        allocatedAmount: 0,
        consumedAmount: 0,
        committedAmount: 0,
        availableAmount: 0,
        remainingAfterTransaction: 0,
        burnRatePercentage: 0,
      };
    }

    // Find applicable budget line
    let budgetLine = null;
    if (req.budgetLineId) {
      budgetLine = await prisma.budgetLine.findUnique({ where: { id: req.budgetLineId } });
    } else {
      budgetLine = await prisma.budgetLine.findFirst({
        where: {
          category: req.category,
          ...(req.department ? { department: req.department } : {}),
          ...(req.projectId ? { projectId: req.projectId } : {}),
        },
      });
    }

    if (!budgetLine) {
      return {
        allowed: controlMode !== "HARD_BLOCK",
        status: controlMode === "HARD_BLOCK" ? "BLOCKED" : "WARNING",
        message: "No specific budget line found for this category/department. Proceeding with caution.",
        allocatedAmount: 0,
        consumedAmount: 0,
        committedAmount: 0,
        availableAmount: 0,
        remainingAfterTransaction: -req.amount,
        burnRatePercentage: 100,
      };
    }

    const available = budgetLine.availableAmount;
    const remainingAfter = Math.round((available - req.amount) * 100) / 100;
    const totalSpent = budgetLine.consumedAmount + budgetLine.committedAmount;
    const burnRate =
      budgetLine.allocatedAmount > 0
        ? Math.round((totalSpent / budgetLine.allocatedAmount) * 100)
        : 0;

    if (remainingAfter < 0) {
      if (controlMode === "HARD_BLOCK") {
        return {
          allowed: false,
          status: "BLOCKED",
          message: `ยอดงบประมาณไม่เพียงพอ! งบคงเหลือ ฿${available.toLocaleString()} น้อยกว่ารายการที่ขอ ฿${req.amount.toLocaleString()} (ขาด ฿${Math.abs(remainingAfter).toLocaleString()})`,
          budgetLine,
          allocatedAmount: budgetLine.allocatedAmount,
          consumedAmount: budgetLine.consumedAmount,
          committedAmount: budgetLine.committedAmount,
          availableAmount: available,
          remainingAfterTransaction: remainingAfter,
          burnRatePercentage: burnRate,
        };
      } else if (controlMode === "APPROVAL_REQUIRED") {
        return {
          allowed: false,
          status: "APPROVAL_REQUIRED",
          message: `งบประมาณไม่เพียงพอ (ขาด ฿${Math.abs(remainingAfter).toLocaleString()}) จำเป็นต้องได้รับการอนุมัติเป็นกรณีพิเศษจากฝ่ายบริหาร`,
          budgetLine,
          allocatedAmount: budgetLine.allocatedAmount,
          consumedAmount: budgetLine.consumedAmount,
          committedAmount: budgetLine.committedAmount,
          availableAmount: available,
          remainingAfterTransaction: remainingAfter,
          burnRatePercentage: burnRate,
        };
      } else {
        // WARNING mode
        return {
          allowed: true,
          status: "WARNING",
          message: `แจ้งเตือน: รายการนี้จะทำให้งบเกิน ฿${Math.abs(remainingAfter).toLocaleString()}`,
          budgetLine,
          allocatedAmount: budgetLine.allocatedAmount,
          consumedAmount: budgetLine.consumedAmount,
          committedAmount: budgetLine.committedAmount,
          availableAmount: available,
          remainingAfterTransaction: remainingAfter,
          burnRatePercentage: burnRate,
        };
      }
    }

    return {
      allowed: true,
      status: "APPROVED",
      message: "งบประมาณเพียงพอ",
      budgetLine,
      allocatedAmount: budgetLine.allocatedAmount,
      consumedAmount: budgetLine.consumedAmount,
      committedAmount: budgetLine.committedAmount,
      availableAmount: available,
      remainingAfterTransaction: remainingAfter,
      burnRatePercentage: burnRate,
    };
  }

  /**
   * Record commitment (e.g. Approved PO, Approved Payment Request)
   * Formula: Available = Budget - Committed - Actual
   */
  static async recordCommitment(budgetLineId: string, amount: number) {
    const line = await prisma.budgetLine.findUnique({ where: { id: budgetLineId } });
    if (!line) throw new Error("Budget line not found");

    const newCommitted = Math.round((line.committedAmount + amount) * 100) / 100;
    const newAvailable = Math.round((line.allocatedAmount - line.consumedAmount - newCommitted) * 100) / 100;

    return prisma.budgetLine.update({
      where: { id: budgetLineId },
      data: {
        committedAmount: newCommitted,
        availableAmount: newAvailable,
      },
    });
  }

  /**
   * Record actual consumption (e.g. Paid Invoice, Payroll, Expense)
   * Converts commitment to actual consumption
   */
  static async recordActualConsumption(budgetLineId: string, amount: number, releasedCommitment = 0) {
    const line = await prisma.budgetLine.findUnique({ where: { id: budgetLineId } });
    if (!line) throw new Error("Budget line not found");

    const newConsumed = Math.round((line.consumedAmount + amount) * 100) / 100;
    const newCommitted = Math.max(0, Math.round((line.committedAmount - releasedCommitment) * 100) / 100);
    const newAvailable = Math.round((line.allocatedAmount - newConsumed - newCommitted) * 100) / 100;

    return prisma.budgetLine.update({
      where: { id: budgetLineId },
      data: {
        consumedAmount: newConsumed,
        committedAmount: newCommitted,
        availableAmount: newAvailable,
      },
    });
  }

  /**
   * Request budget transfer between two budget lines
   */
  static async requestTransfer(options: {
    fromBudgetLineId: string;
    toBudgetLineId: string;
    amount: number;
    reason: string;
    requestedBy: string;
  }) {
    if (options.amount <= 0) throw new Error("Transfer amount must be greater than zero");

    const fromLine = await prisma.budgetLine.findUnique({ where: { id: options.fromBudgetLineId } });
    const toLine = await prisma.budgetLine.findUnique({ where: { id: options.toBudgetLineId } });

    if (!fromLine || !toLine) throw new Error("Source or destination budget line not found");

    if (fromLine.availableAmount < options.amount) {
      throw new Error(`Insufficient available budget in source line. Available: ฿${fromLine.availableAmount.toLocaleString()}`);
    }

    const count = await prisma.budgetTransfer.count();
    const transferNo = `TRF-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const transfer = await prisma.budgetTransfer.create({
      data: {
        transferNo,
        fromBudgetLineId: options.fromBudgetLineId,
        toBudgetLineId: options.toBudgetLineId,
        amount: options.amount,
        reason: options.reason,
        requestedBy: options.requestedBy,
        status: "PENDING",
      },
    });

    await AuditService.log({
      userId: options.requestedBy,
      action: "BUDGET_TRANSFER_REQUESTED",
      entity: "BudgetTransfer",
      entityId: transfer.id,
      metadata: { transferNo, amount: options.amount, from: fromLine.category, to: toLine.category },
    });

    return transfer;
  }

  /**
   * Approve and apply budget transfer
   */
  static async approveTransfer(transferId: string, approvedBy: string) {
    const transfer = await prisma.budgetTransfer.findUnique({ where: { id: transferId } });
    if (!transfer) throw new Error("Transfer not found");

    if (transfer.status !== "PENDING") {
      throw new Error(`Transfer is already ${transfer.status}`);
    }

    const fromLine = await prisma.budgetLine.findUnique({ where: { id: transfer.fromBudgetLineId } });
    const toLine = await prisma.budgetLine.findUnique({ where: { id: transfer.toBudgetLineId } });
    if (!fromLine || !toLine) throw new Error("Budget lines not found");

    // Re-verify availability
    if (fromLine.availableAmount < transfer.amount) {
      throw new Error("Source line available budget is now insufficient");
    }

    // Apply transfer
    const updatedFromAllocated = Math.round((fromLine.allocatedAmount - transfer.amount) * 100) / 100;
    const updatedFromAvailable = Math.round((fromLine.availableAmount - transfer.amount) * 100) / 100;

    const updatedToAllocated = Math.round((toLine.allocatedAmount + transfer.amount) * 100) / 100;
    const updatedToAvailable = Math.round((toLine.availableAmount + transfer.amount) * 100) / 100;

    await prisma.budgetLine.update({
      where: { id: fromLine.id },
      data: {
        allocatedAmount: updatedFromAllocated,
        availableAmount: updatedFromAvailable,
      },
    });

    await prisma.budgetLine.update({
      where: { id: toLine.id },
      data: {
        allocatedAmount: updatedToAllocated,
        availableAmount: updatedToAvailable,
      },
    });

    const updated = await prisma.budgetTransfer.update({
      where: { id: transferId },
      data: {
        status: "APPLIED",
        approvedBy,
        approvedAt: new Date(),
      },
    });

    await AuditService.log({
      userId: approvedBy,
      action: "BUDGET_TRANSFER_APPLIED",
      entity: "BudgetTransfer",
      entityId: transferId,
      metadata: { amount: transfer.amount },
    });

    return updated;
  }
}
