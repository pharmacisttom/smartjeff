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
    lat?: number | null;
    lng?: number | null;
    radius?: number;
    workStart?: number;
    workEnd?: number;
    otStart?: number;
    otEnd?: number;
    minimumWorkforce?: number | null;
    requiresSupervisor?: boolean;
  }) {
    return prisma.site.create({
      data: {
        code: data.code,
        name: data.name,
        location: data.location || null,
        lat: data.lat || null,
        lng: data.lng || null,
        radius: data.radius || 200,
        workStart: data.workStart || 7,
        workEnd: data.workEnd || 16,
        otStart: data.otStart || 16,
        otEnd: data.otEnd || 17,
        minimumWorkforce: data.minimumWorkforce !== undefined ? data.minimumWorkforce : 1,
        requiresSupervisor: data.requiresSupervisor !== undefined ? Boolean(data.requiresSupervisor) : false,
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
        lat: data.lat !== undefined ? parseFloat(data.lat) : undefined,
        lng: data.lng !== undefined ? parseFloat(data.lng) : undefined,
        radius: data.radius !== undefined ? parseInt(data.radius) : undefined,
        workStart: data.workStart !== undefined ? parseFloat(data.workStart) : undefined,
        workEnd: data.workEnd !== undefined ? parseFloat(data.workEnd) : undefined,
        otStart: data.otStart !== undefined ? parseFloat(data.otStart) : undefined,
        otEnd: data.otEnd !== undefined ? parseFloat(data.otEnd) : undefined,
        minimumWorkforce: data.minimumWorkforce !== undefined ? (data.minimumWorkforce ? parseInt(data.minimumWorkforce) : null) : undefined,
        requiresSupervisor: data.requiresSupervisor !== undefined ? Boolean(data.requiresSupervisor) : undefined,
      },
    });
  }

  static async delete(id: string) {
    return prisma.site.delete({ where: { id } });
  }
}
