import { prisma } from "@/lib/prisma";

export interface CreateDocumentInput {
  documentNo: string;
  title: string;
  type?: string; // POLICY | PROCEDURE | WORK_INSTRUCTION | FORM | STANDARD | MANUAL | SPECIFICATION | OTHER
  ownerId: string;
  authorId: string;
  reviewerId?: string;
  approverId?: string;
  fileUrl?: string;
  changeSummary?: string;
}

export class DocumentControlService {
  /**
   * Registers a new controlled document (Version 1)
   */
  static async createDocument(input: CreateDocumentInput) {
    const document = await prisma.controlledDocument.create({
      data: {
        documentNo: input.documentNo,
        title: input.title,
        type: input.type || "PROCEDURE",
        version: 1,
        ownerId: input.ownerId,
        authorId: input.authorId,
        reviewerId: input.reviewerId,
        approverId: input.approverId,
        effectiveDate: new Date(),
        status: "DRAFT",
        fileUrl: input.fileUrl,
        changeSummary: input.changeSummary || "Initial release",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CONTROLLED_DOCUMENT_CREATED",
        entity: "ControlledDocument",
        entityId: document.id,
        metadata: JSON.stringify({
          documentNo: document.documentNo,
          version: 1,
          authorId: document.authorId,
        }),
      },
    });

    return document;
  }

  /**
   * Workflow transition: Submit for review -> Approve -> Make Effective
   */
  static async updateDocumentStatus(
    id: string,
    status: "UNDER_REVIEW" | "APPROVED" | "EFFECTIVE" | "ARCHIVED",
    performedBy: string
  ) {
    const doc = await prisma.controlledDocument.findUnique({ where: { id } });
    if (!doc) throw new Error("Document not found");

    const updated = await prisma.controlledDocument.update({
      where: { id },
      data: {
        status,
        effectiveDate: status === "EFFECTIVE" ? new Date() : doc.effectiveDate,
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CONTROLLED_DOCUMENT_STATUS_UPDATED",
        entity: "ControlledDocument",
        entityId: id,
        metadata: JSON.stringify({ documentNo: doc.documentNo, from: doc.status, to: status, performedBy }),
      },
    });

    return updated;
  }

  /**
   * Creates a new version (Version N+1) and supersedes the previous version
   */
  static async createRevision(
    previousDocId: string,
    changeSummary: string,
    authorId: string,
    newFileUrl?: string
  ) {
    const prev = await prisma.controlledDocument.findUnique({ where: { id: previousDocId } });
    if (!prev) throw new Error("Previous document not found");

    // Supersede old document
    await prisma.controlledDocument.update({
      where: { id: previousDocId },
      data: { status: "SUPERSEDED" },
    });

    const nextVersion = prev.version + 1;
    const newDocNo = `${prev.documentNo}-v${nextVersion}`;

    const newRevision = await prisma.controlledDocument.create({
      data: {
        documentNo: newDocNo,
        title: prev.title,
        type: prev.type,
        version: nextVersion,
        ownerId: prev.ownerId,
        authorId,
        reviewerId: prev.reviewerId,
        approverId: prev.approverId,
        effectiveDate: new Date(),
        status: "DRAFT",
        fileUrl: newFileUrl || prev.fileUrl,
        changeSummary,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CONTROLLED_DOCUMENT_REVISED",
        entity: "ControlledDocument",
        entityId: newRevision.id,
        metadata: JSON.stringify({
          documentNo: newRevision.documentNo,
          version: nextVersion,
          previousId: previousDocId,
          authorId,
        }),
      },
    });

    return newRevision;
  }

  /**
   * Records employee read & acknowledge for critical policy documents
   */
  static async recordAcknowledgment(documentId: string, employeeId: string, ipAddress?: string, userAgent?: string) {
    const ack = await prisma.documentAcknowledgment.upsert({
      where: {
        documentId_employeeId: {
          documentId,
          employeeId,
        },
      },
      create: {
        documentId,
        employeeId,
        acknowledgedAt: new Date(),
        ipAddress,
        userAgent,
      },
      update: {
        acknowledgedAt: new Date(),
        ipAddress,
        userAgent,
      },
    });

    return ack;
  }

  /**
   * Retrieves controlled documents
   */
  static async getDocuments(params: {
    type?: string;
    status?: string;
    take?: number;
    skip?: number;
  }) {
    const where: any = {};
    if (params.type) where.type = params.type;
    if (params.status) where.status = params.status;

    return prisma.controlledDocument.findMany({
      where,
      orderBy: { documentNo: "asc" },
      take: params.take || 50,
      skip: params.skip || 0,
    });
  }
}
