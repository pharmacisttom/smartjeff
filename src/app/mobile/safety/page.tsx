"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldAlert,
  AlertTriangle,
  Camera,
  MapPin,
  CheckCircle2,
  WifiOff,
  Send,
  Lock,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

function SafetyReportForm() {
  const searchParams = useSearchParams();
  const initialType = searchParams?.get("type") || "UNSAFE_CONDITION";

  const [reportType, setReportType] = useState(initialType);
  const [category, setCategory] = useState("PPE");
  const [severity, setSeverity] = useState("MEDIUM");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [offlineDraftCount, setOfflineDraftCount] = useState(0);

  useEffect(() => {
    // Check network status
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check offline drafts
    const saved = localStorage.getItem("smarto_safety_drafts");
    if (saved) {
      try {
        const drafts = JSON.parse(saved);
        setOfflineDraftCount(Array.isArray(drafts) ? drafts.length : 0);
      } catch (e) {}
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation(`พิกัด: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        },
        () => {
          setLocation("ระบุพิกัดอัตโนมัติไม่สำเร็จ (โปรดพิมพ์ระบุ)");
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !description) {
      alert("กรุณาระบุสถานที่และรายละเอียดเหตุการณ์");
      return;
    }

    setSubmitting(true);
    setSuccessMessage(null);

    const payload = {
      type: reportType,
      category,
      severity,
      location,
      description,
      photoUrl,
      isAnonymous,
      reportedBy: isAnonymous ? "ANONYMOUS" : "EMPLOYEE_MOBILE",
    };

    // If offline, store in localStorage
    if (isOffline) {
      const saved = localStorage.getItem("smarto_safety_drafts") || "[]";
      let drafts = [];
      try {
        drafts = JSON.parse(saved);
      } catch (e) {}
      drafts.push(payload);
      localStorage.setItem("smarto_safety_drafts", JSON.stringify(drafts));
      setOfflineDraftCount(drafts.length);
      setSubmitting(false);
      setSuccessMessage("บันทึกฉบับร่างออฟไลน์แล้ว (จะนำส่งเซิร์ฟเวอร์อัตโนมัติเมื่อออนไลน์)");
      // Clear form
      setDescription("");
      return;
    }

    // Online submission
    try {
      const endpoint = reportType === "INCIDENT" ? "/api/qhse/incidents" : "/api/qhse/observations";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to submit");
      }

      setSuccessMessage("รายงานของคุณถูกส่งถึงเจ้าหน้าที่ความปลอดภัย (Safety Officer) เรียบร้อยแล้ว ขอบคุณสำหรับการร่วมมือ");
      setDescription("");
      setLocation("");
      setPhotoUrl("");
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการส่งข้อมูล: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncOffline = async () => {
    const saved = localStorage.getItem("smarto_safety_drafts");
    if (!saved) return;
    try {
      const drafts = JSON.parse(saved);
      if (!Array.isArray(drafts) || drafts.length === 0) return;

      setSubmitting(true);
      const res = await fetch("/api/qhse/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: drafts }),
      });

      if (res.ok) {
        localStorage.removeItem("smarto_safety_drafts");
        setOfflineDraftCount(0);
        alert(`ซิงค์ข้อมูลออฟไลน์เรียบร้อยแล้ว (${drafts.length} รายการ)`);
      }
    } catch (e: any) {
      alert("ไม่สามารถซิงค์ได้: " + e.message);
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
          แบบรายงานความปลอดภัยหน้างาน
        </span>
        <div className="w-9" />
      </div>

      {/* Offline Status Indicator */}
      {isOffline && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-center gap-2 text-xs font-medium">
          <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>โหมดออฟไลน์: รายงานจะถูกจัดเก็บในเครื่องและส่งเมื่อมีสัญญาณอินเทอร์เน็ต</span>
        </div>
      )}

      {/* Offline Drafts Alert */}
      {offlineDraftCount > 0 && !isOffline && (
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs">
          <span className="text-blue-800 dark:text-blue-200 font-medium">
            มีรายการฉบับร่างค้างส่ง {offlineDraftCount} รายการ
          </span>
          <button
            onClick={handleSyncOffline}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            ส่งข้อมูลทันที
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">ส่งข้อมูลสำเร็จ</div>
            <div className="mt-0.5 opacity-90">{successMessage}</div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        {/* Report Type Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            ประเภทรายงาน
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setReportType("UNSAFE_CONDITION")}
              className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                reportType === "UNSAFE_CONDITION"
                  ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              สภาพอันตราย
            </button>
            <button
              type="button"
              onClick={() => setReportType("NEAR_MISS")}
              className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                reportType === "NEAR_MISS"
                  ? "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              Near Miss
            </button>
            <button
              type="button"
              onClick={() => setReportType("INCIDENT")}
              className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                reportType === "INCIDENT"
                  ? "bg-red-50 border-red-500 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              อุบัติการณ์
            </button>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            หมวดหมู่
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
          >
            <option value="PPE">อุปกรณ์ PPE ไม่พร้อม / ชำรุด</option>
            <option value="HOUSEKEEPING">ความสะอาด / สิ่งกีดขวาง (Housekeeping)</option>
            <option value="WORKING_AT_HEIGHT">การทำงานบนที่สูง</option>
            <option value="ELECTRICAL">ระบบไฟฟ้าและสายไฟ</option>
            <option value="CHEMICAL">สารเคมี / การรั่วไหล (Spill)</option>
            <option value="EQUIPMENT">เครื่องจักร / ยานพาหนะ</option>
            <option value="ENVIRONMENT">สิ่งแวดล้อม / ฝุ่น / เสียงรบกวน</option>
            <option value="OTHER">อื่นๆ</option>
          </select>
        </div>

        {/* Location with GPS */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            สถานที่เกิดเหตุ / จุดที่พบ
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="เช่น อาคาร A ชั้น 2 บริเวณบันไดหนีไฟ"
              className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              required
            />
            <button
              type="button"
              onClick={handleGetLocation}
              title="ดึงพิกัด GPS ปัจจุบัน"
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200"
            >
              <MapPin className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Severity */}
        {reportType === "INCIDENT" && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ระดับความรุนแรง
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
            >
              <option value="LOW">ต่ำ (Low) - เล็กน้อย ไม่กระทบงาน</option>
              <option value="MEDIUM">ปานกลาง (Medium) - หยุดงานชั่วขณะ ปฐมพยาบาล</option>
              <option value="HIGH">สูง (High) - บาดเจ็บ ทรัพย์สินเสียหาย</option>
              <option value="CRITICAL">วิกฤติ (Critical) - หยุดงานทันที / นำส่งโรงพยาบาล</option>
            </select>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            รายละเอียดสิ่งที่พบ
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="อธิบายเหตุการณ์หรือสภาพที่พบเห็นอย่างชัดเจน..."
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            required
          />
        </div>

        {/* Photo URL or Mock Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            ลิงก์ภาพถ่ายหลักฐาน (ถ้ามี)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://... หรือแนบไฟล์"
              className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
            <button
              type="button"
              onClick={() => setPhotoUrl("https://placehold.co/600x400/png?text=Safety+Evidence")}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-xs font-medium"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Anonymous Toggle */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                รายงานแบบไม่ระบุชื่อ (Anonymous)
              </div>
              <div className="text-[10px] text-slate-400">
                ไม่บันทึกรหัสพนักงานในประวัติ
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 rounded text-red-600"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
        >
          <Send className="w-4 h-4" />
          {submitting ? "กำลังส่ง..." : isOffline ? "บันทึกฉบับร่างออฟไลน์" : "ส่งรายงานความปลอดภัย"}
        </button>
      </form>
    </div>
  );
}

export default function MobileSafetyReportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">กำลังโหลดแบบฟอร์ม...</div>}>
      <SafetyReportForm />
    </Suspense>
  );
}
