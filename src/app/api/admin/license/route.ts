import { NextResponse } from "next/server";
import { LicenseService } from "@/server/services/license.service";

export async function GET() {
  try {
    const info = await LicenseService.getLicenseStatus();
    return NextResponse.json({ license: info });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json({ message: "กรุณาระบุรหัส License Key" }, { status: 400 });
    }

    const result = await LicenseService.renewLicense(key);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
