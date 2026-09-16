"use client";

import { useState } from "react";
import { MessageSquare, Send, Megaphone, Users, Bot, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showConfirm } from "@/lib/swal";

export default function AdminChatPage() {
  const [broadcastText, setBroadcastText] = useState("");
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"broadcast" | "logs">("broadcast");

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    const isConfirmed = await showConfirm(
      "ยืนยันการส่งประกาศด่วน",
      "คุณต้องการส่งข้อความแจ้งเตือนนี้ไปยังพนักงานทุกคน (42 คน) ใช่หรือไม่?",
      "ส่งประกาศ",
      "ยกเลิก"
    );

    if (!isConfirmed) return;

    showSuccess("ส่งประกาศด่วนเรียบร้อยแล้ว!", "ข้อความสแกนส่งไปยังพนักงานทุกคนในองค์กรแล้ว");
    setBroadcastText("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-purple-900 via-slate-900 to-brand-950 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-purple-300 text-xs font-semibold uppercase tracking-widest">
            <Megaphone className="w-4 h-4 text-purple-400" />
            <span>HR Broadcast & Communication Center</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">ระบบประกาศข่าวสารและสื่อสารพนักงาน</h1>
          <p className="text-sm text-slate-300">
            ส่งข้อความแจ้งเตือนสำคัญถึงพนักงานทุกคนในองค์กรแบบเรียลไทม์
          </p>
        </div>
      </div>

      {sentNotice && (
        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-800 text-sm font-medium flex items-center justify-between">
          <span className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-purple-600" />
            {sentNotice}
          </span>
        </div>
      )}

      {/* Broadcast Form Card */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-surface-border pb-3">
          <Megaphone className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-bold text-content-primary">ส่งประกาศข้อความด่วน (Broadcast Announcement)</h2>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-content-secondary mb-1">
              หัวข้อ/ข้อความประกาศถึงพนักงาน
            </label>
            <textarea
              rows={4}
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              placeholder="พิมพ์ข้อความที่ต้องการแจ้งเตือน เช่น แจ้งปรับเปลี่ยนกะงานวันหยุด หรือการรับสลิปเงินเดือนประจำงวด..."
              className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-surface-bg text-content-primary text-sm outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2 text-xs text-content-muted font-medium">
              <Users className="w-4 h-4 text-brand-600" />
              <span>ผู้รับ: พนักงานทุกคนในระบบ (42 คน)</span>
            </div>

            <button
              type="submit"
              disabled={!broadcastText.trim()}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md transition-all disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span>ส่งประกาศด่วน</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
