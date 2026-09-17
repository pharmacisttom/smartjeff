import { NextRequest, NextResponse } from "next/server";
import { findNearestCandidates } from "@/lib/geo/haversine";

const mockEmployees = [
  { id: "EMP001", name: "สมศรี สุขใจ", lat: 12.682, lng: 101.173, site: "มาบตาพุด" },
  { id: "EMP002", name: "สมชาย เข็มกลัด", lat: 12.685, lng: 101.178, site: "มาบตาพุด" },
  { id: "EMP003", name: "พัดมา วงค์คำ", lat: 12.981, lng: 101.102, site: "อมตะซิตี้" },
  { id: "EMP004", name: "วิชัย ใจดี", lat: 13.361, lng: 100.982, site: "ชลบุรี" },
  { id: "EMP005", name: "นารี รุ่งเรือง", lat: 12.689, lng: 101.171, site: "มาบตาพุด" },
  { id: "EMP006", name: "สร้อยทอง ดีมาก", lat: 12.978, lng: 101.109, site: "อมตะซิตี้" },
];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") || "12.68");
  const lng = parseFloat(searchParams.get("lng") || "101.17");
  const radius = parseFloat(searchParams.get("radius") || "30000");

  const candidates = findNearestCandidates({ lat, lng }, mockEmployees, radius, 5);

  return NextResponse.json({
    success: true,
    target: { lat, lng },
    candidates,
  });
}
