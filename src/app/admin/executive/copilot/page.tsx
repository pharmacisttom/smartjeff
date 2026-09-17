"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bot,
  User,
  Send,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Layers,
  FileText,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Building2,
  Calendar,
  Eye,
  Info,
} from "lucide-react";

interface EvidenceItem {
  metric: string;
  sourceModule: string;
  period: string;
  value: any;
  freshness: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
  evidence?: EvidenceItem[];
  generatedAt?: string;
  dataFreshness?: string;
  confidence?: string;
  feedbackGiven?: number; // 1 or -1
}

const SUGGESTED_QUESTIONS = [
  "สรุปเรื่องที่ผู้บริหารต้องจัดการเช้านี้",
  "วันนี้มี Site ไหนคนไม่ครบ",
  "ตอนนี้มีพนักงานทำงานอยู่กี่คน",
  "พรุ่งนี้ Site ไหนมีความเสี่ยงขาดคน",
  "ทำไม OT สัปดาห์นี้เพิ่มขึ้น",
  "มี Attendance Exception อะไรที่ HR ต้องตรวจ",
  "ค่าแรงเดือนนี้เพิ่มขึ้นจากเดือนที่แล้วเท่าไร",
  "ถ้าพรุ่งนี้ Site ขาดพนักงาน 5 คนจะเกิดผลอะไร",
];

export default function AICopilotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [selectedSiteId, setSelectedSiteId] = useState<string>("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("TODAY");
  const [sites, setSites] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [activeEvidence, setActiveEvidence] = useState<EvidenceItem[] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load available sites
  useEffect(() => {
    fetch("/api/sites")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.sites)) {
          setSites(data.sites);
        }
      })
      .catch(() => {});
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || inputQuery).trim();
    if (!q || loading) return;

    setInputQuery("");
    const userMsgId = `temp-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: "user",
        content: q,
      },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          conversationId,
          context: {
            currentSiteId: selectedSiteId !== "ALL" ? selectedSiteId : undefined,
            defaultDate: selectedPeriod === "TOMORROW" ? new Date(Date.now() + 86400000).toISOString().split("T")[0] : undefined,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (!conversationId && data.conversationId) {
          setConversationId(data.conversationId);
        }
        setMessages([
          ...newMessages,
          {
            id: data.messageId || `res-${Date.now()}`,
            role: "assistant",
            content: data.answer,
            toolsUsed: data.toolsUsed,
            evidence: data.evidence,
            generatedAt: data.generatedAt,
            dataFreshness: data.dataFreshness,
            confidence: data.confidence,
          },
        ]);
      } else {
        setMessages([
          ...newMessages,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: `⚠️ เกิดข้อผิดพลาด: ${data.error || "ไม่สามารถดึงข้อมูลได้ในขณะนี้"}`,
          },
        ]);
      }
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "⚠️ ไม่สามารถเชื่อมต่อระบบ AI Copilot ได้ กรุณาลองใหม่อีกครั้ง",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, rating: number) => {
    try {
      await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedbackGiven: rating } : m))
      );
    } catch (err) {}
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(undefined);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 border border-brand-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-content-primary flex items-center gap-2">
                SmartJeff AI Operations Copilot
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Data Grounded
                </span>
              </h1>
              <p className="text-xs text-content-secondary">
                ผู้ช่วยอัจฉริยะวิเคราะห์การปฏิบัติการภาคสนามและสนับสนุนการตัดสินใจผู้บริหาร (Thai-First & Read-Only)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border bg-surface-bg hover:bg-surface-subtle text-xs font-medium text-content-secondary transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            เริ่มการสนทนาใหม่
          </button>
        </div>
      </div>

      {/* Operational Context Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-surface-subtle p-3 rounded-xl border border-surface-border text-xs">
        <div className="flex items-center gap-1.5 text-content-muted font-medium">
          <Building2 className="w-4 h-4 text-brand-600" />
          ไซต์ที่สนใจ:
        </div>
        <select
          value={selectedSiteId}
          onChange={(e) => setSelectedSiteId(e.target.value)}
          className="px-2.5 py-1 rounded-lg border border-surface-border bg-surface-bg text-content-primary focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="ALL">ทุกไซต์งาน (All Sites)</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 text-content-muted font-medium ml-2">
          <Calendar className="w-4 h-4 text-brand-600" />
          ช่วงเวลา:
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-2.5 py-1 rounded-lg border border-surface-border bg-surface-bg text-content-primary focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="TODAY">วันนี้ (Today)</option>
          <option value="TOMORROW">พรุ่งนี้ (Tomorrow)</option>
          <option value="THIS_WEEK">สัปดาห์นี้</option>
          <option value="THIS_MONTH">เดือนนี้</option>
        </select>

        <span className="text-[11px] text-content-muted ml-auto flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          ตอบจากฐานข้อมูลจริง SmartJeff เท่านั้น · ปราศจากการเดา
        </span>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl bg-surface-subtle/50 border border-surface-border min-h-[350px]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto py-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center border border-brand-500/20">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-content-primary text-base">
                ยินดีต้อนรับสู่ AI Operations Copilot
              </h3>
              <p className="text-xs text-content-secondary mt-1">
                สอบถามข้อมูลปฏิบัติการ ตรวจสอบความพร้อมกำลังคน วิเคราะห์ OT หรือจำลองสถานการณ์ความเสี่ยงได้ด้วยภาษาธรรมชาติ
              </p>
            </div>

            {/* Suggested Question Chips */}
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1.5 rounded-full border border-surface-border bg-surface-bg hover:border-brand-500 hover:text-brand-600 text-xs text-content-secondary transition-all shadow-2xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[82%] rounded-2xl p-4 text-sm shadow-xs ${
                msg.role === "user"
                  ? "bg-brand-600 text-white rounded-br-none"
                  : "bg-surface-bg border border-surface-border text-content-primary rounded-bl-none"
              }`}
            >
              {/* Message Content */}
              <div className="whitespace-pre-line leading-relaxed">{msg.content}</div>

              {/* Tools & Evidence Footnote for Assistant */}
              {msg.role === "assistant" && msg.evidence && msg.evidence.length > 0 && (
                <div className="mt-3 pt-3 border-t border-surface-border/60 flex flex-wrap items-center justify-between gap-2 text-xs text-content-muted">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveEvidence(msg.evidence || []);
                        setDrawerOpen(true);
                      }}
                      className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      ดูหลักฐานประกอบ ({msg.evidence.length} รายการ)
                    </button>

                    {msg.confidence && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {msg.confidence} Confidence
                      </span>
                    )}
                  </div>

                  {/* Feedback Thumb Up / Down */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[11px]">คำตอบนี้มีประโยชน์ไหม?</span>
                    <button
                      onClick={() => handleFeedback(msg.id, 1)}
                      className={`p-1 rounded hover:bg-surface-subtle transition-colors ${
                        msg.feedbackGiven === 1 ? "text-emerald-600 font-bold" : "text-content-muted"
                      }`}
                      title="มีประโยชน์"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id, -1)}
                      className={`p-1 rounded hover:bg-surface-subtle transition-colors ${
                        msg.feedbackGiven === -1 ? "text-rose-600 font-bold" : "text-content-muted"
                      }`}
                      title="ต้องปรับปรุง"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-xl bg-surface-subtle border border-surface-border text-content-primary flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-surface-bg border border-surface-border rounded-2xl rounded-bl-none p-3.5 flex items-center space-x-2 text-xs text-content-secondary shadow-xs">
              <div className="w-2 h-2 rounded-full bg-brand-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-brand-600 animate-bounce [animation-delay:-.3s]" />
              <div className="w-2 h-2 rounded-full bg-brand-600 animate-bounce [animation-delay:-.5s]" />
              <span className="ml-1 font-medium">กำลังตรวจสอบหลักฐานและสังเคราะห์คำตอบ...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Questions Pills when chatting */}
      {messages.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs text-content-secondary scrollbar-none">
          {SUGGESTED_QUESTIONS.slice(0, 4).map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="whitespace-nowrap px-3 py-1 rounded-full border border-surface-border bg-surface-bg hover:bg-surface-subtle transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <div className="relative">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="พิมพ์คำถามเกี่ยวกับสถานะไซต์งาน, กำลังคน, OT, หรือจำลองสถานการณ์..."
            className="flex-1 px-4 py-3 rounded-xl border border-surface-border bg-surface-bg text-content-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-2xs"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className="px-5 py-3 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>ส่ง</span>
          </button>
        </form>
      </div>

      {/* Evidence Drawer Modal */}
      {drawerOpen && activeEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-surface-bg border border-surface-border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-content-primary text-base">
                  ข้อมูลหลักฐานประกอบการวิเคราะห์ (Evidence Grounding)
                </h3>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-xs px-2.5 py-1 rounded-lg border border-surface-border hover:bg-surface-subtle"
              >
                ปิด
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeEvidence.map((ev, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-surface-border bg-surface-subtle/60 space-y-1">
                  <div className="text-[11px] text-content-muted font-medium">{ev.sourceModule}</div>
                  <div className="text-sm font-semibold text-content-primary">{ev.metric}</div>
                  <div className="text-lg font-bold text-brand-600">
                    {typeof ev.value === "object" ? JSON.stringify(ev.value) : String(ev.value)}
                  </div>
                  <div className="text-[10px] text-content-muted pt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    งวด: {ev.period} · สดใหม่ ณ {new Date(ev.freshness).toLocaleTimeString("th-TH")}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>
                ทุกตัวเลขถูกคำนวณและดึงตรงจาก Service Layer ของ SmartJeff โดยไม่มีการคาดเดาหรือสร้างตัวเลขขึ้นเอง
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
