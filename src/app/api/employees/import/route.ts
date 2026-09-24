import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { AuthorizationService } from "@/server/services/authorization.service";

function parseExcelDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val;
  }
  if (typeof val === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return new Date(Date.UTC(d.y, d.m - 1, d.d));
  }
  if (typeof val === "string") {
    const s = val.trim();
    // Try YYYY-MM-DD
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
      const parts = s.split("-");
      return new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
    }
    // Try DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
      const parts = s.split("/");
      let year = parseInt(parts[2]);
      if (year > 2500) year -= 543; // Buddhist era to CE
      return new Date(Date.UTC(year, parseInt(parts[1]) - 1, parseInt(parts[0])));
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function normalizePhone(val: any): string | null {
  if (!val) return null;
  let pStr = String(val).trim().replace(/[\s-]/g, "");
  if (/^\d{8,9}$/.test(pStr) && !pStr.startsWith("0")) {
    pStr = "0" + pStr;
  }
  if (pStr.length === 10) {
    return `${pStr.slice(0, 3)}-${pStr.slice(3, 6)}-${pStr.slice(6)}`;
  }
  if (pStr.length === 9) {
    return `${pStr.slice(0, 3)}-${pStr.slice(3, 6)}-${pStr.slice(6)}`;
  }
  return String(val).trim();
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });
    }

    const authResult = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "employee.create",
    });

    if (!authResult.allowed) {
      return NextResponse.json({ message: "คุณไม่มีสิทธิ์นำเข้าข้อมูลพนักงาน" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const updateDuplicates = formData.get("updateDuplicates") === "true";

    if (!file) {
      return NextResponse.json({ message: "กรุณาแนบไฟล์ Excel (.xlsx หรือ .xls)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });

    // Use first sheet or named sheet
    const sheetName = wb.SheetNames.find((s) => s.includes("รายชื่อ") || s.includes("Employee")) || wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      return NextResponse.json({ message: "ไม่พบชีตข้อมูลพนักงานในไฟล์" }, { status: 400 });
    }

    const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
    if (!rawRows || rawRows.length < 2) {
      return NextResponse.json({ message: "ไฟล์ Excel ไม่มีแถวข้อมูลสำหรับนำเข้า" }, { status: 400 });
    }

    // Find header index
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
      const rowStr = (rawRows[i] || []).join(" ");
      if (rowStr.includes("รหัส") || rowStr.includes("Code") || rowStr.includes("ชื่อ")) {
        headerRowIdx = i;
        break;
      }
    }

    if (headerRowIdx === -1) {
      return NextResponse.json({ message: "ไม่พบหัวตารางที่ถูกต้องในไฟล์ Excel" }, { status: 400 });
    }

    // Map sites into lookup map (by code uppercase and by name)
    const allSites = await prisma.site.findMany();
    const siteMap = new Map<string, string>();
    allSites.forEach((s) => {
      siteMap.set(s.code.trim().toUpperCase(), s.id);
      siteMap.set(s.name.trim().toLowerCase(), s.id);
    });

    const defaultSiteId = allSites[0]?.id;

    const dataRows = rawRows.slice(headerRowIdx + 1);
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: { row: number; code?: string; name?: string; reason: string }[] = [];

    for (let idx = 0; idx < dataRows.length; idx++) {
      const r = dataRows[idx];
      const rowNum = headerRowIdx + idx + 2;

      if (!r || r.length === 0 || !r.some((c) => c !== null && c !== undefined && String(c).trim() !== "")) {
        continue; // Skip empty rows
      }

      const rawCode = r[0] ? String(r[0]).trim() : "";
      const rawPrefix = r[1] ? String(r[1]).trim() : null;
      const rawFirstName = r[2] ? String(r[2]).trim() : "";
      const rawLastName = r[3] ? String(r[3]).trim() : "";
      const rawNationality = r[4] ? String(r[4]).trim() : "ไทย";
      const rawPhone = r[5];
      const rawIdCard = r[6] ? String(r[6]).trim() : null;
      const rawBirthDate = r[7];
      const rawStartDate = r[8];
      const rawGender = r[9] ? String(r[9]).trim() : "ชาย";
      const rawSite = r[10] ? String(r[10]).trim() : "";
      const rawPosition = r[11] ? String(r[11]).trim() : "พนักงานบริการทั่วไป";
      const rawSalaryType = r[12] ? String(r[12]).trim() : "รายเดือน";
      const rawBaseSalary = r[13];
      const rawDailyRate = r[14];
      const rawInsurance = r[15] ? String(r[15]).trim() : null;
      const rawHospital = r[16] ? String(r[16]).trim() : null;
      const rawBankName = r[17] ? String(r[17]).trim() : null;
      const rawBankAccount = r[18] ? String(r[18]).trim() : null;
      const rawEducation = r[19] ? String(r[19]).trim() : null;
      const rawHometown = r[20] ? String(r[20]).trim() : null;

      // Validation
      if (!rawCode) {
        errors.push({ row: rowNum, reason: "ไม่มีรหัสพนักงาน (เว้นว่าง)" });
        continue;
      }
      if (!rawFirstName) {
        errors.push({ row: rowNum, code: rawCode, reason: "ไม่มีชื่อพนักงาน" });
        continue;
      }

      // Resolve Site
      let targetSiteId = siteMap.get(rawSite.toUpperCase()) || siteMap.get(rawSite.toLowerCase());
      if (!targetSiteId) {
        // Try substring match with allSites
        const matched = allSites.find(
          (s) =>
            s.code.toUpperCase().includes(rawSite.toUpperCase()) ||
            s.name.toLowerCase().includes(rawSite.toLowerCase())
        );
        targetSiteId = matched ? matched.id : defaultSiteId;
      }

      if (!targetSiteId) {
        errors.push({ row: rowNum, code: rawCode, reason: "ไม่พบไซต์งานในระบบ" });
        continue;
      }

      // Resolve Phone
      const phone = normalizePhone(rawPhone);

      // Resolve Gender
      const gender =
        rawGender.toLowerCase().includes("หญิง") ||
        rawGender.toLowerCase().includes("female") ||
        rawGender.toLowerCase() === "f"
          ? "FEMALE"
          : "MALE";

      // Resolve Salary Type & Amounts
      const isDaily =
        rawSalaryType.includes("วัน") ||
        rawSalaryType.toUpperCase().includes("DAILY");
      const salaryType = isDaily ? "DAILY" : "MONTHLY";
      const baseSalary = parseFloat(String(rawBaseSalary || 0).replace(/,/g, "")) || (isDaily ? 0 : 12000);
      const dailyRate = parseFloat(String(rawDailyRate || 0).replace(/,/g, "")) || (isDaily ? 400 : 0);

      // Resolve Dates
      const birthDate = parseExcelDate(rawBirthDate);
      const startDate = parseExcelDate(rawStartDate);

      try {
        const existing = await prisma.employee.findUnique({
          where: { code: rawCode },
        });

        if (existing) {
          if (!updateDuplicates) {
            skippedCount++;
            continue;
          }

          // Update existing
          await prisma.employee.update({
            where: { id: existing.id },
            data: {
              prefix: rawPrefix || existing.prefix,
              firstName: rawFirstName,
              lastName: rawLastName,
              position: rawPosition || existing.position,
              siteId: targetSiteId,
              gender,
              nationality: rawNationality,
              idCardNo: rawIdCard || existing.idCardNo,
              phone: phone || existing.phone,
              birthDate: birthDate || existing.birthDate,
              startDate: startDate || existing.startDate,
              salaryType,
              baseSalary,
              dailyRate,
              insurance: rawInsurance || existing.insurance,
              hospital: rawHospital || existing.hospital,
              bankName: rawBankName || existing.bankName,
              bankAccount: rawBankAccount || existing.bankAccount,
              education: rawEducation || existing.education,
              hometown: rawHometown || existing.hometown,
            },
          });
          updatedCount++;
        } else {
          // Create new
          await prisma.employee.create({
            data: {
              code: rawCode,
              prefix: rawPrefix,
              firstName: rawFirstName,
              lastName: rawLastName,
              position: rawPosition,
              siteId: targetSiteId,
              gender,
              nationality: rawNationality,
              idCardNo: rawIdCard,
              phone,
              birthDate,
              startDate,
              salaryType,
              baseSalary,
              dailyRate,
              insurance: rawInsurance,
              hospital: rawHospital,
              bankName: rawBankName,
              bankAccount: rawBankAccount,
              education: rawEducation,
              hometown: rawHometown,
              isActive: true,
            },
          });
          createdCount++;
        }
      } catch (err: any) {
        errors.push({
          row: rowNum,
          code: rawCode,
          name: `${rawFirstName} ${rawLastName}`,
          reason: err.message || "เกิดข้อผิดพลาดในการบันทึก",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `นำเข้าข้อมูลเรียบร้อยแล้ว: เพิ่มใหม่ ${createdCount} คน, อัปเดต ${updatedCount} คน, ข้าม ${skippedCount} คน`,
      summary: {
        totalRows: dataRows.length,
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount,
        errorCount: errors.length,
        errors: errors.slice(0, 50),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการประมวลผลไฟล์", error: error.message },
      { status: 500 }
    );
  }
}
