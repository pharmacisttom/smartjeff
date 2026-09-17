"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck, Calendar, Sparkles, Send, X, AlertTriangle } from "lucide-react";
import { showSuccess, showError, showLoading, closeSwal } from "@/lib/swal";

interface LicenseRenewalModalProps {
  currentKey: string;
  expiryDate: string;
  onClose: () => void;
  onRenewSuccess: () => void;
}

export function LicenseRenewalModal({ currentKey, expiryDate, onClose, onRenewSuccess }: LicenseRenewalModalProps) {
  const [keyInput, setKeyInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      showError("กรุณากรอกรหัส License Key", "ป้อนรหัสต่อสัญญาที่คุณได้รับจากผู้พัฒนาโปรแกรม");
      return;
    }

    setSubmitting(true);
    showLoading("กำลังตรวจสอบรหัสสัญญา...", "ถอดรหัสความถูกต้องของ License Key");

    try {
      const res = await fetch("/api/admin/license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyInput }),
      });

      const data = await res.json();
      closeSwal();

      if (res.ok && data.success) {
        await showSuccess(
          "ต่ออายุสัญญาสำเร็จ! 🎉",
          data.message || `ขยายสัญญาใช้งานโปรแกรมถึงวันที่ ${data.newExpiryDate} เรียบร้อยแล้ว`
        );
        onRenewSuccess();
        onClose();
      } else {
        showError("ต่อสัญญาไม่สำเร็จ", data.message || "รหัส License Key ไม่ถูกต้อง");
      }
    } catch (e: any) {
      closeSwal();
      showError("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ตรวจสอบ License ได้");
    } finally {
      setSubmitting(false);
    }
  };

  const setDemoKey = () => {
    setKeyInput("SMARTO-RENEW-2027-KEY-89A0");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-bold text-content-primary">ต่ออายุสัญญาใช้งานโปรแกรม</h3>
          </div>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content-primary p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Info */}
        <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-content-muted">รหัสสัญญาปัจจุบัน:</span>
            <span className="font-mono font-bold text-content-primary">{currentKey}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-content-muted">วันหมดสัญญา:</span>
            <span className="font-bold text-brand-600">{expiryDate}</span>
          </div>
        </div>

        {/* Renewal Form */}
        <form onSubmit={handleRenewSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-content-secondary">
                ป้อนรหัส License Key ใหม่ (จากผู้พัฒนา)
              </label>
              <button
                type="button"
                onClick={setDemoKey}
                className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"
              >
                ⚡ ใส่รหัสสาธิต
              </button>
            </div>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="เช่น SMARTO-RENEW-2027-KEY-89A0"
              className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-surface-bg text-content-primary font-mono text-sm outline-none focus:ring-2 focus:ring-brand-500 uppercase"
              required
            />
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-[11px] text-amber-800 dark:text-amber-300 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              กรณีสัญญาสิ้นสุดลง ระบบจะทำการล็อกการใช้งานเพื่อความปลอดภัย กรุณาติดต่อผู้พัฒนาโปรแกรมเพื่อขอรับรหัสต่อสัญญาปีถัดไป
            </span>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-content-secondary hover:bg-surface-subtle"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? "กำลังเปิดใช้งาน..." : "ยืนยันต่อสัญญา"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
