"use client";

import { useState } from "react";
import {
  Bell,
  MessageSquare,
  Send,
  Mail,
  Webhook,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Clock,
  Trash2,
  TestTube,
} from "lucide-react";
import { showSuccess, showError, showLoading, closeSwal } from "@/lib/swal";

interface NotificationChannelItem {
  id: string;
  name: string;
  type: string;
  token?: string;
  botToken?: string;
  chatId?: string;
  recipients?: string;
  events: string[];
  isActive: boolean;
  lastSent: string;
}

export default function NotificationSettingsPage() {
  const [channels, setChannels] = useState<NotificationChannelItem[]>([
    {
      id: "ch-1",
      name: "ผู้บริหารกลุ่ม LINE Notify",
      type: "LINE_NOTIFY",
      token: "LINE_NOTIFY_TOKEN_J2K_EXEC_2026",
      events: ["daily_summary", "geofence_alert"],
      isActive: true,
      lastSent: "เมื่อวานนี้ 20:00 น.",
    },
    {
      id: "ch-2",
      name: "Telegram Executive Bot",
      type: "TELEGRAM",
      botToken: "712345678:AAH_DemoTokenTelegram2026",
      chatId: "-100123456789",
      events: ["daily_summary", "ot_approval"],
      isActive: true,
      lastSent: "วันนี้ 08:30 น.",
    },
    {
      id: "ch-3",
      name: "Email Digest ผู้จัดการการเงิน",
      type: "EMAIL",
      recipients: "executives@j2khousekeeping.com",
      events: ["daily_summary", "payroll_ready"],
      isActive: true,
      lastSent: "15/09/2026 20:00 น.",
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newChannelType, setNewChannelType] = useState("LINE_NOTIFY");
  const [newChannelName, setNewChannelName] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [chatIdInput, setChatIdInput] = useState("");
  const [emailInput, setEmailInput] = useState("");

  const handleTestChannel = async (channel: any) => {
    showLoading(`กำลังทดสอบส่งแจ้งเตือน (${channel.name})...`, "ส่งข้อความสรุปผลผ่าน API");

    try {
      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: channel.type,
          token: channel.token || channel.botToken,
          chatId: channel.chatId,
          email: channel.recipients,
        }),
      });

      const data = await res.json();
      closeSwal();

      if (res.ok && data.success) {
        showSuccess("ส่งการแจ้งเตือนทดสอบสำเร็จ! 🎉", data.message);
      } else {
        showError("ส่งไม่สำเร็จ", data.message);
      }
    } catch (e: any) {
      closeSwal();
      showError("เกิดข้อผิดพลาด", e.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์แจ้งเตือนได้");
    }
  };

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) {
      showError("ข้อมูลไม่ครบถ้วน", "กรุณากรอกชื่อช่องทางแจ้งเตือน");
      return;
    }

    const newCh = {
      id: `ch-${Date.now()}`,
      name: newChannelName,
      type: newChannelType,
      token: tokenInput || "MOCK_TOKEN_2026",
      chatId: chatIdInput || "-100999888777",
      recipients: emailInput || "manager@j2k.com",
      events: ["daily_summary"],
      isActive: true,
      lastSent: "ยังไม่เคยส่ง",
    };

    setChannels([...channels, newCh]);
    setShowAddModal(false);
    setNewChannelName("");
    setTokenInput("");
    setChatIdInput("");
    setEmailInput("");
    showSuccess("เพิ่มช่องทางสำเร็จ!", `เพิ่มช่องทาง ${newChannelName} เรียบร้อยแล้ว`);
  };

  const toggleChannel = (id: string) => {
    setChannels(
      channels.map((ch) => (ch.id === id ? { ...ch, isActive: !ch.isActive } : ch))
    );
  };

  const deleteChannel = (id: string) => {
    setChannels(channels.filter((ch) => ch.id !== id));
    showSuccess("ลบช่องทางแล้ว", "ลบช่องทางแจ้งเตือนออกจากระบบเรียบร้อยแล้ว");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      {/* Executive Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 p-6 rounded-3xl text-white shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
            <Bell className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-brand-400 tracking-wider uppercase">AUTOMATION & NOTIFICATION</span>
            <h1 className="text-2xl font-black tracking-tight">ตั้งค่าช่องทางแจ้งเตือน (Multi-Channel Alerts)</h1>
            <p className="text-xs text-slate-300">
              กำหนดช่องทางส่งรายงานสรุปประจำวัน (LINE Notify, Telegram Bot, Email) ถึงผู้บริหารและหัวหน้างาน
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-lg transition-all active:scale-95 self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มช่องทางแจ้งเตือน</span>
        </button>
      </div>

      {/* Dispatch Schedule Status */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-content-primary">
            <Clock className="w-4 h-4 text-brand-600" />
            <span>กำหนดเวลาส่งสรุปผลประจำวัน (Daily Executive Report Cron): <strong>20:00 น. ทุกวัน</strong></span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            สถานะ Cron: Active ✅
          </span>
        </div>
        <p className="text-xs text-content-muted">
          ระบบจะรวบรวมข้อมูล พนักงานเข้างาน, สาย, ลา, ชั่วโมง OT รวม, ค่าใช้จ่ายประมาณการ และสร้างข้อความ AI Insight เพื่อส่งผ่านช่องทางที่เปิดใช้งานอัตโนมัติ
        </p>
      </div>

      {/* Channels List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className={`bg-surface-card border rounded-3xl p-5 space-y-4 shadow-sm transition-all ${
              ch.isActive ? "border-brand-500/30" : "border-surface-border opacity-75"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    ch.type === "LINE_NOTIFY"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : ch.type === "TELEGRAM"
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : "bg-indigo-50 text-indigo-700 border-indigo-200"
                  }`}
                >
                  {ch.type === "LINE_NOTIFY"
                    ? "📱 LINE Notify"
                    : ch.type === "TELEGRAM"
                    ? "💬 Telegram Bot"
                    : "📧 Email Digest"}
                </span>
                <h3 className="font-bold text-content-primary text-sm line-clamp-1">{ch.name}</h3>
              </div>

              <div className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={ch.isActive}
                  onChange={() => toggleChannel(ch.id)}
                  className="w-4 h-4 text-brand-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="bg-surface-subtle p-3 rounded-2xl border border-surface-border text-xs space-y-1 font-mono">
              <span className="text-content-muted block text-[11px]">การตั้งค่าการเชื่อมต่อ:</span>
              <p className="truncate text-content-primary font-semibold">
                {ch.type === "LINE_NOTIFY"
                  ? `Token: ${(ch.token || "").slice(0, 12)}...`
                  : ch.type === "TELEGRAM"
                  ? `ChatID: ${ch.chatId}`
                  : `Email: ${ch.recipients}`}
              </p>
              <span className="block text-[10px] text-content-muted">ส่งล่าสุด: {ch.lastSent}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => handleTestChannel(ch)}
                className="flex items-center space-x-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-xl transition-all active:scale-95"
              >
                <TestTube className="w-3.5 h-3.5" />
                <span>ทดสอบส่งข้อความ</span>
              </button>

              <button
                onClick={() => deleteChannel(ch.id)}
                className="p-1.5 text-content-muted hover:text-rose-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Channel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-card border border-surface-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-content-primary text-base">เพิ่มช่องทางแจ้งเตือนใหม่</h3>

            <form onSubmit={handleAddChannel} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-content-primary mb-1">เลือกประเภทช่องทาง</label>
                <select
                  value={newChannelType}
                  onChange={(e) => setNewChannelType(e.target.value)}
                  className="w-full bg-surface-subtle border border-surface-border rounded-2xl px-3 py-2 text-content-primary font-semibold"
                >
                  <option value="LINE_NOTIFY">📱 LINE Notify (แนะนำสำหรับกลุ่มไลน์บริหาร)</option>
                  <option value="TELEGRAM">💬 Telegram Bot (สำหรับ Telegram Channel/Group)</option>
                  <option value="EMAIL">📧 Email Digest (ส่งรายงาน HTML ถึงอีเมลผู้บริหาร)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-content-primary mb-1">ชื่อช่องทาง (ตั้งอ้างอิง)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ผู้บริหารกลุ่ม LINE ฝ่ายปฏิบัติการ"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full bg-surface-subtle border border-surface-border rounded-2xl px-3 py-2 text-content-primary"
                />
              </div>

              {newChannelType === "LINE_NOTIFY" && (
                <div>
                  <label className="block font-bold text-content-primary mb-1">LINE Notify Token</label>
                  <input
                    type="text"
                    required
                    placeholder="กรอก Access Token จาก notify-bot.line.me"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full bg-surface-subtle border border-surface-border rounded-2xl px-3 py-2 font-mono text-content-primary"
                  />
                </div>
              )}

              {newChannelType === "TELEGRAM" && (
                <>
                  <div>
                    <label className="block font-bold text-content-primary mb-1">Telegram Bot Token</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น 712345678:AAH_DemoToken..."
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      className="w-full bg-surface-subtle border border-surface-border rounded-2xl px-3 py-2 font-mono text-content-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-content-primary mb-1">Chat ID / Group ID</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น -100123456789"
                      value={chatIdInput}
                      onChange={(e) => setChatIdInput(e.target.value)}
                      className="w-full bg-surface-subtle border border-surface-border rounded-2xl px-3 py-2 font-mono text-content-primary"
                    />
                  </div>
                </>
              )}

              {newChannelType === "EMAIL" && (
                <div>
                  <label className="block font-bold text-content-primary mb-1">อีเมลผู้รับรายงาน</label>
                  <input
                    type="email"
                    required
                    placeholder="เช่น exec@company.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-surface-subtle border border-surface-border rounded-2xl px-3 py-2 text-content-primary"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-surface-border rounded-2xl font-bold text-content-muted"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-md"
                >
                  บันทึกช่องทาง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
