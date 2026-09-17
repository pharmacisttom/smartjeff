"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Send,
  Camera,
  WifiOff,
} from "lucide-react";

export default function MobileInspectionsPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, { result: string; notes: string }>>({});
  const [inspectorName, setInspectorName] = useState("SAFETY_OFFICER_1");
  const [signatureUrl, setSignatureUrl] = useState("SIGNED_DIGITALLY");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedInspection, setSubmittedInspection] = useState<any>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/qhse/inspections?templates=true");
      const data = await res.json();
      const tmpls = data.templates || [];
      setTemplates(tmpls);
      if (tmpls.length > 0) {
        selectTemplate(tmpls[0]);
      }
    } catch (err) {
      console.error("Failed to load templates", err);
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (tmpl: any) => {
    setSelectedTemplate(tmpl);
    const initialAnswers: Record<string, { result: string; notes: string }> = {};
    tmpl.items.forEach((item: any) => {
      initialAnswers[item.id] = { result: "PASS", notes: "" };
    });
    setAnswers(initialAnswers);
  };

  const handleResultChange = (itemId: string, result: string) => {
    setAnswers((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], result },
    }));
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    setAnswers((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], notes },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setSubmitting(true);
    try {
      const itemsPayload = selectedTemplate.items.map((item: any) => {
        const ans = answers[item.id] || { result: "PASS", notes: "" };
        return {
          itemId: item.id,
          question: item.question,
          answer: ans.result,
          result: ans.result,
          notes: ans.notes,
          critical: item.critical,
        };
      });

      const payload = {
        templateId: selectedTemplate.id,
        inspectorId: inspectorName,
        signatureUrl,
        items: itemsPayload,
      };

      const res = await fetch("/api/qhse/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Inspection submission failed");
      const data = await res.json();
      setSubmittedInspection(data);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 p-4 max-w-lg mx-auto space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/mobile/qhse"
          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
          การตรวจความปลอดภัยหน้างาน
        </span>
        <div className="w-9" />
      </div>

      {submittedInspection ? (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              ส่งผลการตรวจสอบสำเร็จ!
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              เลขที่การตรวจสอบ: {submittedInspection.inspectionNo}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">ผลการตรวจ:</span>
              <span
                className={`font-bold ${
                  submittedInspection.result === "PASS"
                    ? "text-emerald-600"
                    : submittedInspection.result === "WARNING"
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              >
                {submittedInspection.result}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">คะแนนการประเมิน:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {submittedInspection.score}%
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setSubmittedInspection(null);
              loadTemplates();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs"
          >
            ทำการตรวจรายการใหม่
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Selector */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              เลือกแบบฟอร์มการตรวจ (Inspection Template)
            </label>
            {templates.length > 0 ? (
              <select
                value={selectedTemplate?.id || ""}
                onChange={(e) => {
                  const tmpl = templates.find((t) => t.id === e.target.value);
                  if (tmpl) selectTemplate(tmpl);
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-slate-400">
                ยังไม่มีแม่แบบในระบบ (สามารถสร้างได้ที่แดชบอร์ดหลัก)
              </div>
            )}
          </div>

          {/* Checklist Items */}
          {selectedTemplate?.items?.map((item: any, idx: number) => {
            const ans = answers[item.id] || { result: "PASS", notes: "" };
            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-400 mr-1.5">
                      ข้อ {idx + 1}.
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {item.question}
                    </span>
                    {item.critical && (
                      <span className="ml-2 text-[10px] px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-bold">
                        CRITICAL (ห้ามตก)
                      </span>
                    )}
                  </div>
                </div>

                {item.description && (
                  <p className="text-[11px] text-slate-500">{item.description}</p>
                )}

                {/* PASS / WARN / FAIL Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleResultChange(item.id, "PASS")}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                      ans.result === "PASS"
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    ผ่าน (Pass)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResultChange(item.id, "WARNING")}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                      ans.result === "WARNING"
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    เตือน (Warn)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResultChange(item.id, "FAIL")}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                      ans.result === "FAIL"
                        ? "bg-red-500 text-white border-red-500 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    ไม่ผ่าน (Fail)
                  </button>
                </div>

                {/* Notes if not pass */}
                {ans.result !== "PASS" && (
                  <div>
                    <input
                      type="text"
                      value={ans.notes}
                      onChange={(e) => handleNotesChange(item.id, e.target.value)}
                      placeholder="ระบุข้อบกพร่องที่พบเพื่อเปิด Finding..."
                      className="w-full p-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-xs"
                      required
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !selectedTemplate}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
          >
            <ClipboardCheck className="w-5 h-5" />
            {submitting ? "กำลังส่งผลการตรวจ..." : "บันทึกและส่งผลการตรวจสอบ"}
          </button>
        </form>
      )}
    </div>
  );
}
