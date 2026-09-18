import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    // 0. Ensure Default Site exists for employee check-in
    let defaultSite = await prisma.site.findFirst();
    if (!defaultSite) {
      defaultSite = await prisma.site.create({
        data: {
          code: "AAM",
          name: "บริษัท เอเอเอ็ม อินดัสเตรียล จำกัด",
          location: "นิคมอุตสาหกรรมมาบตาพุด ระยอง",
          lat: 12.6841,
          lng: 101.1476,
          radius: 500,
          workStart: 7,
          workEnd: 16,
          otStart: 16,
          otEnd: 17,
        },
      });
      console.log(`Default Site created: ${defaultSite.name} (${defaultSite.code})`);
    } else {
      console.log(`Using existing Site: ${defaultSite.name} (${defaultSite.code})`);
    }

    // 1. admin
    const adminUsername = "admin";
    const adminPassword = "Smartjeffy2026";
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    
    await prisma.user.upsert({
      where: { email: adminUsername },
      update: {
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        isActive: true,
        isLocked: false,
        mfaEnabled: false,
      },
      create: {
        email: adminUsername,
        displayName: "Admin",
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        isActive: true,
        isLocked: false,
        mfaEnabled: false,
      },
    });
    console.log(`Admin updated (U: ${adminUsername}, P: ${adminPassword})`);

    // 2. Ensure Employee record for star exists
    let starEmp = await prisma.employee.findUnique({
      where: { code: "EMP-STAR" },
    });
    if (!starEmp) {
      starEmp = await prisma.employee.create({
        data: {
          code: "EMP-STAR",
          prefix: "นางสาว",
          firstName: "สุวิมล",
          lastName: "แสงดาว",
          position: "พนักงานบริการความสะอาด",
          siteId: defaultSite.id,
          phone: "0812345678",
          gender: "FEMALE",
          salaryType: "DAILY",
          dailyRate: 400,
          baseSalary: 12000,
          isActive: true,
        },
      });
      console.log(`Employee profile created for star: ${starEmp.firstName} ${starEmp.lastName}`);
    } else {
      console.log(`Using existing employee profile for star: ${starEmp.firstName} ${starEmp.lastName}`);
    }

    // 3. user star
    const userUsername = "star";
    const userPassword = "@123456789";
    const userPasswordHash = await bcrypt.hash(userPassword, 10);
    
    await prisma.user.upsert({
      where: { email: userUsername },
      update: {
        passwordHash: userPasswordHash,
        role: "EMPLOYEE",
        displayName: "สุวิมล แสงดาว",
        employeeId: starEmp.id,
        isActive: true,
        isLocked: false,
        mfaEnabled: false,
      },
      create: {
        email: userUsername,
        displayName: "สุวิมล แสงดาว",
        passwordHash: userPasswordHash,
        role: "EMPLOYEE",
        employeeId: starEmp.id,
        isActive: true,
        isLocked: false,
        mfaEnabled: false,
      },
    });
    console.log(`User updated (U: ${userUsername}, P: ${userPassword}, Linked Employee: ${starEmp.code})`);

  } catch (error) {
    console.error("Error setting up users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
