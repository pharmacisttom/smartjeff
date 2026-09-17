import { prisma } from "@/lib/prisma";

export interface CreateLeadDto {
  companyName: string;
  contactName: string;
  phone?: string;
  email?: string;
  source?: string;
  industry?: string;
  province?: string;
  interest?: string;
  estimatedValue?: number;
  ownerId?: string;
  notes?: string;
}

export interface LeadFilter {
  status?: string;
  source?: string;
  ownerId?: string;
  search?: string;
}

export class LeadService {
  static async getLeads(filter?: LeadFilter) {
    const where: any = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.source) where.source = filter.source;
    if (filter?.ownerId) where.ownerId = filter.ownerId;
    if (filter?.search) {
      where.OR = [
        { companyName: { contains: filter.search } },
        { contactName: { contains: filter.search } },
        { leadNo: { contains: filter.search } },
        { phone: { contains: filter.search } },
        { email: { contains: filter.search } },
      ];
    }

    return prisma.lead.findMany({
      where,
      include: {
        convertedClient: true,
        opportunities: {
          select: { id: true, opportunityNo: true, name: true, stage: true, estimatedContractValue: true },
        },
        _count: { select: { activities: true, opportunities: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getLeadById(id: string) {
    return prisma.lead.findUnique({
      where: { id },
      include: {
        convertedClient: true,
        activities: { orderBy: { scheduledAt: "desc" } },
        opportunities: {
          include: {
            estimates: { select: { id: true, estimateNo: true, version: true, status: true, totalEstimatedCost: true } },
            quotations: { select: { id: true, quotationNo: true, version: true, status: true, total: true } },
          },
        },
      },
    });
  }

  static async createLead(data: CreateLeadDto) {
    const count = await prisma.lead.count();
    const leadNo = `LEAD-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

    return prisma.lead.create({
      data: {
        leadNo,
        companyName: data.companyName,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        source: data.source || "OTHER",
        industry: data.industry,
        province: data.province,
        interest: data.interest,
        estimatedValue: data.estimatedValue,
        ownerId: data.ownerId || "SYS_SALES",
        status: "NEW",
        notes: data.notes,
      },
    });
  }

  static async updateLead(id: string, data: Partial<CreateLeadDto> & { status?: string }) {
    return prisma.lead.update({
      where: { id },
      data,
    });
  }

  /**
   * Convert Lead to Client (Idempotent)
   * Prevents creating duplicate clients.
   */
  static async convertLeadToClient(leadId: string, performedBy?: string) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { convertedClient: true },
    });

    if (!lead) {
      throw new Error("Lead not found");
    }

    // If already converted, return existing client
    if (lead.convertedClientId && lead.convertedClient) {
      return { client: lead.convertedClient, alreadyConverted: true };
    }

    // Check if client with matching companyName already exists
    let existingClient = await prisma.client.findFirst({
      where: {
        OR: [
          { name: { equals: lead.companyName } },
          { legalName: { equals: lead.companyName } },
        ],
      },
    });

    let client = existingClient;
    if (!client) {
      const clientCount = await prisma.client.count();
      const code = `CL-${String(clientCount + 1).padStart(4, "0")}`;

      client = await prisma.client.create({
        data: {
          code,
          name: lead.companyName,
          contactName: lead.contactName,
          contactPhone: lead.phone,
          contactEmail: lead.email,
          status: "ACTIVE",
        },
      });
    }

    // Update lead status
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: "CONVERTED",
        convertedClientId: client.id,
      },
    });

    // Record activity
    await prisma.cRMActivity.create({
      data: {
        leadId,
        clientId: client.id,
        type: "NOTE",
        subject: "Lead Converted to Client",
        description: `Lead ${lead.leadNo} converted to Client ${client.code} (${client.name})`,
        scheduledAt: new Date(),
        completedAt: new Date(),
        ownerId: performedBy || lead.ownerId || "SYS_SALES",
        status: "COMPLETED",
      },
    });

    return { client, alreadyConverted: false };
  }
}
