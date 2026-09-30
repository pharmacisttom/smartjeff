"use client";

import { useState } from "react";
import { X, Send, CheckCircle2 } from "lucide-react";

interface CustomerFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultModule?: string;
}

export function CustomerFeedbackModal({
  isOpen,
  onClose,
  defaultModule = "General Showcase",
}: CustomerFeedbackModalProps) {
  const [module, setModule] = useState(defaultModule);
  const [feature, setFeature] = useState("");
  const [feedbackType, setFeedbackType] = useState("Feature Request");
  const [detail, setDetail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [organization, setOrganization] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/demo/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module,
          feature,
          feedbackType,
          detail,
          customerName,
          organization,
          contact,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          onClose();
        }, 2000);
      }
    } catch {
      // safe error state
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative text-white space-y-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>💡 ข้อเสนอแนะการพัฒนาระบบ</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            ร่วมส่งข้อเสนอแนะ ฟีเจอร์ที่ต้องการเพิ่มเติม หรือปรับปรุง workflow ให้ตรงการใช้งานจริงของคุณ
          </p>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <p className="text-base font-bold text-white">บันทึกข้อเสนอแนะเรียบร้อยแล้ว!</p>
            <p className="text-xs text-slate-400">ขอบพระคุณทีมงานที่ให้ข้อมูลอันเป็นประโยชน์ในการพัฒนาระบบ</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">โมดูล / ระบบที่สนใจ</label>
                <input
                  type="text"
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">ประเภทข้อเสนอแนะ</label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500"
                >
                  <option value="Feature Request">Feature Request (ขอฟีเจอร์ใหม่)</option>
                  <option value="UI Improvement">UI Improvement (ปรับปรุงหน้าตา)</option>
                  <option value="Workflow">Workflow (ขั้นตอนการทำงาน)</option>
                  <option value="Report">Report (รายงานสรุป)</option>
                  <option value="Integration">Integration (เชื่อมต่อระบบ)</option>
                  <option value="Bug">Bug Report (รายงานปัญหา)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">ฟีเจอร์ที่ต้องการ / คำอธิบายเพิ่มเติม</label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={3}
                placeholder="อธิบายรายละเอียดสิ่งที่ต้องการให้ระบบรองรับ..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <label className="block text-slate-400 font-medium mb-1">ชื่อผู้เสนอแนะ</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="คุณสมชาย"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">องค์กร / บริษัท</label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="บริษัท เอ บี ซี"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">เบอร์ติดต่อ / อีเมล</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="081-xxx-xxxx"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center justify-center space-x-2 transition-all mt-4 disabled:opacity-50"
            >
              <span>{submitting ? "กำลังส่งข้อมูล..." : "ส่งข้อเสนอแนะ"}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
