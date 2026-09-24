import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function detectLanguage(text: string): "th" | "my" | "km" | "en" {
  if (/[\u1000-\u109F\uAA60-\uAA7F]/.test(text)) return "my";
  if (/[\u1780-\u17FF\u19E0-\u19FF]/.test(text)) return "km";
  if (/[\u0E00-\u0E7F]/.test(text)) return "th";
  return "en";
}

// Fallback dictionary for common SmartJeff / J2K operational keywords
const DICTIONARY_FALLBACK: Record<string, { th: string; my: string; km: string; en: string }> = {
  ot: { th: "ค่าล่วงเวลา (OT)", my: "အချိန်ပိုကြေး (OT)", km: "ថ្លៃថែមម៉ោង (OT)", en: "Overtime (OT)" },
  leave: { th: "ลางาน", my: "ခွင့်ယူခြင်း", km: "សុំច្បាប់ឈប់", en: "Leave" },
  payslip: { th: "สลิปเงินเดือน", my: "လစာစလစ်", km: "ប័ណ្ណបើកប្រាក់ខែ", en: "Payslip" },
  checkin: { th: "ลงเวลาเข้างาน", my: "အလုပ်ဝင်မှတ်ခြင်း", km: "កត់ម៉ោងចូលធ្វើការ", en: "Check in" },
  checkout: { th: "ลงเวลาออกงาน", my: "အလုပ်ဆင်းမှတ်ခြင်း", km: "កត់ម៉ោងចេញពីការងារ", en: "Check out" },
  diligence: { th: "เบี้ยขยัน", my: "ဝီရိယကြေး", km: "ប្រាក់ព្យាយាម", en: "Diligence Allowance" },
  salary: { th: "เงินเดือน", my: "လစာ", km: "ប្រាក់ខែ", en: "Salary" },
  supervisor: { th: "หัวหน้างาน", my: "ကြီးကြပ်ရေးမှူး / ခေါင်းဆောင်", km: "ប្រធានក្រុម / មេការ", en: "Supervisor" },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body.text ? String(body.text).trim() : "";
    let targetLang = body.targetLang as "th" | "my" | "km" | "en" | undefined;
    let sourceLang = body.sourceLang as string | undefined;

    if (!text) {
      return NextResponse.json({ success: false, error: "Missing text" }, { status: 400 });
    }

    const detectedLang = detectLanguage(text);

    // If targetLang is not explicitly provided, smart auto-target:
    // If text is in Burmese or Khmer, translate to Thai
    // If text is in Thai, translate to Burmese or specified target
    if (!targetLang) {
      if (detectedLang === "my" || detectedLang === "km") {
        targetLang = "th";
      } else {
        targetLang = "my";
      }
    }

    // If source and target are the same, return as is
    if (detectedLang === targetLang) {
      return NextResponse.json({
        success: true,
        originalText: text,
        translatedText: text,
        detectedSourceLang: detectedLang,
        targetLang,
      });
    }

    // Fetch from translation service
    const sl = sourceLang || "auto";
    const tl = targetLang;
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sl}&tl=${tl}&q=${encodeURIComponent(
      text
    )}`;

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const data = await res.json();
        // data structure: [ [ translatedString, detectedSource ] ] or [ translatedString ]
        let result = "";
        if (Array.isArray(data)) {
          if (Array.isArray(data[0])) {
            result = data[0][0] || "";
          } else if (typeof data[0] === "string") {
            result = data[0];
          }
        }

        if (result && result.trim()) {
          return NextResponse.json({
            success: true,
            originalText: text,
            translatedText: result.trim(),
            detectedSourceLang: detectedLang,
            targetLang,
          });
        }
      }
    } catch (apiErr) {
      console.warn("External translation API error:", apiErr);
    }

    // Fallback: Check dictionary matching
    const lower = text.toLowerCase();
    for (const [key, mapping] of Object.entries(DICTIONARY_FALLBACK)) {
      if (lower.includes(key) || text.includes(mapping.th) || text.includes(mapping.my) || text.includes(mapping.km)) {
        return NextResponse.json({
          success: true,
          originalText: text,
          translatedText: mapping[targetLang] || mapping.th,
          detectedSourceLang: detectedLang,
          targetLang,
          isFallback: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      originalText: text,
      translatedText: text,
      detectedSourceLang: detectedLang,
      targetLang,
      note: "Untranslated fallback",
    });
  } catch (error) {
    console.error("Translation route error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Translation failed" },
      { status: 500 }
    );
  }
}
