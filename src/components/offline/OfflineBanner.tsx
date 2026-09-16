"use client";

import Link from "next/link";
import { WifiOff, AlertTriangle, RefreshCw, ChevronRight } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useQueueStats } from "@/hooks/useQueueStats";

export function OfflineBanner() {
  const { isOffline, isSlow } = useNetworkStatus();
  const { pending, syncing, refresh } = useQueueStats();

  if (!isOffline && !isSlow && pending === 0 && syncing === 0) {
    return null;
  }

  return (
    <div className="w-full bg-surface-bg border-b border-surface-border px-4 py-2 text-xs transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isOffline && (
            <span className="flex items-center space-x-1.5 font-semibold text-amber-600 dark:text-amber-400">
              <WifiOff className="w-4 h-4 animate-bounce" />
              <span>โหมดออฟไลน์: ข้อมูลจะถูกบันทึกลงอุปกรณ์ก่อน</span>
            </span>
          )}

          {!isOffline && isSlow && (
            <span className="flex items-center space-x-1.5 font-semibold text-blue-600 dark:text-blue-400">
              <AlertTriangle className="w-4 h-4" />
              <span>สัญญาณอินเทอร์เน็ตช้า</span>
            </span>
          )}

          {syncing > 0 && (
            <span className="flex items-center space-x-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>กำลังซิงค์ข้อมูลกับเซิร์ฟเวอร์...</span>
            </span>
          )}
        </div>

        {pending > 0 && (
          <Link
            href="/pending"
            className="flex items-center space-x-1 font-bold text-brand-600 dark:text-brand-400 hover:underline active-press"
          >
            <span className="bg-brand-500 text-white px-2 py-0.5 rounded-full text-[10px]">
              {pending} รายการรอซิงค์
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
