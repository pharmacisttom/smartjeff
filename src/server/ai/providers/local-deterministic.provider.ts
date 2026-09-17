import { AIProvider, AIGenerateOptions, AIGenerateResult, AIProviderHealth } from "./ai-provider.interface";

export class LocalDeterministicProvider implements AIProvider {
  name = "local-deterministic";

  async generate(prompt: string, options?: AIGenerateOptions): Promise<AIGenerateResult> {
    const startTime = Date.now();
    const evidence = options?.evidenceData || {};
    const tools = options?.toolsUsed || [];

    let text = "";

    // Synthesize based on tool results provided in evidence
    if (tools.includes("getExecutiveDailyBrief")) {
      const b = evidence.getExecutiveDailyBrief || {};
      text = `📊 **สรุปภาพรวมการปฏิบัติการประจำวัน**\n\n` +
        `• **สถานะไซต์งาน**: เปิดปฏิบัติการแล้ว ${b.activeSites || 0} จากทั้งหมด ${b.totalSites || 0} ไซต์ (ไซต์ว่างไม่มีคน ${b.emptySites || 0} ไซต์)\n` +
        `• **กำลังพลที่ปฏิบัติงานจริง**: มีพนักงานกำลังปฏิบัติงาน ${b.totalWorkingEmployees || 0} คน\n` +
        `• **การขาดแคลนกำลังพล**: พบภาวะขาดแคลนรวม ${b.totalDeficitAcrossSites || 0} อัตรา ในไซต์ที่ต้องเฝ้าระวัง\n` +
        (b.criticalSites && b.criticalSites.length > 0
          ? `• **ไซต์ที่ต้องติดตามใกล้ชิด**: ${b.criticalSites.map((c: any) => `${c.name} (ขาด ${c.deficit} คน)`).join(", ")}\n`
          : `• **ความเสี่ยง**: ทุกไซต์มีอัตรากำลังพลอยู่ในเกณฑ์ที่กำหนด\n`) +
        `• **การแจ้งเตือนสำคัญ**: มี Alert ปฏิบัติการที่ยังเปิดอยู่ ${b.keyAlertsCount || 0} รายการ`;
    } else if (tools.includes("runOperationsScenario")) {
      const sc = evidence.runOperationsScenario || {};
      text = `🔮 **ผลการจำลองสถานการณ์ (What-if Simulation)**\n\n` +
        `สำหรับไซต์: **${sc.site?.name || "ไม่ระบุ"}** (วันที่ ${sc.simulationDate || "-"})\n` +
        `• **เปรียบเทียบกำลังพล**: จากเดิมทำงาน ${sc.baseline?.working || 0}/${sc.baseline?.target || 0} คน ปรับเปลี่ยนเป็น ${sc.projected?.working || 0}/${sc.baseline?.target || 0} คน (ขาดแคลน ${sc.projected?.deficit || 0} คน)\n` +
        `• **ระดับความเสี่ยงคาดการณ์**: **${sc.projected?.riskLevel || "LOW"}** (สถานะ: ${sc.projected?.status || "OPTIMAL"})\n` +
        `• **ผลกระทบด้านโอทีและต้นทุน**: คาดการณ์ชั่วโมง OT เพิ่มขึ้น ${sc.impact?.projectedOtHours || 0} ชม. คิดเป็นต้นทุนเพิ่มเติมประมาณ ${Number(sc.impact?.estimatedCostImpactBaht || 0).toLocaleString()} บาท\n` +
        `• **คำอธิบายผลกระทบ**: ${sc.impact?.impactDescription || "-"}\n\n` +
        `📋 **ข้อเสนอแนะเชิงระบบในการรับมือ**:\n` +
        (sc.recommendedActions || []).map((a: string) => `  - ${a}`).join("\n");
    } else if (tools.includes("compareSites")) {
      const cmp = evidence.compareSites || {};
      text = `⚖️ **เปรียบเทียบการปฏิบัติงานระหว่างสองไซต์**\n\n` +
        `1. **${cmp.siteA?.name || "Site A"}**:\n` +
        `   - กำลังคนปฏิบัติงาน: ${cmp.siteA?.working || 0}/${cmp.siteA?.assigned || 0} คน (ขั้นต่ำ ${cmp.siteA?.minimumWorkforce || 0} คน)\n` +
        `   - มาสาย: ${cmp.siteA?.late || 0} คน | ทำ OT: ${cmp.siteA?.ot || 0} คน | หัวหน้างาน: ${cmp.siteA?.supervisorPresent ? "พร้อมปฏิบัติงาน" : "ไม่พบในระบบ"}\n\n` +
        `2. **${cmp.siteB?.name || "Site B"}**:\n` +
        `   - กำลังคนปฏิบัติงาน: ${cmp.siteB?.working || 0}/${cmp.siteB?.assigned || 0} คน (ขั้นต่ำ ${cmp.siteB?.minimumWorkforce || 0} คน)\n` +
        `   - มาสาย: ${cmp.siteB?.late || 0} คน | ทำ OT: ${cmp.siteB?.ot || 0} คน | หัวหน้างาน: ${cmp.siteB?.supervisorPresent ? "พร้อมปฏิบัติงาน" : "ไม่พบในระบบ"}\n\n` +
        `• **ข้อแตกต่างสำคัญ**: ไซต์แรกมีกำลังคนต่างกัน ${Math.abs(cmp.differences?.workingDiff || 0)} คน และชั่วโมง/จำนวน OT ต่างกัน ${Math.abs(cmp.differences?.otDiff || 0)}`;
    } else if (tools.includes("getWorkforceForecast")) {
      const wf = evidence.getWorkforceForecast || {};
      text = `👥 **สรุปการคาดการณ์อัตรากำลังพล (Workforce Forecast)**\n\n` +
        `• ประเมินทั้งหมด: ${wf.totalSites || 0} ไซต์งาน\n` +
        `• ไซต์ที่มีอัตรากำลังคนขาดแคลน (Deficit): **${wf.sitesWithDeficit || 0}** ไซต์\n` +
        `• ไซต์ที่มีกำลังคนส่วนเกิน (Surplus): ${wf.sitesWithSurplus || 0} ไซต์\n` +
        (wf.criticalSites && wf.criticalSites.length > 0
          ? `• **ไซต์ที่มีความเสี่ยงสูง/วิกฤต**: \n` +
            wf.criticalSites.map((s: any) => `  - **${s.name}**: ต้องการ ${s.target} คน ขาดอยู่ ${s.deficit} คน (สาเหตุ: ${s.riskReasons?.join(", ") || "คนไม่พอ"})`).join("\n")
          : `• ปัจจุบันทุกไซต์มีกำลังคนเพียงพอตามแผนงานที่กำหนด`);
    } else if (tools.includes("getOTSummary")) {
      const ot = evidence.getOTSummary || {};
      text = `⏱️ **สรุปข้อมูลการทำงานล่วงเวลา (Overtime - OT)**\n\n` +
        `• ประจำงวด: **${ot.period || "-"}**\n` +
        `• ชั่วโมง OT รวมทั้งสิ้น: **${ot.totalOtHours || 0}** ชั่วโมง\n` +
        `• ค่าใช้จ่าย OT รวมโดยประมาณ: **${Number(ot.totalOtAmount || 0).toLocaleString()}** บาท\n` +
        (ot.topOtSites && ot.topOtSites.length > 0
          ? `• **ไซต์ที่มีการทำ OT สูงสุด**:\n` +
            ot.topOtSites.map((s: any) => `  - **${s.siteName}**: ${s.otHours} ชม. (ประมาณ ${Number(s.otAmount).toLocaleString()} บาท)`).join("\n")
          : "");
    } else if (tools.includes("getLaborCostSummary")) {
      const lc = evidence.getLaborCostSummary || {};
      text = `💰 **สรุปต้นทุนค่าแรงและค่าล่วงเวลาภาพรวม (Labor Cost Summary)**\n\n` +
        `• ประจำงวด: **${lc.period || "-"}**\n` +
        `• จำนวนบุคลากรที่ประมวลผล: ${lc.totalHeadcount || 0} คน\n` +
        `• **ต้นทุนค่าแรงรวมทั้งหมด**: **${Number(lc.totalLaborCost || 0).toLocaleString()}** บาท\n` +
        `  - เงินเดือนพื้นฐาน: ${Number(lc.baseSalaryTotal || 0).toLocaleString()} บาท\n` +
        `  - ค่าทำงานล่วงเวลา (OT): ${Number(lc.otTotal || 0).toLocaleString()} บาท (${lc.otPercentage || 0}% ของค่าแรงรวม)\n\n` +
        `*(หมายเหตุ: แสดงผลรวมระดับภาพรวมองค์กรตามสิทธิ์ความปลอดภัย ไม่เปิดเผยเงินเดือนรายบุคคล)*`;
    } else if (tools.includes("getAttendanceExceptions")) {
      const ex = evidence.getAttendanceExceptions || {};
      text = `⚠️ **รายการตรวจสอบความผิดปกติของการลงเวลา (Attendance Exceptions)**\n\n` +
        `• พบรายการที่อยู่นอกเงื่อนไข: **${ex.totalExceptions || 0}** รายการ\n` +
        (ex.exceptions && ex.exceptions.length > 0
          ? `• ตัวอย่างรายการที่ควรตรวจสอบ (เช่น ลงเวลานอก Geofence):\n` +
            ex.exceptions.slice(0, 5).map((e: any) => `  - ไซต์ ${e.siteName}: ระยะห่าง ${e.distanceMeters} เมตร ตำแหน่ง: ${e.position}`).join("\n") +
            `\n\n*ข้อแนะนำ: ฝ่ายบุคคล/หัวหน้างานควรตรวจสอบพิกัด GPS หรืออุปกรณ์บันทึกเวลาที่หน้างาน*`
          : `• ไม่พบความผิดปกติด้าน Geofence ในวันที่เลือก`);
    } else if (tools.includes("getOperationsAlerts")) {
      const al = evidence.getOperationsAlerts || {};
      text = `🚨 **การแจ้งเตือนปฏิบัติการ (Operations Alerts)**\n\n` +
        `• พบการแจ้งเตือนทั้งหมด: **${al.totalAlerts || 0}** รายการ\n` +
        (al.alerts && al.alerts.length > 0
          ? al.alerts.slice(0, 5).map((a: any) => `• [${a.severity}] **${a.siteName}**: ${a.title || a.message}`).join("\n")
          : `• ขณะนี้ไม่มีการแจ้งเตือนความผิดปกติในระบบ`);
    } else if (tools.includes("getLiveOperations") || tools.includes("getSiteStatus")) {
      const live = evidence.getLiveOperations || evidence.getSiteStatus || {};
      if (live.site) {
        const s = live.site;
        text = `📍 **สถานะปัจจุบันของไซต์ ${s.name} (${s.code})**\n\n` +
          `• สถานะไซต์: **${s.status}**\n` +
          `• พนักงานที่กำลังทำงาน: **${s.working}** จากที่ได้รับมอบหมาย ${s.assigned} คน (เกณฑ์ขั้นต่ำ ${s.minimumWorkforce} คน)\n` +
          `• หัวหน้างาน (Supervisor): ${s.supervisorPresent ? "มีหัวหน้างานปฏิบัติการอยู่" : "⚠️ ไม่พบหัวหน้างานในไซต์"}\n` +
          `• มาสาย: ${s.late || 0} คน | ทำ OT: ${s.ot || 0} คน`;
      } else {
        const sum = live.summary || {};
        text = `🏢 **รายงานสถานการณ์สดหน้างาน (Live Operations)**\n\n` +
          `• **ไซต์งาน**: มีการปฏิบัติงานทั้งหมด ${sum.totalSites || 0} ไซต์ (ไซต์เปิดทำงาน ${sum.activeSites || 0}, ไซต์ว่าง ${sum.emptySites || 0}, แจ้งเตือน ${sum.alertSites || 0})\n` +
          `• **กำลังพลปัจจุบัน**: กำลังปฏิบัติงาน **${sum.totalEmployeesWorking || 0}** คน\n` +
          `• การมาสาย: ${sum.lateEmployees || 0} คน | ลา: ${sum.leaveEmployees || 0} คน | ขาด/ยังไม่ลงเวลา: ${sum.absentEmployees || 0} คน | ทำ OT: ${sum.otEmployees || 0} คน\n\n` +
          `*ข้อมูลอัปเดต ณ เวลา: ${live.dataFreshness ? new Date(live.dataFreshness).toLocaleTimeString("th-TH") : "ล่าสุด"}*`;
      }
    } else {
      text = `สวัสดีครับ ผมคือ SmartJeff AI Operations Copilot ระบบพร้อมสนับสนุนข้อมูลด้านการบริหารจัดการปฏิบัติการภาคสนาม กำลังพล ตารางกะ การลงเวลา ค่าล่วงเวลา และการจำลองสถานการณ์ความเสี่ยงหน้างาน คุณสามารถเลือกดูหัวข้อที่สนใจหรือพิมพ์คำถามได้เลยครับ`;
    }

    const latencyMs = Date.now() - startTime;
    return {
      text,
      tokensUsed: Math.ceil(text.length / 4),
      latencyMs,
      provider: this.name,
      model: "deterministic-rules-engine",
      confidence: "HIGH",
    };
  }

  async healthCheck(): Promise<AIProviderHealth> {
    return {
      status: "HEALTHY",
      provider: this.name,
      message: "Deterministic rules engine is operational with zero latency and full offline capability.",
    };
  }
}
