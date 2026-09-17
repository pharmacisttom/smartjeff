import { NextRequest, NextResponse } from "next/server";
import { DocumentControlService } from "@/server/services/qhse/document-control.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || undefined;
    const status = searchParams.get("status") || undefined;
    const take = parseInt(searchParams.get("take") || "50", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const documents = await DocumentControlService.getDocuments({
      type,
      status,
      take,
      skip,
    });

    return NextResponse.json({ documents });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "UPDATE_STATUS") {
      if (!body.documentId || !body.status || !body.performedBy) {
        return NextResponse.json({ error: "documentId, status, and performedBy are required" }, { status: 400 });
      }
      const updated = await DocumentControlService.updateDocumentStatus(body.documentId, body.status, body.performedBy);
      return NextResponse.json(updated);
    }

    if (body.action === "CREATE_REVISION") {
      if (!body.previousDocId || !body.changeSummary || !body.authorId) {
        return NextResponse.json({ error: "previousDocId, changeSummary, and authorId are required" }, { status: 400 });
      }
      const revision = await DocumentControlService.createRevision(
        body.previousDocId,
        body.changeSummary,
        body.authorId,
        body.newFileUrl
      );
      return NextResponse.json(revision, { status: 201 });
    }

    if (body.action === "ACKNOWLEDGE") {
      if (!body.documentId || !body.employeeId) {
        return NextResponse.json({ error: "documentId and employeeId are required" }, { status: 400 });
      }
      const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
      const ua = req.headers.get("user-agent") || undefined;
      const ack = await DocumentControlService.recordAcknowledgment(body.documentId, body.employeeId, ip, ua);
      return NextResponse.json(ack, { status: 201 });
    }

    if (!body.documentNo || !body.title || !body.ownerId || !body.authorId) {
      return NextResponse.json({ error: "documentNo, title, ownerId, and authorId are required" }, { status: 400 });
    }

    const doc = await DocumentControlService.createDocument({
      documentNo: body.documentNo,
      title: body.title,
      type: body.type,
      ownerId: body.ownerId,
      authorId: body.authorId,
      reviewerId: body.reviewerId,
      approverId: body.approverId,
      fileUrl: body.fileUrl,
      changeSummary: body.changeSummary,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
