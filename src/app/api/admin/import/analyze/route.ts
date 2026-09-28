import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-jwt";
import { prisma } from "@/lib/prisma";
import { analyzeWorkbook, IMPORT_TYPES, validateImportFile } from "@/lib/import/excel";

const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) { attempts.set(key, { count: 1, resetAt: now + 60_000 }); return false; }
  entry.count++;
  return entry.count > 10;
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["SUPERADMIN", "ADMIN", "HR", "PAYROLL"]);
  if ("error" in auth) return auth.error;
  const requester = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || auth.session.sub;
  if (rateLimited(requester)) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many import analysis requests." } }, { status: 429 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    const importType = String(form.get("importType") || "");
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: { code: "FILE_REQUIRED", message: "An .xlsx file is required." } }, { status: 400 });
    if (!IMPORT_TYPES.includes(importType as typeof IMPORT_TYPES[number])) return NextResponse.json({ success: false, error: { code: "INVALID_IMPORT_TYPE", message: "Select a supported import type." } }, { status: 400 });
    validateImportFile(file.name, file.size);
    const analysis = analyzeWorkbook(Buffer.from(await file.arrayBuffer()));
    const totalRows = analysis.sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0);
    const job = await prisma.importJob.upsert({
      where: { fileHash_importType: { fileHash: analysis.fileHash, importType } },
      update: { fileName: file.name, status: "ANALYZING", totalRows },
      create: { fileName: file.name, fileHash: analysis.fileHash, importType, status: "ANALYZING", uploadedById: auth.session.sub, totalRows },
      select: { id: true, status: true, createdAt: true },
    });
    await prisma.auditLog.create({ data: { userId: auth.session.sub, action: "IMPORT_UPLOADED", entity: "ImportJob", entityId: job.id, metadata: JSON.stringify({ importType, sheetCount: analysis.sheets.length, totalRows }) } });
    return NextResponse.json({ success: true, job, analysis: { sheets: analysis.sheets } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workbook analysis failed.";
    return NextResponse.json({ success: false, error: { code: "IMPORT_ANALYSIS_FAILED", message } }, { status: 400 });
  }
}
