import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const siteCoordinates: Record<string, { lat: number; lng: number; radius: number; location?: string }> = {
  // WHA Eastern Seaboard / Hemaraj Rayong (Pluak Daeng)
  AAM: { lat: 13.0039, lng: 101.1668, radius: 250, location: "นิคมอุตสาหกรรมเหมราช อีสเทิร์นซีบอร์ด ระยอง" },
  BAT: { lat: 12.9961, lng: 101.1712, radius: 200, location: "นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด (ระยอง)" },
  BW: { lat: 13.0012, lng: 101.1645, radius: 200, location: "นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด (ระยอง)" },
  CATALER: { lat: 12.9945, lng: 101.1589, radius: 200, location: "นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด (ระยอง)" },
  DOWA: { lat: 13.0078, lng: 101.1623, radius: 200, location: "นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด (ระยอง)" },
  FTS1: { lat: 13.0055, lng: 101.1590, radius: 200, location: "นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด (ระยอง)" },
  FTS2: { lat: 13.0062, lng: 101.1605, radius: 200, location: "นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด (ระยอง)" },
  JATH: { lat: 12.9989, lng: 101.1734, radius: 200, location: "นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด (ระยอง)" },
  MISUMI: { lat: 13.0025, lng: 101.1610, radius: 250, location: "นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด (ระยอง)" },
  MTAT: { lat: 12.9970, lng: 101.1680, radius: 200, location: "นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด (ระยอง)" },
  NSA: { lat: 13.0090, lng: 101.1550, radius: 200, location: "นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด (ระยอง)" },
  SFT: { lat: 13.0110, lng: 101.1580, radius: 200, location: "นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด (ระยอง)" },
  SSMC1: { lat: 13.0080, lng: 101.1565, radius: 200, location: "นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด (ระยอง)" },
  SSMC2: { lat: 13.0088, lng: 101.1575, radius: 200, location: "นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด (ระยอง)" },
  MISUBISHI: { lat: 12.9930, lng: 101.1640, radius: 200, location: "นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด (ระยอง)" },
  "NS-OG(SPT)": { lat: 12.9950, lng: 101.1700, radius: 200, location: "นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด (ระยอง)" },
  SYC: { lat: 12.9950, lng: 101.1700, radius: 200, location: "นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด (ระยอง)" },
  TFI: { lat: 13.0125, lng: 101.1750, radius: 200, location: "นิคมอุตสาหกรรมเหมราช อีสเทิร์นซีบอร์ด" },
  TNT: { lat: 13.0140, lng: 101.1690, radius: 200, location: "นิคมอุตสาหกรรมดับบลิวเอชเอ อีสเทิร์นซีบอร์ด 1" },
  BRUCKNER: { lat: 13.0130, lng: 101.1720, radius: 200, location: "นิคมอุตสาหกรรมดับบลิวเอชเอ อีสเทิร์นซีบอร์ด 1" },
  CHIKUMA: { lat: 13.0115, lng: 101.1685, radius: 200, location: "นิคมอุตสาหกรรมดับบลิวเอชเอ อีสเทิร์นซีบอร์ด 1" },
  "SHRED TECH": { lat: 13.0645, lng: 101.1128, radius: 200, location: "นิคมอุตสาหกรรมดับบลิวเอชเอ ชลบุรี 1" },

  // Amata City Rayong
  "ABPR1,2": { lat: 12.9750, lng: 101.1350, radius: 250, location: "นิคมอุตสาหกรรมอมตะซิตี้ ระยอง" },
  "ABPR3,4": { lat: 12.9765, lng: 101.1370, radius: 250, location: "นิคมอุตสาหกรรมอมตะซิตี้ ระยอง" },
  ABPR5: { lat: 12.9780, lng: 101.1390, radius: 250, location: "นิคมอุตสาหกรรมอมตะซิตี้ ระยอง" },
  "NS-OG(YRT)": { lat: 12.9733, lng: 101.1275, radius: 200, location: "นิคมอุตสาหกรรมอมตะซิตี้ ระยอง" },
  STDI: { lat: 12.9710, lng: 101.1290, radius: 200, location: "นิคมอุตสาหกรรมอมตะซิตี้ ระยอง" },

  // Pinthong Industrial Estates (Sriracha)
  NIKKO: { lat: 13.1118, lng: 101.0772, radius: 200, location: "นิคมอุตสาหกรรมปิ่นทอง 4 ศรีราชา ชลบุรี" },
  KYT: { lat: 13.1274, lng: 101.1098, radius: 200, location: "นิคมอุตสาหกรรมปิ่นทอง 5 ศรีราชา ชลบุรี" },

  // Laem Chabang Port & Industrial Estate (Chonburi)
  "LCIT B5": { lat: 13.0827, lng: 100.8845, radius: 300, location: "ท่าเรือแหลมฉบัง ท่าเทียบเรือ B5 ชลบุรี" },
  "LCIT C3": { lat: 13.0840, lng: 100.8860, radius: 300, location: "ท่าเรือแหลมฉบัง ท่าเทียบเรือ C3 ชลบุรี" },
  LCTH: { lat: 13.0789, lng: 100.8920, radius: 250, location: "แหลมฉบัง ชลบุรี" },
  TIPS: { lat: 13.0855, lng: 100.8870, radius: 300, location: "ท่าเรือแหลมฉบัง ท่าเทียบเรือ B4 ชลบุรี" },

  // Pluak Daeng & Wang Ta Phin
  LSTH: { lat: 12.9654, lng: 101.1689, radius: 250, location: "คลังสินค้า WHA วังตาผิน ปลวกแดง ระยอง" },
  "J2K-HQ": { lat: 12.9734, lng: 101.2155, radius: 300, location: "235 หมู่ที่ 4 ตำบลปลวกแดง อำเภอปลวกแดง จังหวัดระยอง 21140" },
};

async function main() {
  console.log("Updating site GPS coordinates in MySQL database...");
  let count = 0;

  for (const [code, geo] of Object.entries(siteCoordinates)) {
    const updated = await prisma.site.updateMany({
      where: { code },
      data: {
        lat: geo.lat,
        lng: geo.lng,
        radius: geo.radius,
        location: geo.location,
      },
    });
    if (updated.count > 0) {
      count += updated.count;
      console.log(`  ✓ Updated ${code} -> (${geo.lat}, ${geo.lng}, r=${geo.radius}m)`);
    }
  }

  console.log(`\n🎉 Successfully updated GPS coordinates for ${count} sites!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
