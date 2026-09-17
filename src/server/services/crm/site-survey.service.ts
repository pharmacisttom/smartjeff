import { prisma } from "@/lib/prisma";

export interface CreateSurveyDto {
  opportunityId: string;
  temporarySiteName: string;
  address: string;
  lat?: number;
  lng?: number;
  surveyDate?: Date;
  surveyedBy: string;
  accessNotes?: string;
  workArea?: string;
  workingHours?: string;
  riskNotes?: string;
  photos?: string[];
  checklistData?: Record<string, any>;
  status?: string;
}

export class SiteSurveyService {
  static async getSurveys(opportunityId?: string) {
    const where: any = {};
    if (opportunityId) where.opportunityId = opportunityId;

    return prisma.siteSurvey.findMany({
      where,
      include: {
        opportunity: {
          select: { id: true, opportunityNo: true, name: true, client: { select: { name: true } } },
        },
      },
      orderBy: { surveyDate: "desc" },
    });
  }

  static async getSurveyById(id: string) {
    return prisma.siteSurvey.findUnique({
      where: { id },
      include: { opportunity: { include: { client: true } } },
    });
  }

  static async createSurvey(data: CreateSurveyDto) {
    return prisma.siteSurvey.create({
      data: {
        opportunityId: data.opportunityId,
        temporarySiteName: data.temporarySiteName,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        surveyDate: data.surveyDate ? new Date(data.surveyDate) : new Date(),
        surveyedBy: data.surveyedBy,
        accessNotes: data.accessNotes,
        workArea: data.workArea,
        workingHours: data.workingHours,
        riskNotes: data.riskNotes,
        photos: data.photos ? JSON.stringify(data.photos) : undefined,
        checklistData: data.checklistData ? JSON.stringify(data.checklistData) : undefined,
        status: data.status || "PLANNED",
      },
    });
  }

  static async updateSurvey(
    id: string,
    data: Partial<CreateSurveyDto> & { status?: string }
  ) {
    return prisma.siteSurvey.update({
      where: { id },
      data: {
        ...data,
        surveyDate: data.surveyDate ? new Date(data.surveyDate) : undefined,
        photos: data.photos ? JSON.stringify(data.photos) : undefined,
        checklistData: data.checklistData ? JSON.stringify(data.checklistData) : undefined,
      },
    });
  }

  static async completeSurvey(id: string, notes?: string, checklist?: Record<string, any>) {
    return prisma.siteSurvey.update({
      where: { id },
      data: {
        status: "COMPLETED",
        accessNotes: notes ? { set: notes } : undefined,
        checklistData: checklist ? JSON.stringify(checklist) : undefined,
      },
    });
  }
}
