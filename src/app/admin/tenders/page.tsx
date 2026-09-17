"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Building,
  CheckSquare,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export default function TendersPage() {
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTender, setSelectedTender] = useState<any | null>(null);
  const [showGoNoGoModal, setShowGoNoGoModal] = useState(false);
  const [goNoGoData, setGoNoGoData] = useState({
    decision: "GO",
    reason: "Scope fit is high, capacity available in Rayong hub, margin projected > 22%.",
    reviewedBy: "USER_DIRECTOR",
  });

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tenders");
      const json = await res.json();
      if (json.success) {
        setTenders(json.data || []);
        if (json.data?.length > 0 && !selectedTender) {
          setSelectedTender(json.data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  const handleGoNoGoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTender) return;

    try {
      const res = await fetch(`/api/tenders/${selectedTender.id}/gonogo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goNoGoData),
      });
      const json = await res.json();
      if (json.success) {
        setShowGoNoGoModal(false);
        await fetchTenders();
        const updated = await fetch(`/api/tenders/${selectedTender.id}`).then((r) => r.json());
        if (updated.success) setSelectedTender(updated.data);
      } else {
        alert(json.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-purple-600" />
            การบริหารงานประกวดราคาและประมูล (Tender Management)
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            กระบวนการ Go / No-Go Review, ตรวจสอบเช็คลิสต์เอกสารประมูล และระบบเตือน Deadline 14/7/3/1 วัน
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenders List */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 text-sm">รายการงานประมูลทั้งหมด</h2>
            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
              {tenders.length} งาน
            </span>
          </div>

          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {tenders.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs">ไม่มีรายการงานประมูล</div>
            ) : (
              tenders.map((t) => {
                const deadline = new Date(t.submissionDeadline);
                const diffDays = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isSelected = selectedTender?.id === t.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTender(t)}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      isSelected
                        ? "border-purple-500 bg-purple-50/50 shadow-xs"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span className="font-mono">{t.tenderNo}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          diffDays <= 3
                            ? "bg-red-100 text-red-700"
                            : diffDays <= 7
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {diffDays > 0 ? `เหลือ ${diffDays} วัน` : "ครบกำหนด"}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-gray-900 mt-1 line-clamp-1">{t.title}</h4>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{t.client?.name}</p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-xs">
                      <span className="font-semibold text-gray-700">
                        {t.estimatedValue ? `${t.estimatedValue.toLocaleString()} ฿` : "-"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === "GO"
                            ? "bg-emerald-100 text-emerald-800"
                            : t.status === "NO_GO"
                            ? "bg-red-100 text-red-800"
                            : t.status === "SUBMITTED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tender Detail & Checklist View */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTender ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-xs p-6 space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                      {selectedTender.tenderNo}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        selectedTender.goNoGoDecision === "GO"
                          ? "bg-emerald-100 text-emerald-700"
                          : selectedTender.goNoGoDecision === "NO_GO"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {selectedTender.goNoGoDecision ? `Decision: ${selectedTender.goNoGoDecision}` : "Reviewing"}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">{selectedTender.title}</h2>
                  <p className="text-sm text-gray-500">
                    ลูกค้า: <span className="font-semibold text-gray-700">{selectedTender.client?.name}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowGoNoGoModal(true)}
                    className="px-3.5 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition"
                  >
                    ประเมิน Go / No-Go
                  </button>
                </div>
              </div>

              {/* Deadlines & Key Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-400 block">กำหนดส่งข้อเสนอ (Submission Deadline)</span>
                  <span className="font-bold text-gray-900 text-base">
                    {new Date(selectedTender.submissionDeadline).toLocaleDateString("th-TH")}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-400 block">มูลค่างานประเมิน (Estimated Value)</span>
                  <span className="font-bold text-gray-900 text-base">
                    {selectedTender.estimatedValue ? `${selectedTender.estimatedValue.toLocaleString()} ฿` : "-"}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-400 block">วิธีการยื่นข้อเสนอ</span>
                  <span className="font-bold text-gray-900 text-base">{selectedTender.submissionMethod}</span>
                </div>
              </div>

              {/* Go/No-Go Notes if reviewed */}
              {selectedTender.goNoGoReason && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    เหตุผลการตัดสินใจ Go/No-Go ({selectedTender.goNoGoDecision}):
                  </div>
                  <p className="text-xs text-purple-800">{selectedTender.goNoGoReason}</p>
                  <p className="text-[11px] text-purple-500 pt-1">
                    อนุมัติโดย: {selectedTender.goNoGoReviewedBy} (
                    {new Date(selectedTender.goNoGoReviewedAt).toLocaleString("th-TH")})
                  </p>
                </div>
              )}

              {/* Document Checklist */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  รายการตรวจเอกสารประกวดราคา (Tender Checklist)
                </h3>

                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
                  {selectedTender.checklist?.map((chk: any) => (
                    <div key={chk.id} className="p-3 flex items-center justify-between text-sm hover:bg-gray-50/50">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            chk.status === "COMPLETED" ? "bg-emerald-500" : "bg-amber-400"
                          }`}
                        />
                        <div>
                          <div className="font-medium text-gray-800">{chk.item}</div>
                          <span className="text-xs text-gray-400 uppercase font-mono">{chk.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            chk.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {chk.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
              กรุณาเลือกงานประมูลเพื่อดูรายละเอียด
            </div>
          )}
        </div>
      </div>

      {/* Go / No-Go Review Modal */}
      {showGoNoGoModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">
              พิจารณาความพร้อม Go / No-Go สำหรับ {selectedTender?.tenderNo}
            </h3>
            <form onSubmit={handleGoNoGoSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">ผลการตัดสินใจ (Decision)</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-emerald-700">
                    <input
                      type="radio"
                      name="decision"
                      value="GO"
                      checked={goNoGoData.decision === "GO"}
                      onChange={() => setGoNoGoData({ ...goNoGoData, decision: "GO" })}
                    />
                    GO (พร้อมยื่นข้อเสนอ)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-red-700">
                    <input
                      type="radio"
                      name="decision"
                      value="NO_GO"
                      checked={goNoGoData.decision === "NO_GO"}
                      onChange={() => setGoNoGoData({ ...goNoGoData, decision: "NO_GO" })}
                    />
                    NO-GO (สละสิทธิ์)
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">เหตุผลประกอบการตัดสินใจ</label>
                <textarea
                  required
                  rows={3}
                  value={goNoGoData.reason}
                  onChange={(e) => setGoNoGoData({ ...goNoGoData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">ผู้มีอำนาจอนุมัติ (Reviewed By)</label>
                <input
                  type="text"
                  value={goNoGoData.reviewedBy}
                  onChange={(e) => setGoNoGoData({ ...goNoGoData, reviewedBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGoNoGoModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                >
                  บันทึกผลการพิจารณา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
