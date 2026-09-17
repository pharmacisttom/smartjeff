import { NextResponse } from "next/server";
import { sloService } from "@/server/platform/slo/slo.service";

export async function GET() {
  const slos = await sloService.getSlos();
  return NextResponse.json({ slos });
}
