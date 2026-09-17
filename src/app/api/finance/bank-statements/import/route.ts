import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { BankStatementImportService } from "@/server/services/finance/bank-statement-import.service";

export const dynamic = "force-dynamic";

const FINANCE_ROLES = ["ADMIN", "SUPERADMIN", "TREASURY", "FINANCE_MANAGER", "EXECUTIVE"];

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    const userId = user?.id || "admin-id";
    const userRole = (user?.role || "ADMIN").toUpperCase();

    if (user && !FINANCE_ROLES.includes(userRole)) {
      return NextResponse.json(
        { success: false, error: "Access denied. Treasury or Finance role required." },
        { status: 403 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let financialAccountId = "";
    let fileName = "statement.csv";
    let fileType: "CSV" | "XLSX" = "CSV";
    let bufferOrContent: Buffer | string = "";
    let isPreview = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      financialAccountId = (formData.get("financialAccountId") as string) || "";
      isPreview = formData.get("preview") === "true";
      const file = formData.get("file") as File;
      if (!file) {
        return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
      }
      fileName = file.name;
      fileType = fileName.endsWith(".xlsx") || fileName.endsWith(".xls") ? "XLSX" : "CSV";
      const arrayBuffer = await file.arrayBuffer();
      bufferOrContent = Buffer.from(arrayBuffer);
    } else {
      const body = await req.json();
      financialAccountId = body.financialAccountId;
      isPreview = !!body.preview;
      fileName = body.fileName || "statement.csv";
      fileType = body.sourceType === "XLSX" || fileName.endsWith(".xlsx") ? "XLSX" : "CSV";
      bufferOrContent = body.fileContent
        ? Buffer.from(body.fileContent, body.isBase64 ? "base64" : "utf-8")
        : body.csvText || "";
    }

    if (!financialAccountId) {
      return NextResponse.json(
        { success: false, error: "financialAccountId is required" },
        { status: 400 }
      );
    }

    if (isPreview) {
      const preview = await BankStatementImportService.previewStatement(
        bufferOrContent,
        fileType,
        financialAccountId
      );
      return NextResponse.json({ success: true, preview });
    }

    const result = await BankStatementImportService.importStatement({
      financialAccountId,
      fileName,
      sourceType: fileType,
      bufferOrContent,
      importedBy: userId,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Statement import error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to import bank statement" },
      { status: 500 }
    );
  }
}
