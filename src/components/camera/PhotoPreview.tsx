"use client";

import React from "react";
import { Check, RefreshCw, MapPin, Clock, ShieldCheck } from "lucide-react";
import { formatThaiDate, formatTime } from "@/lib/utils";

interface PhotoPreviewProps {
  dataUrl: string;
  metadata: {
    siteName: string;
    employeeName: string;
    timestamp: Date;
    lat: number;
    lng: number;
    isWithinGeofence: boolean;
  };
  onConfirm: () => void;
  onRetake: () => void;
  loading?: boolean;
}

export function PhotoPreview({
  dataUrl,
  metadata,
  onConfirm,
  onRetake,
  loading = false,
}: PhotoPreviewProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto w-full">
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border-2 border-brand-500 bg-slate-900">
        {/* Captured WebP Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt="Captured Check-in Preview" className="w-full h-full object-cover" />

        {/* Top Floating Badge */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full text-xs font-semibold text-white flex items-center space-x-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>ภาพถ่ายพร้อมลายน้ำดิจิทัล</span>
        </div>
      </div>

      {/* Metadata Info Card */}
      <div className="w-full bg-surface-bg p-4 rounded-2xl border border-surface-border space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-content-muted">ผู้เช็คอิน:</span>
          <span className="font-semibold text-content-primary">{metadata.employeeName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-content-muted">สถานที่:</span>
          <span className="font-semibold text-content-primary">{metadata.siteName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-content-muted">เวลา:</span>
          <span className="font-mono text-brand-600 font-semibold">
            {formatThaiDate(metadata.timestamp)} {formatTime(metadata.timestamp)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-content-muted">พิกัด GPS:</span>
          <span className="font-mono text-content-secondary">
            {metadata.lat.toFixed(5)}, {metadata.lng.toFixed(5)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <button
          onClick={onRetake}
          disabled={loading}
          className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border border-surface-border text-content-secondary font-semibold hover:bg-surface-subtle active-press transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>ถ่ายใหม่</span>
        </button>

        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-brand-500 text-white font-bold shadow-md hover:bg-brand-600 active-press transition-all disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>ยืนยันบันทึก</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
