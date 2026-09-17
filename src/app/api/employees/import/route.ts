import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-jwt";
import { parseEmployeeRows } from "@/lib/employee/import";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["SUPERADMIN", "ADMIN", "HR"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const templateHeaders = [
  "รหัสพนักงาน", "คำนำหน้า", "ชื่อ", "นามสกุล", "ตำแหน่ง", "รหัสไซต์",
  "วันที่เริ่มงาน", "วันเกิด", "เพศ", "สัญชาติ", "เลขบัตรประชาชน",
  "เบอร์โทรศัพท์", "เลขบัญชีธนาคาร", "ธนาคาร", "สิทธิการรักษา",
  "โรงพยาบาล", "การศึกษา", "ภูมิลำเนา", "ประเภทค่าจ้าง", "เงินเดือน", "ค่าแรงรายวัน",
];

export async function GET(req: NextRequest) {
  const auth = requireRole(req, ALLOWED_ROLES);
  if ("error" in auth) return auth.error;

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([
    templateHeaders,
    ["EMP001", "นาย", "สมชาย", "ใจดี", "พนักงาน", "AAM", "2026-01-15", "1990-05-20", "ชาย", "ไทย", "1101700203450", "0812345678", "", "", "", "", "", "", "MONTHLY", 12000, 400],
  ]);
  worksheet["!cols"] = templateHeaders.map((header) => ({ wch: Math.max(header.length + 4, 14) }));
  XLSX.utils.book_append_sheet(workbook, worksheet, "พนักงาน");
  const output = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(output, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="employee-import-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, ALLOWED_ROLES);
  if ("error" in auth) return auth.error;

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "กรุณาเลือกไฟล์ Excel" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: "ไฟล์ต้องมีขนาดไม่เกิน 10 MB" }, { status: 400 });
    }
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      return NextResponse.json({ message: "รองรับเฉพาะไฟล์ .xlsx และ .xls" }, { status: 400 });
    }

    const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer", cellDates: true });
    const preferredSheet = workbook.SheetNames.find((name) => name.includes("ประวัติพนักงาน")) || workbook.SheetNames[0];
    if (!preferredSheet) return NextResponse.json({ message: "ไม่พบ worksheet ในไฟล์" }, { status: 400 });

    const sourceRows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[preferredSheet], {
      header: 1,
      raw: false,
      defval: "",
    });
    const parsed = parseEmployeeRows(sourceRows);
    if (parsed.errors.length) {
      return NextResponse.json({
        message: `พบข้อมูลไม่ถูกต้อง ${parsed.errors.length} รายการ กรุณาแก้ไขก่อนนำเข้า`,
        sheet: preferredSheet,
        validRows: parsed.rows.length,
        errors: parsed.errors.slice(0, 100),
      }, { status: 422 });
    }
    if (!parsed.rows.length) {
      return NextResponse.json({ message: "ไม่พบข้อมูลพนักงานในไฟล์" }, { status: 400 });
    }

    const salarySheetName = workbook.SheetNames.find((name) => name.trim() === "เงินเดือน");
    if (salarySheetName) {
      const salaryRows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[salarySheetName], { header: 1, raw: false, defval: "" });
      const salaryHeaderIndex = salaryRows.findIndex((row) => row.some((cell) => String(cell).trim() === "รหัส") && row.some((cell) => String(cell).trim() === "รายเดือน"));
      if (salaryHeaderIndex >= 0) {
        const header = salaryRows[salaryHeaderIndex].map((cell) => String(cell).trim());
        const codeIndex = header.indexOf("รหัส");
        const monthlyIndex = header.indexOf("รายเดือน");
        const dailyIndex = header.indexOf("รายวัน");
        const salaryByCode = new Map<string, { monthly: number; daily: number }>();
        salaryRows.slice(salaryHeaderIndex + 1).forEach((row) => {
          const code = String(row[codeIndex] ?? "").trim();
          if (!code) return;
          const monthly = Number(String(row[monthlyIndex] ?? "").replace(/,/g, "")) || 0;
          const daily = Number(String(row[dailyIndex] ?? "").replace(/,/g, "")) || 0;
          salaryByCode.set(code, { monthly, daily });
        });
        parsed.rows.forEach((row) => {
          const salary = salaryByCode.get(row.code);
          if (!salary) return;
          if (salary.monthly > 0) {
            row.salaryType = "MONTHLY";
            row.baseSalary = salary.monthly;
          } else if (salary.daily > 0) {
            row.salaryType = "DAILY";
            row.dailyRate = salary.daily;
          }
        });
      }
    }

    const siteCodes = [...new Set(parsed.rows.map((row) => row.siteCode))];
    const sites = await prisma.site.findMany({ where: { code: { in: siteCodes } }, select: { id: true, code: true } });
    const siteByCode = new Map(sites.map((site) => [site.code.toUpperCase(), site.id]));
    const missingSites = siteCodes.filter((code) => !siteByCode.has(code));

    const customerSheetName = workbook.SheetNames.find((name) => name.trim().toLowerCase() === "customer");
    const customerRows = customerSheetName
      ? XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[customerSheetName], { header: 1, raw: false, defval: "" })
      : [];
    const siteDefinitions = new Map<string, string>();
    customerRows.slice(1).forEach((row) => {
      const code = String(row[2] ?? "").trim().toUpperCase();
      const name = String(row[3] ?? row[2] ?? "").trim();
      if (code && name) siteDefinitions.set(code, name);
    });
    const unresolvedSites = missingSites.filter((code) => !siteDefinitions.has(code));
    if (unresolvedSites.length) {
      return NextResponse.json({ message: `ไม่พบข้อมูลไซต์: ${unresolvedSites.join(", ")}`, errors: unresolvedSites.map((code) => ({ row: 0, message: `กรุณาสร้างไซต์รหัส ${code} หรือเพิ่มในชีต Customer` })) }, { status: 422 });
    }

    const codes = parsed.rows.map((row) => row.code);
    const existing = await prisma.employee.findMany({ where: { code: { in: codes } }, select: { code: true } });
    const existingCodes = new Set(existing.map((employee) => employee.code));

    const summary = {
      sheet: preferredSheet,
      total: parsed.rows.length,
      created: parsed.rows.filter((row) => !existingCodes.has(row.code)).length,
      updated: parsed.rows.filter((row) => existingCodes.has(row.code)).length,
      sitesToCreate: missingSites.length,
    };

    if (req.nextUrl.searchParams.get("validateOnly") === "true") {
      return NextResponse.json({ message: "ตรวจสอบไฟล์ผ่าน พร้อมนำเข้า", valid: true, ...summary });
    }

    await prisma.$transaction(async (tx) => {
      for (const code of missingSites) {
        const site = await tx.site.create({ data: { code, name: siteDefinitions.get(code)! } });
        siteByCode.set(code, site.id);
      }

      for (const row of parsed.rows) {
        const data = {
          prefix: row.prefix,
          firstName: row.firstName,
          lastName: row.lastName,
          position: row.position,
          siteId: siteByCode.get(row.siteCode)!,
          startDate: row.startDate,
          birthDate: row.birthDate,
          gender: row.gender,
          nationality: row.nationality,
          idCardNo: row.idCardNo,
          phone: row.phone,
          bankAccount: row.bankAccount,
          bankName: row.bankName,
          insurance: row.insurance,
          hospital: row.hospital,
          education: row.education,
          hometown: row.hometown,
          salaryType: row.salaryType,
          baseSalary: row.baseSalary,
          dailyRate: row.dailyRate,
          isActive: true,
        };
        await tx.employee.upsert({ where: { code: row.code }, update: data, create: { code: row.code, ...data } });
      }
    });

    return NextResponse.json({
      message: `นำเข้าพนักงานสำเร็จ ${parsed.rows.length} รายการ`,
      ...summary,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "ไม่สามารถนำเข้าไฟล์ได้";
    return NextResponse.json({ message }, { status: 500 });
  }
}
