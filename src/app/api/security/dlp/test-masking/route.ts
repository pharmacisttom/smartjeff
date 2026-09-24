import { NextResponse } from "next/server";
import { DlpService } from "@/server/services/dlp.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawInput = body.input;

    if (!rawInput) {
      return NextResponse.json({ error: "Input is required" }, { status: 400 });
    }

    if (typeof rawInput === "string") {
      const { sanitized, detectedTypes } = DlpService.sanitizeText(rawInput);
      return NextResponse.json({
        type: "TEXT",
        original: rawInput,
        sanitized,
        detectedTypes,
        isModified: sanitized !== rawInput,
      });
    }

    // Object or JSON
    const sanitizedObj = DlpService.sanitize(rawInput);
    return NextResponse.json({
      type: "OBJECT",
      original: rawInput,
      sanitized: sanitizedObj,
      isModified: JSON.stringify(sanitizedObj) !== JSON.stringify(rawInput),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Masking test failed", details: error.message },
      { status: 500 }
    );
  }
}
