"use client";

import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { formatThaiDate, formatTime } from "@/lib/utils";
import { RefreshCw, CheckCircle2, AlertCircle, Clock, Trash2, ShieldCheck } from "lucide-react";

export default function PendingQueuePage() {
  const { pendingItems, isSyncing, syncNow, removeItem } = useOfflineQueue();

  const pendingCount = pendingItems.filter((i) => i.status === "pending" || i.status === "syncing").length;
  const failedCount = pendingItems.filter((i) => i.status === "failed").length;
  const syncedCount = pendingItems.filter((i) => i.status === "synced").length;

  return (
    <div className="space-y-4 max-w-md mx-auto md:max-w-4xl">
      {/* Header Banner */}
      <div className="bg-surface-bg rounded-2xl p-4 md:p-6 shadow-sm border border-surface-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-content-primary">
              คิวการซิงค์ข้อมูล (Offline Queue)
            </h1>
            <p className="text-xs md:text-sm text-content-secondary mt-1">
              รายการเช็คอินและขอลาที่บันทึกขณะไม่มีเน็ต พร้อมซิงค์เมื่อเชื่อมต่อออนไลน์
            </p>
          </div>
          <button
            onClick={() => syncNow()}
            disabled={isSyncing || pendingItems.length === 0}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-bold shadow hover:bg-brand-600 active-press transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "กำลังซิงค์..." : "ซิงค์ข้อมูลทันที"}</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-bg p-3.5 rounded-2xl border border-surface-border text-center">
          <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <span className="text-xl font-bold text-content-primary">{pendingCount}</span>
          <p className="text-[11px] text-content-muted">รอซิงค์</p>
        </div>

        <div className="bg-surface-bg p-3.5 rounded-2xl border border-surface-border text-center">
          <AlertCircle className="w-5 h-5 text-rose-500 mx-auto mb-1" />
          <span className="text-xl font-bold text-content-primary">{failedCount}</span>
          <p className="text-[11px] text-content-muted">ไม่สำเร็จ</p>
        </div>

        <div className="bg-surface-bg p-3.5 rounded-2xl border border-surface-border text-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <span className="text-xl font-bold text-content-primary">{syncedCount}</span>
          <p className="text-[11px] text-content-muted">สำเสร็จแล้ว</p>
        </div>
      </div>

      {/* Queue List */}
      <div className="bg-surface-bg rounded-2xl border border-surface-border overflow-hidden">
        <div className="p-4 border-b border-surface-border font-semibold text-sm text-content-primary">
          รายการในคิวทั้งหมด ({pendingItems.length})
        </div>

        {pendingItems.length === 0 ? (
          <div className="p-8 text-center text-content-muted text-xs space-y-2">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto opacity-80" />
            <p className="font-semibold text-content-secondary">ไม่มีคิวค้างซิงค์ ข้อมูลของคุณเป็นปัจจุบันแล้ว</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {pendingItems.map((item) => (
              <div key={item.localId} className="p-4 flex items-center justify-between text-xs hover:bg-surface-subtle transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-brand-50 text-brand-600 mt-0.5 font-bold text-[10px]">
                    {item.type}
                  </div>
                  <div>
                    <p className="font-semibold text-content-primary">
                      {formatThaiDate(item.timestamp)} {formatTime(item.timestamp)}
                    </p>
                    <p className="text-content-muted text-[11px] mt-0.5">
                      GPS: {item.lat.toFixed(4)}, {item.lng.toFixed(4)} | {item.deviceInfo}
                    </p>
                    {item.lastSyncError && (
                      <p className="text-rose-500 font-medium text-[11px] mt-1">
                        ข้อผิดพลาด: {item.lastSyncError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {item.status === "pending" && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600">
                      รอซิงค์
                    </span>
                  )}
                  {item.status === "syncing" && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 flex items-center space-x-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>กำลังซิงค์...</span>
                    </span>
                  )}
                  {item.status === "synced" && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
                      ซิงค์สำเร็จ
                    </span>
                  )}
                  {item.status === "failed" && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600">
                      ล้มเหลว
                    </span>
                  )}

                  {item.id && (
                    <button
                      onClick={() => removeItem(item.id!)}
                      className="p-1.5 text-content-muted hover:text-rose-600 rounded-lg transition-colors"
                      title="ลบออกจากคิว"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
