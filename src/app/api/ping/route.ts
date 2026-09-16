import { NextResponse } from "next/server";

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}

export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
