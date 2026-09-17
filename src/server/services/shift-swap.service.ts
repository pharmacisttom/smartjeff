import { prisma } from "@/lib/prisma";
import { ShiftConflictService } from "./shift-conflict.service";

export interface CreateShiftSwapInput {
  requesterId: string;
  targetEmployeeId: string;
  requesterAssignmentId: string;
  targetAssignmentId: string;
  reason?: string;
}

export class ShiftSwapService {
  /**
   * Create a new shift swap request between two employees
   */
  static async createSwapRequest(input: CreateShiftSwapInput) {
    const [reqAssignment, targetAssignment] = await Promise.all([
      prisma.shiftAssignment.findUnique({
        where: { id: input.requesterAssignmentId },
        include: { shift: true, site: true },
      }),
      prisma.shiftAssignment.findUnique({
        where: { id: input.targetAssignmentId },
        include: { shift: true, site: true },
      }),
    ]);

    if (!reqAssignment) throw new Error("Requester assignment not found");
    if (!targetAssignment) throw new Error("Target assignment not found");

    if (reqAssignment.employeeId !== input.requesterId) {
      throw new Error("Requester does not own the requested assignment");
    }
    if (targetAssignment.employeeId !== input.targetEmployeeId) {
      throw new Error("Target employee does not own the target assignment");
    }

    // Pre-validate conflicts if swapped
    const [reqValidation, targetValidation] = await Promise.all([
      ShiftConflictService.validateAssignment({
        employeeId: input.requesterId,
        siteId: targetAssignment.siteId,
        shiftId: targetAssignment.shiftId,
        workDate: targetAssignment.workDate,
        plannedStart: targetAssignment.plannedStart,
        plannedEnd: targetAssignment.plannedEnd,
        excludeAssignmentId: reqAssignment.id,
      }),
      ShiftConflictService.validateAssignment({
        employeeId: input.targetEmployeeId,
        siteId: reqAssignment.siteId,
        shiftId: reqAssignment.shiftId,
        workDate: reqAssignment.workDate,
        plannedStart: reqAssignment.plannedStart,
        plannedEnd: reqAssignment.plannedEnd,
        excludeAssignmentId: targetAssignment.id,
      }),
    ]);

    if (reqValidation.hasErrors) {
      throw new Error(
        `ไม่สามารถขอสลับกะได้: ผู้ขอมอบหมายมีข้อขัดแย้ง (${reqValidation.conflicts[0].message})`
      );
    }
    if (targetValidation.hasErrors) {
      throw new Error(
        `ไม่สามารถขอสลับกะได้: พนักงานปลายทางมีข้อขัดแย้ง (${targetValidation.conflicts[0].message})`
      );
    }

    return prisma.shiftSwapRequest.create({
      data: {
        requesterId: input.requesterId,
        targetEmployeeId: input.targetEmployeeId,
        requesterAssignmentId: input.requesterAssignmentId,
        targetAssignmentId: input.targetAssignmentId,
        reason: input.reason,
        status: "PENDING",
      },
      include: {
        requester: { select: { firstName: true, lastName: true, code: true } },
        targetEmployee: { select: { firstName: true, lastName: true, code: true } },
        requesterAssignment: { include: { shift: true, site: true } },
        targetAssignment: { include: { shift: true, site: true } },
      },
    });
  }

  /**
   * Target employee responds to swap request (ACCEPT / REJECT)
   */
  static async respondToSwap(swapId: string, employeeId: string, action: "ACCEPT" | "REJECT") {
    const swap = await prisma.shiftSwapRequest.findUnique({ where: { id: swapId } });
    if (!swap) throw new Error("Swap request not found");

    if (swap.targetEmployeeId !== employeeId) {
      throw new Error("You are not authorized to respond to this swap request");
    }

    if (swap.status !== "PENDING") {
      throw new Error(`Cannot respond to swap request in status: ${swap.status}`);
    }

    const nextStatus = action === "ACCEPT" ? "ACCEPTED" : "REJECTED";

    return prisma.shiftSwapRequest.update({
      where: { id: swapId },
      data: { status: nextStatus },
    });
  }

  /**
   * Manager or HR approves or rejects accepted swap request
   */
  static async approveSwap(swapId: string, approvedBy: string, action: "APPROVE" | "REJECT") {
    const swap = await prisma.shiftSwapRequest.findUnique({
      where: { id: swapId },
      include: {
        requesterAssignment: true,
        targetAssignment: true,
      },
    });

    if (!swap) throw new Error("Swap request not found");
    if (swap.status !== "ACCEPTED" && swap.status !== "PENDING") {
      throw new Error(`Cannot approve swap request in status: ${swap.status}`);
    }

    if (action === "REJECT") {
      return prisma.shiftSwapRequest.update({
        where: { id: swapId },
        data: {
          status: "REJECTED",
          approvedBy,
          approvedAt: new Date(),
        },
      });
    }

    // Atomic transaction: Swap employee IDs and update status
    return prisma.$transaction(async (tx) => {
      // 1. Swap assignments
      await tx.shiftAssignment.update({
        where: { id: swap.requesterAssignmentId },
        data: { employeeId: swap.targetEmployeeId },
      });

      await tx.shiftAssignment.update({
        where: { id: swap.targetAssignmentId },
        data: { employeeId: swap.requesterId },
      });

      // 2. Audit logs
      await tx.shiftAuditLog.create({
        data: {
          assignmentId: swap.requesterAssignmentId,
          action: "SWAP",
          performedBy: approvedBy,
          oldValue: JSON.stringify({ employeeId: swap.requesterId }),
          newValue: JSON.stringify({ employeeId: swap.targetEmployeeId }),
          reason: `Shift swap approved (Swap ID: ${swap.id})`,
        },
      });

      await tx.shiftAuditLog.create({
        data: {
          assignmentId: swap.targetAssignmentId,
          action: "SWAP",
          performedBy: approvedBy,
          oldValue: JSON.stringify({ employeeId: swap.targetEmployeeId }),
          newValue: JSON.stringify({ employeeId: swap.requesterId }),
          reason: `Shift swap approved (Swap ID: ${swap.id})`,
        },
      });

      // 3. Update swap request status
      return tx.shiftSwapRequest.update({
        where: { id: swapId },
        data: {
          status: "APPROVED",
          approvedBy,
          approvedAt: new Date(),
        },
      });
    });
  }

  /**
   * Get list of shift swap requests
   */
  static async getSwapRequests(filter?: { employeeId?: string; status?: string }) {
    return prisma.shiftSwapRequest.findMany({
      where: {
        ...(filter?.employeeId
          ? {
              OR: [
                { requesterId: filter.employeeId },
                { targetEmployeeId: filter.employeeId },
              ],
            }
          : {}),
        ...(filter?.status ? { status: filter.status } : {}),
      },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, code: true } },
        targetEmployee: { select: { id: true, firstName: true, lastName: true, code: true } },
        requesterAssignment: { include: { shift: true, site: true } },
        targetAssignment: { include: { shift: true, site: true } },
      },
      orderBy: { requestedAt: "desc" },
    });
  }
}
