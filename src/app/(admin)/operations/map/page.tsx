"use client";

import { useState } from "react";
import { MapPin, ShieldCheck, Layers, Navigation, Users, Search, BarChart3, ChevronRight } from "lucide-react";
import { LiveEmployeeMap } from "@/components/map/LiveEmployeeMap";
import { GeofenceMap } from "@/components/map/GeofenceMap";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "live", label: "Live Map", icon: MapPin },
  { id: "geofence", label: "Geofence", icon: ShieldCheck },
];

export default function MapDemoPage() {
  const [activeTab, setActiveTab] = useState("live");

  return (
    <div className="min-h-screen bg-surface-bg font-sans">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 px-6 py-8 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-brand-400 text-xs font-bold tracking-wider uppercase mb-2">
            <MapPin className="w-4 h-4" />
            <span>Longdo Map API</span>
            <ChevronRight className="w-3 h-3 opacity-60" />
            <span>Demo</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            ระบบแผนที่ GIS & Geofencing
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            ติดตามตำแหน่งพนักงาน วาด Geofence รอบสถานที่ ค้นหา และแสดงแผนที่จราจรเรียลไทม์
          </p>

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { icon: Users, label: "Live Employee Tracking" },
              { icon: ShieldCheck, label: "Geofence Zones" },
              { icon: Navigation, label: "Traffic Layer" },
              { icon: Search, label: "Place Search" },
            ].map((f) => (
              <span
                key={f.label}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold text-white"
              >
                <f.icon className="w-3.5 h-3.5 text-brand-400" />
                {f.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-20 space-y-6">
        <div className="flex gap-2 bg-surface-card border border-surface-border rounded-2xl p-1.5 w-fit shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`map-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === tab.id
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-content-secondary hover:text-content-primary hover:bg-surface-subtle"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Live Map Tab */}
        {activeTab === "live" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <LiveEmployeeMap />
          </div>
        )}

        {/* Geofence Tab */}
        {activeTab === "geofence" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-surface-card border border-surface-border rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-surface-border pb-4">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                <div>
                  <h2 className="font-bold text-content-primary text-base">Geofence Zone Management</h2>
                  <p className="text-xs text-content-muted">วาดขอบเขตพื้นที่ Geofencing รอบๆ สถานที่ปฏิบัติงาน</p>
                </div>
              </div>

              <GeofenceMap height="h-96" />

              {/* Site list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: "นิคมฯ เหมราช ระยอง", radius: "500 เมตร", employees: 24, color: "#10b981" },
                  { name: "อมตะ ซิตี้ ระยอง", radius: "400 เมตร", employees: 18, color: "#6366f1" },
                  { name: "อีสเทิร์นซีบอร์ด ปลวกแดง", radius: "350 เมตร", employees: 12, color: "#f59e0b" },
                  { name: "ท่าเรือแหลมฉบัง", radius: "600 เมตร", employees: 8, color: "#3b82f6" },
                ].map((site) => (
                  <div
                    key={site.name}
                    className="flex items-center gap-3 p-3 bg-surface-subtle rounded-xl border border-surface-border"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
                      style={{ background: site.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-content-primary truncate">{site.name}</div>
                      <div className="text-[10px] text-content-muted">รัศมี {site.radius} · พนักงาน {site.employees} คน</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
