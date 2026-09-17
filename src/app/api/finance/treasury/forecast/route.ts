import { NextResponse } from "next/server";
import { TreasuryForecastService } from "@/server/services/finance/treasury-forecast.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "13-week"; // "13-week" | "30-day" | "calendar"
    const month = searchParams.get("month") || new Date().toISOString().substring(0, 7);

    if (mode === "30-day") {
      const forecast30 = await TreasuryForecastService.get30DayForecast();
      return NextResponse.json({ success: true, mode: "30-day", ...forecast30 });
    }

    if (mode === "calendar") {
      const calendar = await TreasuryForecastService.getTreasuryCalendar(month);
      return NextResponse.json({ success: true, mode: "calendar", events: calendar });
    }

    const forecast13 = await TreasuryForecastService.get13WeekForecast();
    return NextResponse.json({ success: true, mode: "13-week", ...forecast13 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch treasury forecast" },
      { status: 500 }
    );
  }
}
