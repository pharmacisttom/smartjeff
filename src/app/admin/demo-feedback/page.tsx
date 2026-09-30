"use client";

import { useEffect, useState } from "react";
import { MessageSquare, RefreshCw, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface FeedbackItem {
  id: string;
  module: string;
  feature: string;
  feedbackType: string;
  detail: string;
  customerName: string;
  organization: string;
  contact: string;
  status: string;
  createdAt: string;
}

export default function DemoFeedbackAdminPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/feedback");
      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
      }
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-brand-600" />
            <span>จัดการข้อเสนอแนะลูกค้า (Demo Feedback)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            รายการฟีเจอร์ ความต้องการเพิ่มเติม และข้อคิดเห็นที่ได้รับจากการทดลองใช้งานระบบ Demo
          </p>
        </div>
        <button
          onClick={fetchFeedback}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">กำลังโหลดรายการข้อเสนอแนะ...</div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">ยังไม่มีรายการข้อเสนอแนะในขณะนี้</p>
          <p className="text-xs text-slate-400">รายการจะปรากฏเมื่อมีผู้ใช้งานทดลองส่งข้อเสนอแนะจากระบบ Demo Banner</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200">
                    {item.module}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString("th-TH")}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{item.feedbackType}</h3>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  &quot;{item.detail}&quot;
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div>
                  <p className="font-bold text-slate-800">{item.customerName || "ไม่ระบุชื่อ"}</p>
                  <p className="text-[10px] text-slate-400">{item.organization} {item.contact ? `(${item.contact})` : ""}</p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
