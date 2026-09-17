"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bot,
  User,
  Send,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
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
  Play,
  XCircle,
  ShieldCheck,
  Check,
  Lock,
  ArrowRight,
} from "lucide-react";
import Swal from "@/lib/swal";

interface EvidenceItem {
  metric: string;
  sourceModule: string;
  period: string;
  value: any;
  freshness: string;
}

interface ProposalData {
  id: string;
  proposalNumber: string;
  agentCode: string;
  actionType: string;
  resourceType: string;
  riskLevel: string;
  confirmationMode: string;
  status: string;
  previewJson: string;
  expiresAt: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
  evidence?: EvidenceItem[];
  proposal?: ProposalData;
  generatedAt?: string;
  dataFreshness?: string;
  confidence?: string;
}

const ACTION_SUGGESTIONS = [
  "ช่วยจัดคน Site A สัปดาห์หน้า",
  "ช่วยเตรียม PR วัสดุอุปกรณ์ PPE ที่ขาด",
  "จัดรถไป Site ระยองพรุ่งนี้",
  "สร้าง Work Order ติดตั้งกล้องวงจรปิด",
  "ช่วยร่าง CAPA จากอุบัติการณ์ล่าสุด",
  "เตรียม Collection Task สำหรับลูกหนี้เกินกำหนด",
  "สรุปสถานะสุขภาพระบบ SRE ล่าสุด",
];

export default function AICopilotPage() {
  const [activeTab, setActiveTab] = useState<"ASK" | "PROPOSALS" | "CATALOG">("ASK");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [processingProposalId, setProcessingProposalId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchProposals = async () => {
    try {
      const res = await fetch("/api/ai/proposals");
      const data = await res.json();
      setProposals(data.proposals || []);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

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
      // Call Phase 26 Agent Runtime endpoint
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userGoal: q,
          conversationId,
          role: "EXECUTIVE",
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMessages([
          ...newMessages,
          {
            id: `asst-${Date.now()}`,
            role: "assistant",
            content: data.explanation,
            toolsUsed: data.plan?.steps?.map((s: any) => s.toolName) || [],
            proposal: data.proposal,
            generatedAt: new Date().toLocaleTimeString("th-TH"),
            confidence: "HIGH",
          },
        ]);
        if (data.proposal) {
          fetchProposals();
        }
      } else {
        setMessages([
          ...newMessages,
          {
            id: `asst-${Date.now()}`,
            role: "assistant",
            content: data.error || data.explanation || "ไม่สามารถดำเนินการได้ในขณะนี้",
            generatedAt: new Date().toLocaleTimeString("th-TH"),
            confidence: "LOW",
          },
        ]);
      }
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: `เกิดข้อผิดพลาดในการติดต่อระบบ: ${err.message}`,
          generatedAt: new Date().toLocaleTimeString("th-TH"),
          confidence: "LOW",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProposal = async (proposalId: string) => {
    const confirm = await Swal.fire({
      title: "ยืนยันการอนุมัติ Action Proposal?",
      text: "ระบบจะทำ Revalidation ตรวจสอบสถานะทรัพยากรล่าสุด และดำเนินการตาม Action ที่กำหนด",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "อนุมัติและดำเนินการ (Approve & Execute)",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#10b981",
    });

    if (!confirm.isConfirmed) return;

    try {
      setProcessingProposalId(proposalId);
      // 1. Approve
      const appRes = await fetch(`/api/ai/proposals/${proposalId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "usr_executive" }),
      });
      const appData = await appRes.json();
      if (!appData.success) throw new Error(appData.error);

      // 2. Execute
      const execRes = await fetch(`/api/ai/proposals/${proposalId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "usr_executive" }),
      });
      const execData = await execRes.json();
      if (!execData.success) throw new Error(execData.error);

      await Swal.fire({
        icon: "success",
        title: "ดำเนินการสำเร็จ!",
        text: execData.outcome?.details?.message || "ระบบได้บันทึกและประมวลผลการกระทำเรียบร้อยแล้ว (Source: AI_ASSISTED)",
      });
      fetchProposals();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "การดำเนินการล้มเหลว",
        text: err.message,
      });
    } finally {
      setProcessingProposalId(null);
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    const { value: reason } = await Swal.fire({
      title: "ระบุเหตุผลในการปฏิเสธ",
      input: "text",
      inputPlaceholder: "เช่น ข้อมูลกำลังพลไม่สอดคล้องกับงบประมาณ...",
      showCancelButton: true,
      confirmButtonText: "ปฏิเสธข้อเสนอ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#e11d48",
    });

    if (reason === undefined) return;

    try {
      setProcessingProposalId(proposalId);
      const res = await fetch(`/api/ai/proposals/${proposalId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: "info", title: "ปฏิเสธข้อเสนอเรียบร้อย" });
        fetchProposals();
      }
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ข้อผิดพลาด", text: err.message });
    } finally {
      setProcessingProposalId(null);
    }
  };

  const renderProposalCard = (p: ProposalData) => {
    let preview: any = {};
    try {
      preview = JSON.parse(p.previewJson);
    } catch {}

    const isPending = p.status === "READY_FOR_REVIEW" || p.status === "DRAFT";

    return (
      <div
        key={p.id}
        className="mt-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-lg text-left"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {p.proposalNumber}
              </span>
              <span className="text-xs text-slate-400 font-mono">Agent: {p.agentCode}</span>
            </div>
            <h4 className="text-sm font-bold text-white tracking-tight">{preview.title || p.actionType}</h4>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
              p.riskLevel === "CRITICAL"
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                : p.riskLevel === "HIGH"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}
          >
            {p.riskLevel} RISK
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{preview.summary}</p>

        {preview.affectedRecords && preview.affectedRecords.length > 0 && (
          <div className="text-xs bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
            <span className="text-slate-400 font-medium block">รายการที่เกี่ยวข้อง ({preview.affectedRecords.length}):</span>
            <div className="space-y-0.5">
              {preview.affectedRecords.map((r: any, idx: number) => (
                <div key={idx} className="text-slate-200 text-[11px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {r.name || r.id}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            สถานะ:{" "}
            <span
              className={`font-semibold ${
                p.status === "COMPLETED"
                  ? "text-emerald-400"
                  : p.status === "REJECTED"
                  ? "text-rose-400"
                  : "text-amber-400"
              }`}
            >
              {p.status}
            </span>
          </div>

          {isPending ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRejectProposal(p.id)}
                disabled={processingProposalId === p.id}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-semibold border border-slate-700 transition"
              >
                ปฏิเสธ
              </button>
              <button
                onClick={() => handleApproveProposal(p.id)}
                disabled={processingProposalId === p.id}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                อนุมัติและทำ Action
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-500 font-medium">บันทึกเรียบร้อยแล้ว</span>
          )}
        </div>
      </div>
    );
  };

  const pendingProposalsCount = proposals.filter((p) => p.status === "READY_FOR_REVIEW" || p.status === "DRAFT").length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              SmartJeff Enterprise Action Copilot
              <span className="px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Phase 26
              </span>
            </h1>
            <p className="text-sm text-slate-400">
              ระบบ AI ผู้ช่วยวางแผน ร่างงาน และเตรียมข้อเสนอ (AI Proposes — Human Decides)
            </p>
          </div>
        </div>

        <Link
          href="/admin/ai/governance"
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
        >
          <ShieldAlert className="w-4 h-4 text-purple-400" />
          ศูนย์กำกับดูแล AI (Governance)
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("ASK")}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === "ASK" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4" /> ถาม-ตอบ & สั่งงานอัจฉริยะ
        </button>

        <button
          onClick={() => {
            setActiveTab("PROPOSALS");
            fetchProposals();
          }}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === "PROPOSALS" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" /> แผนงานและข้อเสนอรออนุมัติ
          {pendingProposalsCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold inline-flex items-center justify-center">
              {pendingProposalsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("CATALOG")}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === "CATALOG" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" /> คลังงานที่ AI ช่วยเตรียมได้
        </button>
      </div>

      {/* TAB 1: ASK & CHAT */}
      {activeTab === "ASK" && (
        <div className="space-y-4">
          {/* Quick Action Chips */}
          <div className="flex flex-wrap gap-2">
            {ACTION_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition hover:text-white flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-blue-400" />
                {s}
              </button>
            ))}
          </div>

          {/* Chat Stream Window */}
          <div className="min-h-[420px] max-h-[580px] overflow-y-auto p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            {messages.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Bot className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">SmartJeff Action Copilot พร้อมปฏิบัติงาน</h3>
                <p className="text-xs max-w-md text-slate-400">
                  พิมพ์คำสั่งภาษาธรรมชาติเพื่อขอให้ AI ช่วยวิเคราะห์ข้อมูล ร่างตารางกะ ร่างใบขอซื้อ ร่าง Work Order หรือร่าง CAPA โดยทุก Action ต้องผ่านการตรวจทานและยืนยันจากท่านก่อนเสมอ
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800/90 border border-slate-700/60 text-slate-100 shadow-md"
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.content}</p>

                    {m.proposal && renderProposalCard(m.proposal)}

                    {m.toolsUsed && m.toolsUsed.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                        <span>Tools:</span>
                        {m.toolsUsed.map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-slate-900/60 font-mono text-[10px] text-slate-300">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {m.role === "user" && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex gap-3 items-center text-xs text-slate-400 p-2">
                <Bot className="w-5 h-5 text-blue-400 animate-spin" />
                <span>AI กำลังวางแผน ประเมินความเสี่ยง และเตรียม Action Proposal...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="relative">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="พิมพ์คำสั่งหรือถามงาน เช่น ช่วยจัดคน Site A สัปดาห์หน้า หรือ ขอซื้อหมวก PPE 50 ใบ..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl py-3.5 pl-4 pr-14 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-lg"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !inputQuery.trim()}
              className="absolute right-2 top-2 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PROPOSALS INBOX */}
      {activeTab === "PROPOSALS" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Action Proposals Inbox</h2>
              <p className="text-xs text-slate-400">รายการข้อเสนอการกระทำที่ AI เตรียมไว้รอการตรวจสอบและอนุมัติจากผู้มีอำนาจ</p>
            </div>
            <button
              onClick={fetchProposals}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" /> รีเฟรช
            </button>
          </div>

          {proposals.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              ยังไม่มี Action Proposals ที่สร้างขึ้นในขณะนี้
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proposals.map((p) => renderProposalCard(p))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACTION CATALOG */}
      {activeTab === "CATALOG" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white">ขอบเขตงานที่ Specialized Agents รองรับ (Capabilities)</h2>
            <p className="text-xs text-slate-400">ตัวอย่างคำสั่งและระดับความเสี่ยงของแต่ละด้าน</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">1. Workforce & Scheduling Agent</h4>
                <span className="text-xs font-semibold text-amber-400">MEDIUM / HIGH RISK</span>
              </div>
              <p className="text-xs text-slate-400">จัดตารางกะ, ตรวจสอบวันลา, คำนวณชั่วโมง OT, ตรวจสอบพักผ่อน 11 ชม.</p>
              <button
                onClick={() => {
                  setActiveTab("ASK");
                  handleSend("ช่วยจัดคน Site A สัปดาห์หน้า");
                }}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                ทดลองสั่งงาน: "ช่วยจัดคน Site A สัปดาห์หน้า" <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">2. Procurement Agent</h4>
                <span className="text-xs font-semibold text-amber-400">MEDIUM RISK</span>
              </div>
              <p className="text-xs text-slate-400">คำนวณวัสดุขาดแคลน, ตรวจสอบสต็อก PPE, ร่างใบขอซื้อ (Draft PR)</p>
              <button
                onClick={() => {
                  setActiveTab("ASK");
                  handleSend("ช่วยเตรียม PR วัสดุอุปกรณ์ PPE ที่ขาด");
                }}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                ทดลองสั่งงาน: "ช่วยเตรียม PR วัสดุ PPE ที่ขาด" <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">3. Fleet & Logistics Agent</h4>
                <span className="text-xs font-semibold text-blue-400">LOW / MEDIUM RISK</span>
              </div>
              <p className="text-xs text-slate-400">จับคู่รถตู้และคนขับ, ตรวจสอบรอบซ่อมบำรุง, วางเส้นทางเดินทาง</p>
              <button
                onClick={() => {
                  setActiveTab("ASK");
                  handleSend("จัดรถไป Site ระยองพรุ่งนี้");
                }}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                ทดลองสั่งงาน: "จัดรถไป Site ระยองพรุ่งนี้" <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">4. QHSE Safety Agent</h4>
                <span className="text-xs font-semibold text-amber-400">MEDIUM RISK</span>
              </div>
              <p className="text-xs text-slate-400">วิเคราะห์สาเหตุเชิงลึกของอุบัติการณ์, ร่างแผนปฏิบัติการแก้ไข (CAPA)</p>
              <button
                onClick={() => {
                  setActiveTab("ASK");
                  handleSend("ช่วยร่าง CAPA จากอุบัติการณ์ล่าสุด");
                }}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                ทดลองสั่งงาน: "ช่วยร่าง CAPA จากอุบัติการณ์ล่าสุด" <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
