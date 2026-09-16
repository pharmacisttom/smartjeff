"use client";

import React from "react";
import { MapPin, ShieldCheck, UserCheck } from "lucide-react";

interface GeofenceMapProps {
  sites?: Array<{ name: string; lat: number; lng: number; radius: number }>;
  activeEmployees?: Array<{ name: string; lat: number; lng: number; time: string }>;
}

export function GeofenceMap({ sites, activeEmployees }: GeofenceMapProps) {
  return (
    <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-surface-border shadow-sm flex flex-col items-center justify-center text-white p-4">
      {/* Grid Pattern Background mockup for map */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />

      {/* Geofence Circles Representation */}
      <div className="relative z-10 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-brand-500/20 border-2 border-brand-500 flex items-center justify-center mx-auto animate-pulse">
          <MapPin className="w-8 h-8 text-brand-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">แผนที่ติดตามพื้นที่ Geofencing สด (Live Map)</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            ครอบคลุม 20 โรงงานในนิคมอุตสาหกรรมระยอง & ชลบุรี (รัศมี 200-300 เมตร)
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>นิคมฯ อมตะซิตี้ / เหมราช</span>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>อีสเทิร์นซีบอร์ด (ปลวกแดง)</span>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ท่าเรือแหลมฉบัง</span>
          </span>
        </div>
      </div>
    </div>
  );
}
