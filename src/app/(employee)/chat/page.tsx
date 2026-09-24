"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  HelpCircle,
  Shield,
  FileText,
  Languages,
  Globe,
  RefreshCw,
  CheckCircle2,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

interface Message {
  id: string;
  sender: "user" | "bot" | "admin";
  senderName?: string;
  text: string;
  detectedLang?: "th" | "my" | "km" | "en";
  translation?: string;
  translationTarget?: string;
  showTranslation?: boolean;
  timestamp: string;
}

const FAQ_BY_LANG: Record<string, string[]> = {
  th: [
    "ขอทราบระเบียบการลาป่วยและลากิจ",
    "เบี้ยขยันเดือนนี้คำนวณอย่างไร?",
    "วิธีเช็คอินเมื่อ GPS ไม่ตรง Geofence",
    "ขอสลิปเงินเดือนย้อนหลัง",
  ],
  my: [
    "ခွင့်ယူခြင်းစည်းမျဉ်းများ မေးမြန်းရန်",
    "ဝီရိယကြေး မည်သို့တွက်ချက်သနည်း?",
    "GPS Geofence ပြဿနာ ဖြေရှင်းနည်း",
    "လစာစလစ်ဟောင်းများ တောင်းဆိုရန်",
  ],
  km: [
    "ច្បាប់ស្តីពីការឈប់សម្រាក",
    "របៀបគណនាប្រាក់ព្យាយាម?",
    "ការកត់ម៉ោងក្រៅ Geofence",
    "ស្នើសុំប័ណ្ណបើកប្រាក់ខែចាស់",
  ],
};

function detectScript(text: string): "th" | "my" | "km" | "en" {
  if (/[\u1000-\u109F\uAA60-\uAA7F]/.test(text)) return "my";
  if (/[\u1780-\u17FF\u19E0-\u19FF]/.test(text)) return "km";
  if (/[\u0E00-\u0E7F]/.test(text)) return "th";
  return "en";
}

export default function ChatPage() {
  const { t, locale } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text:
        locale === "my"
          ? "မင်္ဂလာပါ! ကျွန်ုပ်သည် J2K Housekeeping ၏ AI အကူအညီဖြစ်ပါသည်။ အလုပ်ချိန်မှတ်တမ်း၊ ခွင့်တောင်းခြင်းနှင့် လစာစလစ်များအကြောင်း မေးမြန်းနိုင်ပါသည်ခင်ဗျာ။"
          : locale === "km"
          ? "ជម្រាបសួរ! ខ្ញុំជាជំនួយការ AI របស់ក្រុមហ៊ុន J2K Housekeeping រីករាយក្នុងការជួយឆ្លើយសំណួរអំពីវត្តមាន ការសុំច្បាប់ និងប័ណ្ណបើកប្រាក់ខែ។"
          : "สวัสดีครับ! ผมคือ AI ผู้ช่วยประจำบริษัท J2K Housekeeping ยินดีให้บริการตอบข้อสงสัยเรื่องการลงเวลา วันลา สิทธิประโยชน์ และสลิปเงินเดือนครับ มีอะไรให้ช่วยเหลือไหมครับ?",
      translation:
        "สวัสดีครับ! ผมคือ AI ผู้ช่วยประจำบริษัท J2K Housekeeping ยินดีให้บริการตอบข้อสงสัยเรื่องการลงเวลา วันลา และสลิปเงินเดือนครับ",
      detectedLang: locale === "my" ? "my" : locale === "km" ? "km" : "th",
      showTranslation: locale !== "th",
      timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [translatingInput, setTranslatingInput] = useState(false);
  const [translatingMsgId, setTranslatingMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Translate specific text via API
  const translateText = async (text: string, targetLang: "th" | "my" | "km" | "en") => {
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang }),
      });
      const data = await res.json();
      return data.translatedText || text;
    } catch (e) {
      console.error("Translation error:", e);
      return text;
    }
  };

  // Quick translate the input box text before sending
  const handleTranslateInput = async (targetLang: "th" | "my" | "km") => {
    if (!input.trim()) return;
    setTranslatingInput(true);
    try {
      const translated = await translateText(input, targetLang);
      setInput(translated);
    } finally {
      setTranslatingInput(false);
    }
  };

  // Toggle or fetch translation for a specific message bubble
  const handleToggleTranslation = async (msg: Message, targetLang: "th" | "my" | "km" = "th") => {
    if (msg.translation && msg.showTranslation) {
      // Hide translation
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, showTranslation: false } : m))
      );
      return;
    }

    if (msg.translation && !msg.showTranslation) {
      // Show existing translation
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, showTranslation: true } : m))
      );
      return;
    }

    // Need to fetch translation
    setTranslatingMsgId(msg.id);
    try {
      const translated = await translateText(msg.text, targetLang);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id
            ? { ...m, translation: translated, translationTarget: targetLang, showTranslation: true }
            : m
        )
      );
    } finally {
      setTranslatingMsgId(null);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const rawQuery = textToSend || input;
    if (!rawQuery.trim()) return;

    const detected = detectScript(rawQuery);
    const msgId = Date.now().toString();

    // If sent in Burmese or Khmer, auto-translate to Thai for display
    let autoThaiTranslation = "";
    if (detected === "my" || detected === "km") {
      autoThaiTranslation = await translateText(rawQuery, "th");
    }

    const userMsg: Message = {
      id: msgId,
      sender: "user",
      text: rawQuery,
      detectedLang: detected,
      translation: autoThaiTranslation || undefined,
      translationTarget: autoThaiTranslation ? "th" : undefined,
      showTranslation: Boolean(autoThaiTranslation),
      timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    // AI HR Copilot response logic
    setTimeout(async () => {
      let botReplyThai =
        "ขออภัยครับ ระบบกำลังประมวลผลคำถามของคุณ คุณสามารถติดต่อฝ่ายบุคคล J2K ได้ที่หมายเลข 097-253-9456 ครับ";

      const queryForMatching = (autoThaiTranslation || rawQuery).toLowerCase();

      if (queryForMatching.includes("ลา") || queryForMatching.includes("ခွင့်") || queryForMatching.includes("ច្បាប់")) {
        botReplyThai =
          "📋 **ระเบียบการลาพนักงาน J2K**:\n- **ลาป่วย**: สูงสุด 30 วัน/ปี (เกิน 3 วันแนบใบรับรองแพทย์)\n- **ลากิจ**: ได้รับค่าจ้าง 6 วัน/ปี (แจ้งล่วงหน้าอย่างน้อย 1 วัน)\n- **พักร้อน**: สิทธิสะสมตามอายุงาน ขออนุมัติผ่านเมนู 'ขอลา & ทำ OT'";
      } else if (
        queryForMatching.includes("เบี้ยขยัน") ||
        queryForMatching.includes("ဝီရိယ") ||
        queryForMatching.includes("ព្យាយាម")
      ) {
        botReplyThai =
          "💰 **เงื่อนไขเบี้ยขยัน 1,000 บาท/เดือน**:\n1. ไม่มาสายเกิน 3 ครั้งในเดือนนั้น\n2. ไม่มีประวัติขาดงานหรือลากิจเกินกำหนด\n3. ลงเวลาเข้า-ออกงานตรงจุด Geofence ของไซต์งานทุกครั้ง";
      } else if (
        queryForMatching.includes("geofence") ||
        queryForMatching.includes("gps") ||
        queryForMatching.includes("เช็คอิน") ||
        queryForMatching.includes("ဆင်း") ||
        queryForMatching.includes("វត្តមាន")
      ) {
        botReplyThai =
          "📍 **การลงเวลานอก Geofence**:\nหากอยู่นอกพื้นที่ ระบบจะบันทึกสถานะเป็น 'รออนุมัติ' ให้กดถ่ายรูปและยืนยันตามปกติ หัวหน้างานประจำไซต์จะตรวจสอบและกดอนุมัติให้ครับ";
      } else if (
        queryForMatching.includes("สลิป") ||
        queryForMatching.includes("เงินเดือน") ||
        queryForMatching.includes("လစာ") ||
        queryForMatching.includes("ប្រាក់ខែ")
      ) {
        botReplyThai =
          "📄 คุณสามารถตรวจสอบรายละเอียดเงินเดือน ค่าล่วงเวลา (OT) และรายการหักได้ที่เมนู **'สลิปเงินเดือน'** ในระบบได้ตลอด 24 ชม.";
      }

      // If user's interface or message was Burmese or Khmer, translate response to their language
      let finalBotText = botReplyThai;
      let botThaiSub = "";

      if (detected === "my" || locale === "my") {
        finalBotText = await translateText(botReplyThai, "my");
        botThaiSub = botReplyThai;
      } else if (detected === "km" || locale === "km") {
        finalBotText = await translateText(botReplyThai, "km");
        botThaiSub = botReplyThai;
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: finalBotText,
        detectedLang: detected === "my" ? "my" : detected === "km" ? "km" : "th",
        translation: botThaiSub || undefined,
        translationTarget: "th",
        showTranslation: Boolean(botThaiSub),
        timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);
    }, 700);
  };

  const faqList = FAQ_BY_LANG[locale] || FAQ_BY_LANG.th;

  return (
    <div className="max-w-4xl mx-auto space-y-3 h-[calc(100vh-6.5rem)] flex flex-col font-sans pb-16 md:pb-4">
      {/* Header Banner with Language Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-surface-card border border-surface-border p-4 rounded-3xl shadow-sm gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-base text-content-primary">
                AI ผู้ช่วย HR หลายภาษา (Multilingual HR Copilot)
              </h1>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-content-muted">
              แปลภาษาอัตโนมัติ ไทย 🇹🇭 • พม่า 🇲🇲 • เขมร 🇰🇭
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <LanguageSwitcher variant="pills" />
        </div>
      </div>

      {/* Quick FAQ Suggestion Pills in Current Language */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {faqList.map((faq, i) => (
          <button
            key={i}
            onClick={() => handleSend(faq)}
            className="flex-shrink-0 text-xs font-semibold bg-surface-card border border-surface-border hover:border-brand-500 hover:bg-brand-500/10 text-content-secondary px-3.5 py-1.5 rounded-full transition-all shadow-sm active:scale-95"
          >
            💡 {faq}
          </button>
        ))}
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto bg-surface-card border border-surface-border rounded-3xl p-4 sm:p-6 space-y-4 shadow-sm">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          const isBurmese = msg.detectedLang === "my" || /[\u1000-\u109F]/.test(msg.text);
          const isKhmer = msg.detectedLang === "km" || /[\u1780-\u17FF]/.test(msg.text);

          return (
            <div
              key={msg.id}
              className={cn("flex space-x-3 max-w-[90%] sm:max-w-[80%]", isUser ? "ml-auto flex-row-reverse space-x-reverse" : "")}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-2xl flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm mt-1",
                  isUser
                    ? "bg-brand-600 text-white"
                    : "bg-slate-800 text-amber-300 border border-slate-700"
                )}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                {/* Main Message Bubble */}
                <div
                  className={cn(
                    "p-4 rounded-3xl text-sm leading-relaxed whitespace-pre-line shadow-sm relative group",
                    isUser
                      ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-tr-none font-medium"
                      : "bg-surface-subtle border border-surface-border text-content-primary rounded-tl-none"
                  )}
                >
                  <p>{msg.text}</p>

                  {/* Language Flag Badge */}
                  <div
                    className={cn(
                      "mt-2 pt-2 border-t flex items-center justify-between text-[11px]",
                      isUser ? "border-white/20 text-white/80" : "border-surface-border text-content-muted"
                    )}
                  >
                    <span className="flex items-center space-x-1 font-semibold">
                      {isBurmese ? (
                        <>
                          <span>🇲🇲 ภาษาพม่า</span>
                        </>
                      ) : isKhmer ? (
                        <>
                          <span>🇰🇭 ภาษาเขมร</span>
                        </>
                      ) : (
                        <>
                          <span>🇹🇭 ภาษาไทย</span>
                        </>
                      )}
                    </span>

                    {/* Manual Translation Trigger Button */}
                    <button
                      onClick={() => handleToggleTranslation(msg, isBurmese || isKhmer ? "th" : "my")}
                      disabled={translatingMsgId === msg.id}
                      className={cn(
                        "flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                        isUser
                          ? "bg-white/20 hover:bg-white/30 text-white"
                          : "bg-surface-card hover:bg-brand-500/10 text-brand-600 border border-surface-border"
                      )}
                    >
                      <Languages className="w-3 h-3" />
                      <span>
                        {translatingMsgId === msg.id
                          ? "กำลังแปล..."
                          : msg.showTranslation
                          ? "ซ่อนคำแปล"
                          : isBurmese || isKhmer
                          ? "แปลเป็นไทย 🇹🇭"
                          : "แปลภาษา 🌐"}
                      </span>
                    </button>
                  </div>

                  {/* Translated Box (Inline) */}
                  {msg.showTranslation && msg.translation && (
                    <div
                      className={cn(
                        "mt-2 p-3 rounded-2xl text-xs font-normal border transition-all",
                        isUser
                          ? "bg-black/20 border-white/20 text-white"
                          : "bg-brand-50/70 dark:bg-brand-950/40 border-brand-500/30 text-brand-900 dark:text-brand-200"
                      )}
                    >
                      <div className="flex items-center space-x-1 text-[10px] font-bold text-amber-300 dark:text-amber-400 mb-1">
                        <Globe className="w-3 h-3" />
                        <span>
                          {msg.translationTarget === "th"
                            ? "คำแปลภาษาไทย (Thai Translation)"
                            : "คำแปล (Translation)"}
                          :
                        </span>
                      </div>
                      <p className="whitespace-pre-line leading-relaxed">{msg.translation}</p>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-content-muted block px-1">{msg.timestamp}</span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center space-x-2 text-content-muted text-xs p-2">
            <Bot className="w-4 h-4 animate-bounce text-brand-600" />
            <span>AI กำลังประมวลผลและตอบคำถาม...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pre-Send Translation Bar (Admin / User Quick Translator) */}
      <div className="bg-surface-card border border-surface-border p-2.5 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-content-secondary">
            <Languages className="w-4 h-4 text-brand-500" />
            <span>แปลข้อความก่อนส่ง (Quick Translation):</span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => handleTranslateInput("my")}
              disabled={translatingInput || !input.trim()}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition-all active:scale-95 disabled:opacity-40"
              title="แปลข้อความเป็นภาษาพม่าก่อนส่ง"
            >
              🇲🇲 แปลเป็นพม่า
            </button>
            <button
              type="button"
              onClick={() => handleTranslateInput("km")}
              disabled={translatingInput || !input.trim()}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20 transition-all active:scale-95 disabled:opacity-40"
              title="แปลข้อความเป็นภาษาเขมรก่อนส่ง"
            >
              🇰🇭 แปลเป็นเขมร
            </button>
            <button
              type="button"
              onClick={() => handleTranslateInput("th")}
              disabled={translatingInput || !input.trim()}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 transition-all active:scale-95 disabled:opacity-40"
              title="แปลข้อความเป็นภาษาไทยก่อนส่ง"
            >
              🇹🇭 แปลเป็นไทย
            </button>
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={
              locale === "my"
                ? "ဤနေရာတွင် မေးခွန်းရိုက်ထည့်ပါ..."
                : locale === "km"
                ? "វាយសំណួរនៅទីនេះ..."
                : "พิมพ์ข้อความสอบถาม (รองรับทั้งภาษาไทย, พม่า, เขมร)..."
            }
            className="flex-1 bg-surface-subtle px-4 py-2.5 rounded-xl text-sm text-content-primary outline-none border border-surface-border focus:border-brand-500 transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all disabled:opacity-40 shadow-sm active:scale-95 flex items-center justify-center flex-shrink-0"
            title="ส่งข้อความ"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
