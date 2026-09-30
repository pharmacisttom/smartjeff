import { NextRequest, NextResponse } from "next/server";
import { suggestPlacesLongdo } from "@/lib/longdo/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword") || searchParams.get("q") || "";
    const limitStr = searchParams.get("limit");

    if (!keyword.trim()) {
      return NextResponse.json({ suggestions: [] });
    }

    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const suggestions = await suggestPlacesLongdo(keyword, limit);
    return NextResponse.json({ suggestions });
  } catch (err: any) {
    return NextResponse.json({ suggestions: [] });
  }
}
