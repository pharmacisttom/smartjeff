import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { AuthorizationService } from "@/server/services/authorization.service";
import { SessionSerializer } from "@/lib/serializers/session.serializer";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const auth = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "security.session.manage",
    });
    if (!auth.allowed) return NextResponse.json({ message: auth.reason }, { status: 403 });

    const sessions = await prisma.userSession.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            type: true,
            roleAssignments: {
              where: { status: "ACTIVE" },
              include: { role: { select: { code: true, nameTh: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const serializedSessions = SessionSerializer.serializeMany(sessions);

    return NextResponse.json({ sessions: serializedSessions });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
