import { prisma } from "@/lib/prisma";

export interface LogNegotiationDto {
  opportunityId: string;
  subject: string;
  clientRequest: string;
  ourResponse: string;
  priceImpact?: number;
  scopeImpact?: string;
  nextAction?: string;
  ownerId: string;
  date?: Date;
}

export class NegotiationService {
  static async getLogs(opportunityId: string) {
    return prisma.negotiationLog.findMany({
      where: { opportunityId },
      orderBy: { date: "desc" },
    });
  }

  static async logNegotiation(data: LogNegotiationDto) {
    const log = await prisma.negotiationLog.create({
      data: {
        opportunityId: data.opportunityId,
        subject: data.subject,
        clientRequest: data.clientRequest,
        ourResponse: data.ourResponse,
        priceImpact: data.priceImpact || 0,
        scopeImpact: data.scopeImpact,
        nextAction: data.nextAction,
        ownerId: data.ownerId,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });

    // Also register an activity note
    await prisma.cRMActivity.create({
      data: {
        opportunityId: data.opportunityId,
        type: "MEETING",
        subject: `Negotiation: ${data.subject}`,
        description: `Client Request: ${data.clientRequest} | Response: ${data.ourResponse} (Price Impact: ${data.priceImpact || 0} THB)`,
        scheduledAt: new Date(),
        completedAt: new Date(),
        ownerId: data.ownerId,
        status: "COMPLETED",
      },
    });

    return log;
  }
}
