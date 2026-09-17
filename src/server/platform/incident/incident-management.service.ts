import { prisma } from "@/lib/prisma";
import { platformLogger } from "../logging/structured-logger";

export interface CreateIncidentInput {
  title: string;
  service?: string;
  severity?: "SEV1" | "SEV2" | "SEV3" | "SEV4";
  type?: "OUTAGE" | "PERFORMANCE" | "DATABASE" | "STORAGE" | "NETWORK" | "DEPLOYMENT" | "SECURITY" | "OTHER";
  commander?: string;
  impactSummary?: string;
  rootCause?: string;
}

export class IncidentManagementService {
  public async createIncident(input: CreateIncidentInput) {
    const count = await prisma.platformIncident.count();
    const incidentNumber = `INC-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const timeline = [
      {
        timestamp: new Date().toISOString(),
        actor: input.commander || "SRE On-Call",
        event: "Incident declared and commander assigned",
      },
    ];

    const record = await prisma.platformIncident.create({
      data: {
        incidentNumber,
        title: input.title,
        service: input.service || "WEB",
        severity: input.severity || "SEV3",
        type: input.type || "OUTAGE",
        status: "OPEN",
        commander: input.commander || "SRE Lead",
        impactSummary: input.impactSummary,
        rootCause: input.rootCause,
        timelineJson: JSON.stringify(timeline),
      },
    });

    platformLogger.warn(`Platform Incident Created: [${record.severity}] ${record.incidentNumber} - ${record.title}`);
    return record;
  }

  public async updateIncidentStatus(
    id: string,
    params: {
      status: "OPEN" | "INVESTIGATING" | "MITIGATED" | "RESOLVED" | "POSTMORTEM";
      actor?: string;
      note?: string;
      rootCause?: string;
      impactSummary?: string;
    }
  ) {
    const incident = await prisma.platformIncident.findUnique({ where: { id } });
    if (!incident) throw new Error(`Incident ${id} not found`);

    let timeline = [];
    if (incident.timelineJson) {
      try {
        timeline = JSON.parse(incident.timelineJson);
      } catch {
        timeline = [];
      }
    }

    timeline.push({
      timestamp: new Date().toISOString(),
      actor: params.actor || "Operator",
      event: `Status changed to ${params.status}: ${params.note || ""}`,
    });

    const updateData: any = {
      status: params.status,
      timelineJson: JSON.stringify(timeline),
      rootCause: params.rootCause || incident.rootCause,
      impactSummary: params.impactSummary || incident.impactSummary,
    };

    if (params.status === "INVESTIGATING" && !incident.acknowledgedAt) {
      updateData.acknowledgedAt = new Date();
    } else if (params.status === "MITIGATED" && !incident.mitigatedAt) {
      updateData.mitigatedAt = new Date();
    } else if (params.status === "RESOLVED" && !incident.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    return prisma.platformIncident.update({
      where: { id },
      data: updateData,
    });
  }

  public async createPostmortem(params: {
    incidentId: string;
    title: string;
    summary: string;
    impact: string;
    timeline: string;
    rootCause: string;
    resolution: string;
    author?: string;
    actionItems?: Array<{ title: string; owner: string; deadline: string }>;
  }) {
    return prisma.postmortem.create({
      data: {
        incidentId: params.incidentId,
        title: params.title,
        summary: params.summary,
        impact: params.impact,
        timeline: params.timeline,
        rootCause: params.rootCause,
        resolution: params.resolution,
        author: params.author || "SRE Commander",
        actionItemsJson: params.actionItems ? JSON.stringify(params.actionItems) : null,
        publishedAt: new Date(),
      },
    });
  }

  public async getIncidents(limit = 20) {
    return prisma.platformIncident.findMany({
      orderBy: { detectedAt: "desc" },
      take: limit,
      include: {
        postmortems: true,
      },
    });
  }
}

export const incidentManagementService = new IncidentManagementService();
