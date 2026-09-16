"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, Sparkles, HelpCircle, Shield, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

const FAQ_SUGGESTIONS = [
  "ขอทราบระเบียบการลาป่วยและลากิจ",
  "เบี้ยขยันเดือนนี้คำนวณอย่างไร?",
  "วิธีเช็คอินเมื่อ GPS ไม่ตรง Geofence",
  "ขอสลิปเงินเดือนย้อนหลัง",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "สวัสดีครับ! ผมคือ AI ผู้ช่วยประจำบริษัท J2K Housekeeping ยินดีให้บริการตอบข้อสงสัยเรื่องการลงเวลา วันลา สิทธิประโยชน์ และสลิปเงินเดือนครับ มีอะไรให้ช่วยเหลือไหมครับ?",
      timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    // Simulated Intelligent HR AI Bot Response
    setTimeout(() => {
      let botReply = "ขออภัยครับ ระบบกำลังประมวลผลคำถามของคุณ คุณสามารถติดต่อฝ่าย HR โดยตรงผ่านช่องทางด่วนได้ครับ";

      if (query.includes("ลา") || query.includes("ระเบียบ")) {
        botReply = "📋 **สิทธิการลาของพนักงาน**:\n- **ลาป่วย**: ลาได้สูงสุด 30 วัน/ปี (ยื่นใบลามีใบรับรองแพทย์หากเกิน 3 วัน)\n- **ลากิจ**: ลาได้ 6 วัน/ปี ได้รับค่าจ้าง ต้องแจ้งล่วงหน้า 1 วัน\n- **พักร้อน**: สะสมได้ตามอายุงานผ่านเมนู 'ขอลา & ทำ OT' ครับ";
      } else if (query.includes("เบี้ยขยัน") || query.includes("คำนวณ")) {
        botReply = "💰 **เงื่อนไขเบี้ยขยัน 1,000 บาท/เดือน**:\n1. ไม่มาสายเกิน 3 ครั้ง/เดือน\n2. ไม่มีประวัติขาดงานหรือลากิจเกินกำหนด\n3. ลงเวลาเข้า-ออกงานตรงจุด Geofence ทุกครั้งครับ";
      } else if (query.includes("Geofence") || query.includes("GPS") || query.includes("เช็คอิน")) {
        botReply = "📍 **การลงเวลานอก Geofence**:\nหากพนักงานอยู่นอกพื้นที่ที่กำหนด ระบบจะบันทึกสถานะเป็น 'รออนุมัติ' โดยอัตโนมัติ คุณยังคงสามารถกดลงเวลาได้ปกติ และหัวหน้างานจะได้รับการแจ้งเตือนให้กดอนุมัติครับ";
      } else if (query.includes("สลิป") || query.includes("เงินเดือน")) {
        botReply = "📄 คุณสามารถเข้าดูและพิมพ์สลิปเงินเดือนย้อนหลังได้ทุกงวดที่เมนู **'สลิปเงินเดือน'** ในแถบเมนูด้านข้างได้ตลอดเวลาครับ";
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: botReply,
        timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-surface-card border border-surface-border p-4 rounded-3xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-base text-content-primary">AI ผู้ช่วย HR อัจฉริยะ</h1>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-content-muted">พร้อมตอบข้อสงสัยตลอด 24 ชั่วโมง</p>
          </div>
        </div>
      </div>

      {/* Quick FAQ Suggestion Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {FAQ_SUGGESTIONS.map((faq, i) => (
          <button
            key={i}
            onClick={() => handleSend(faq)}
            className="flex-shrink-0 text-xs font-medium bg-surface-card border border-surface-border hover:border-brand-500 hover:bg-brand-500/10 text-content-secondary px-3 py-1.5 rounded-full transition-all"
          >
            💡 {faq}
          </button>
        ))}
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto bg-surface-card border border-surface-border rounded-3xl p-4 sm:p-6 space-y-4 shadow-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex space-x-3 max-w-[85%]", msg.sender === "user" ? "ml-auto flex-row-reverse space-x-reverse" : "")}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm",
                msg.sender === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-slate-800 text-amber-300"
              )}
            >
              {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className="space-y-1">
              <div
                className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm",
                  msg.sender === "user"
                    ? "bg-brand-600 text-white rounded-tr-none font-medium"
                    : "bg-surface-subtle border border-surface-border text-content-primary rounded-tl-none"
                )}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-content-muted block px-1">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-content-muted text-xs p-2">
            <Bot className="w-4 h-4 animate-bounce text-brand-600" />
            <span>AI กำลังพิมพ์คำตอบ...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="flex items-center space-x-2 bg-surface-card border border-surface-border p-2 rounded-2xl shadow-sm">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="พิมพ์คำถามที่นี่..."
          className="flex-1 bg-transparent px-4 py-2 text-sm text-content-primary outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="p-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
