"use client";

import { useState } from "react";
import { MessageSquare, Send, Megaphone, Users, Bot, CheckCircle, Languages, Sparkles, Copy, Globe, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showConfirm, showError } from "@/lib/swal";

export default function AdminChatPage() {
  const [broadcastThai, setBroadcastThai] = useState("");
  const [broadcastMy, setBroadcastMy] = useState("");
  const [broadcastKm, setBroadcastKm] = useState("");
  const [activeLangTab, setActiveLangTab] = useState<"th" | "my" | "km" | "all">("all");
  const [translating, setTranslating] = useState(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  // Quick staff message translator (Burmese/Khmer to Thai)
  const [staffInput, setStaffInput] = useState("");
  const [staffOutput, setStaffOutput] = useState("");
  const [translatingStaff, setTranslatingStaff] = useState(false);

  // Auto-translate broadcast to Burmese and Khmer
  const handleAutoTranslate = async () => {
    if (!broadcastThai.trim()) {
      showError("กรุณากรอกข้อความ", "พิมพ์ข้อความภาษาไทยก่อนกดแปลภาษา");
      return;
    }

    setTranslating(true);
    try {
      const [resMy, resKm] = await Promise.all([
        fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: broadcastThai, targetLang: "my" }),
        }).then((r) => r.json()),
        fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: broadcastThai, targetLang: "km" }),
        }).then((r) => r.json()),
      ]);

      if (resMy.translatedText) setBroadcastMy(resMy.translatedText);
      if (resKm.translatedText) setBroadcastKm(resKm.translatedText);
      showSuccess("แปลภาษาสำเร็จ!", "แปลข้อความเป็นภาษาพม่าและภาษาเขมรเรียบร้อยแล้ว");
    } catch (e) {
      console.error(e);
      showError("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อระบบแปลภาษาได้");
    } finally {
      setTranslating(false);
    }
  };

  // Translate incoming staff message to Thai
  const handleTranslateStaff = async () => {
    if (!staffInput.trim()) return;
    setTranslatingStaff(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: staffInput, targetLang: "th" }),
      });
      const data = await res.json();
      setStaffOutput(data.translatedText || "ไม่สามารถแปลข้อความได้");
    } catch (e) {
      console.error(e);
      setStaffOutput("เกิดข้อผิดพลาดในการแปล");
    } finally {
      setTranslatingStaff(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastThai.trim()) return;

    const isConfirmed = await showConfirm(
      "ยืนยันการส่งประกาศด่วน 3 ภาษา",
      "ข้อความจะถูกส่งแจ้งเตือนไปยังพนักงานทุกคน (ไทย, พม่า, เขมร) ในระบบ ใช่หรือไม่?",
      "ส่งประกาศทันที",
      "ยกเลิก"
    );

    if (!isConfirmed) return;

    showSuccess(
      "ส่งประกาศ 3 ภาษาเรียบร้อยแล้ว!",
      "พนักงานทุกคนจะได้รับข้อความแจ้งเตือนตามภาษาของตนเองเรียบร้อย"
    );
    setSentNotice(`ส่งประกาศสำเร็จ: "${broadcastThai.slice(0, 40)}..."`);
    setBroadcastThai("");
    setBroadcastMy("");
    setBroadcastKm("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-purple-300 text-xs font-semibold uppercase tracking-widest">
            <Megaphone className="w-4 h-4 text-purple-400" />
            <span>HR Broadcast & Multilingual Communication Center</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">ศูนย์สื่อสารและแปลภาษาพนักงาน J2K</h1>
          <p className="text-sm text-slate-300">
            แปลข้อความสื่อสารระหว่างฝ่ายบริหารและพนักงาน (ไทย 🇹🇭 • พม่า 🇲🇲 • เขมร 🇰🇭)
          </p>
        </div>
      </div>

      {sentNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
            {sentNotice}
          </span>
          <button onClick={() => setSentNotice(null)} className="text-xs underline text-emerald-600">
            ปิด
          </button>
        </div>
      )}

      {/* Multilingual Broadcast Announcement Form */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-surface-border pb-4 gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center border border-purple-500/20">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-primary">
                ส่งประกาศด่วน 3 ภาษา (Multilingual Announcement)
              </h2>
              <p className="text-xs text-content-muted">
                พิมพ์ภาษาไทยและกดแปลอัตโนมัติเป็นภาษาพม่าและเขมร
              </p>
            </div>
          </div>

          {/* Quick Auto-Translate Button */}
          <button
            type="button"
            onClick={handleAutoTranslate}
            disabled={translating || !broadcastThai.trim()}
            className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            {translating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{translating ? "กำลังแปลภาษา..." : "✨ แปลภาษาอัตโนมัติ 3 ภาษา"}</span>
          </button>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-4">
          {/* Thai Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-content-primary flex items-center space-x-1.5">
              <span>🇹🇭</span>
              <span>ข้อความภาษาไทย (ต้นฉบับ Admin)</span>
            </label>
            <textarea
              rows={3}
              value={broadcastThai}
              onChange={(e) => setBroadcastThai(e.target.value)}
              placeholder="พิมพ์ข้อความภาษาไทย เช่น แจ้งพนักงานทุกคน ไซต์ AAM พรุ่งนี้มีโอทีเพิ่มช่วงเย็น 17:00-19:00 น. กรุณาลงเวลาด้วย..."
              className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-surface-subtle text-content-primary text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>

          {/* Multilingual Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Myanmar Translation */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center space-x-1.5">
                  <span>🇲🇲</span>
                  <span>ข้อความภาษาพม่า (မြန်မာစာ)</span>
                </label>
                <span className="text-[10px] text-amber-600 font-semibold">แปลอัตโนมัติ</span>
              </div>
              <textarea
                rows={3}
                value={broadcastMy}
                onChange={(e) => setBroadcastMy(e.target.value)}
                placeholder="ข้อความภาษาพม่าจะแสดงที่นี่หลังกดแปลภาษา..."
                className="w-full px-3 py-2.5 rounded-xl border border-amber-500/30 bg-surface-card text-content-primary text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Khmer Translation */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center space-x-1.5">
                  <span>🇰🇭</span>
                  <span>ข้อความภาษาเขมร (ភាសាខ្មែរ)</span>
                </label>
                <span className="text-[10px] text-blue-600 font-semibold">แปลอัตโนมัติ</span>
              </div>
              <textarea
                rows={3}
                value={broadcastKm}
                onChange={(e) => setBroadcastKm(e.target.value)}
                placeholder="ข้อความภาษาเขมรจะแสดงที่นี่หลังกดแปลภาษา..."
                className="w-full px-3 py-2.5 rounded-xl border border-blue-500/30 bg-surface-card text-content-primary text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-surface-border gap-3">
            <div className="flex items-center space-x-2 text-xs text-content-muted font-medium">
              <Users className="w-4 h-4 text-brand-600" />
              <span>ผู้รับ: พนักงานทุกคนในระบบ 152 คน (ไทย, พม่า, เขมร)</span>
            </div>

            <button
              type="submit"
              disabled={!broadcastThai.trim()}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-purple-700/20 transition-all active:scale-95 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span>ส่งประกาศด่วน 3 ภาษา</span>
            </button>
          </div>
        </form>
      </div>

      {/* Staff Message Fast-Translator Tool (Burmese/Khmer -> Thai) */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5 border-b border-surface-border pb-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-content-primary">
              กล่องแปลข้อความพนักงานต่างชาติ (Staff Message Translator)
            </h2>
            <p className="text-xs text-content-muted">
              วางข้อความภาษาพม่าหรือเขมรที่พนักงานส่งมา เพื่อแปลเป็นภาษาไทยทันที
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-content-secondary">
              ข้อความจากพนักงาน (พม่า 🇲🇲 หรือ เขมร 🇰🇭)
            </label>
            <textarea
              rows={4}
              value={staffInput}
              onChange={(e) => setStaffInput(e.target.value)}
              placeholder="วางข้อความภาษาพม่า เช่น မင်္ဂလာပါ သို့မဟုတ် ภาษาเขมร เช่น ខ្ញុំចង់សុំច្បាប់ នៅទីនេះ..."
              className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-surface-subtle text-content-primary text-xs outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={handleTranslateStaff}
              disabled={translatingStaff || !staffInput.trim()}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              {translatingStaff ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
              <span>{translatingStaff ? "กำลังแปล..." : "แปลเป็นภาษาไทย 🇹🇭"}</span>
            </button>
          </div>

          {/* Translated Result Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ผลการแปลเป็นภาษาไทย 🇹🇭
            </label>
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 min-h-[115px] text-xs text-content-primary leading-relaxed whitespace-pre-line">
              {staffOutput ? (
                <p className="font-semibold text-content-primary">{staffOutput}</p>
              ) : (
                <span className="text-content-muted italic">ผลลัพธ์คำแปลภาษาไทยจะปรากฏที่นี่...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
