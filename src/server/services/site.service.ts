import { prisma } from "@/lib/prisma";

export class SiteService {
  static async getAll() {
    return prisma.site.findMany({
      include: {
        _count: { select: { employees: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(id: string) {
    return prisma.site.findUnique({
      where: { id },
      include: {
        employees: true,
        config: true,
      },
    });
  }

  static async create(data: {
    code: string;
    name: string;
    location?: string | null;
    estateName?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    lat?: number | null;
    lng?: number | null;
    radius?: number;
    workStart?: number;
    workEnd?: number;
    otStart?: number;
    otEnd?: number;
  }) {
    return prisma.site.create({
      data: {
        code: data.code,
        name: data.name,
        location: data.location || null,
        estateName: data.estateName || null,
        contactName: data.contactName || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        lat: data.lat || null,
        lng: data.lng || null,
        radius: data.radius || 200,
        workStart: data.workStart || 7,
        workEnd: data.workEnd || 16,
        otStart: data.otStart || 16,
        otEnd: data.otEnd || 17,
      },
    });
  }

  static async update(id: string, data: any) {
    return prisma.site.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        location: data.location,
        estateName: data.estateName,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        lat: data.lat !== undefined ? (data.lat === null || data.lat === "" ? null : (isNaN(parseFloat(data.lat)) ? null : parseFloat(data.lat))) : undefined,
        lng: data.lng !== undefined ? (data.lng === null || data.lng === "" ? null : (isNaN(parseFloat(data.lng)) ? null : parseFloat(data.lng))) : undefined,
        radius: data.radius !== undefined ? (data.radius === null || data.radius === "" ? 200 : (isNaN(parseInt(data.radius)) ? 200 : parseInt(data.radius))) : undefined,
        workStart: data.workStart !== undefined ? (data.workStart === null || data.workStart === "" ? 7 : (isNaN(parseFloat(data.workStart)) ? 7 : parseFloat(data.workStart))) : undefined,
        workEnd: data.workEnd !== undefined ? (data.workEnd === null || data.workEnd === "" ? 16 : (isNaN(parseFloat(data.workEnd)) ? 16 : parseFloat(data.workEnd))) : undefined,
        otStart: data.otStart !== undefined ? (data.otStart === null || data.otStart === "" ? null : (isNaN(parseFloat(data.otStart)) ? null : parseFloat(data.otStart))) : undefined,
        otEnd: data.otEnd !== undefined ? (data.otEnd === null || data.otEnd === "" ? null : (isNaN(parseFloat(data.otEnd)) ? null : parseFloat(data.otEnd))) : undefined,
      },
    });
  }

  static async delete(id: string) {
    return prisma.site.delete({ where: { id } });
  }
}
