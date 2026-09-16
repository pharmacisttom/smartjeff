import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "ออกจากระบบเรียบร้อยแล้ว" });
  response.cookies.delete("smarto_session");
  return response;
}
