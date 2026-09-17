"use client";

import { AlertTriangle, Clock, KeyRound, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LicenseExpiryBannerProps {
  remainingDays: number;
  activeDays: number;
  expiryDate: string;
  status: "ACTIVE" | "GRACE" | "EXPIRED" | "SUSPENDED" | string;
  onOpenRenewal: () => void;
}

export function LicenseExpiryBanner({
  remainingDays,
  activeDays,
  expiryDate,
  status,
  onOpenRenewal,
}: LicenseExpiryBannerProps) {
  // Color configuration according to spec:
  // <= 30 days -> Yellow
  // <= 7 days -> Orange
  // GRACE / Expired -> Red Flashing
  if (remainingDays > 30 && status === "ACTIVE") {
    return null; // Normal operation, optional to hide header banner or keep standard badge
  }

  let bannerStyle = "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200";
  let iconColor = "text-amber-600";
  let titleText = `เตือนหมดอายุสัญญาใช้งาน (เหลืออีก ${remainingDays} วัน)`;

  if (remainingDays <= 7 && remainingDays > 0) {
    bannerStyle = "bg-orange-500/15 border-orange-500/40 text-orange-950 dark:text-orange-200";
    iconColor = "text-orange-600";
    titleText = `⚠️ สัญญาใช้งานใกล้หมดอายุฉุกเฉิน (เหลือเพียง ${remainingDays} วัน)`;
  } else if (remainingDays <= 0 || status === "GRACE" || status === "EXPIRED") {
    bannerStyle = "bg-rose-500/20 border-rose-500/50 text-rose-950 dark:text-rose-200 animate-pulse";
    iconColor = "text-rose-600";
    titleText = `🚨 สัญญาหมดอายุใช้งาน (อยู่ในช่วง Grace Period ผ่อนผัน)`;
  }

  return (
    <div className={cn("p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 text-xs shadow-sm mb-4", bannerStyle)}>
      <div className="flex items-center space-x-3">
        <div className={cn("p-2 rounded-xl bg-white/60 dark:bg-black/30", iconColor)}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm">{titleText}</h4>
          <p className="opacity-80">
            ระบบเปิดใช้งานแล้ว <strong>{activeDays} วัน</strong> | ครบกำหนดสัญญา: <strong>{expiryDate}</strong> (โปรดติดต่อผู้พัฒนาโปรแกรมเพื่อขอ License Key ใหม่)
          </p>
        </div>
      </div>

      <button
        onClick={onOpenRenewal}
        className="flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold px-3.5 py-2 rounded-xl shadow transition-all whitespace-nowrap active:scale-95"
      >
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span>ใส่ License Key ต่อสัญญา</span>
      </button>
    </div>
  );
}
