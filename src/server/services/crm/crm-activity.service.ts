import { prisma } from "@/lib/prisma";

export interface CreateActivityDto {
  leadId?: string;
  clientId?: string;
  opportunityId?: string;
  type: string; // CALL | EMAIL | MEETING | SITE_VISIT | FOLLOW_UP | NOTE | DOCUMENT | OTHER
  subject: string;
  description?: string;
  scheduledAt: Date;
  completedAt?: Date;
  ownerId: string;
  status?: string; // PLANNED | COMPLETED | CANCELLED
}

export class CRMActivityService {
  static async getActivities(filter?: {
    leadId?: string;
    opportunityId?: string;
    ownerId?: string;
    status?: string;
    type?: string;
  }) {
    const where: any = {};
    if (filter?.leadId) where.leadId = filter.leadId;
    if (filter?.opportunityId) where.opportunityId = filter.opportunityId;
    if (filter?.ownerId) where.ownerId = filter.ownerId;
    if (filter?.status) where.status = filter.status;
    if (filter?.type) where.type = filter.type;

    return prisma.cRMActivity.findMany({
      where,
      include: {
        lead: { select: { id: true, leadNo: true, companyName: true, contactName: true } },
        opportunity: { select: { id: true, opportunityNo: true, name: true, stage: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });
  }

  static async createActivity(data: CreateActivityDto) {
    return prisma.cRMActivity.create({
      data: {
        leadId: data.leadId,
        clientId: data.clientId,
        opportunityId: data.opportunityId,
        type: data.type,
        subject: data.subject,
        description: data.description,
        scheduledAt: new Date(data.scheduledAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
        ownerId: data.ownerId,
        status: data.status || "PLANNED",
      },
    });
  }

  static async completeActivity(id: string, notes?: string) {
    return prisma.cRMActivity.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        description: notes ? { set: notes } : undefined,
      },
    });
  }
}
