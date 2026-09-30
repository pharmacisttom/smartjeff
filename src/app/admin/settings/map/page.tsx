"use client";

import { useState, useEffect } from "react";
import { Settings, ShieldCheck, Activity, Key, MapPin, AlertCircle, CheckCircle2, BarChart2, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function AdminMapSettingsPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/map/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error("Failed to load map stats:", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-brand-600 text-white shadow-md">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-content-primary">ตั้งค่าการเชื่อมต่อ Longdo Map & GIS Quota</h1>
            <p className="text-xs text-content-muted mt-0.5">
              การตั้งค่า Map Provider, API Key Security, Rate Limiting และสถิติการใช้งาน Quota ประจำวัน
            </p>
          </div>
        </div>

        <Link
          href="/admin/settings/map/test"
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow flex items-center space-x-2 shrink-0"
        >
          <span>ทดสอบระบบ Longdo API Live Test</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Provider Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Card 1 */}
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-content-muted">สถานะบริการ Provider</span>
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-content-primary">Longdo Map API</div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              ✓ เปิดใช้งานแล้ว (Enabled)
            </span>
          </div>
        </div>

        {/* Status Card 2 */}
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-content-muted">การกำหนด API Keys</span>
            <Key className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-content-secondary">Browser Public Key:</span>
              <span className="font-bold text-emerald-600">Configured (OK)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-content-secondary">Server Secret Key:</span>
              <span className="font-bold text-emerald-600">Configured (OK)</span>
            </div>
          </div>
        </div>

        {/* Status Card 3 */}
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-content-muted">โควต้า REST API วันนี้</span>
            <Activity className="w-5 h-5 text-brand-600" />
          </div>
          <div className="text-2xl font-black text-content-primary">
            {stats ? stats.dailyUsageCount : 0} <span className="text-xs font-normal text-content-muted"> requests</span>
          </div>
          <div className="text-[11px] text-content-muted">
            การเตือนโควต้า: {stats ? stats.warningThresholdPercent : 80}% Threshold Alert
          </div>
        </div>
      </div>

      {/* Usage breakdown table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-content-primary text-sm">รายละเอียดการเรียกใช้งาน API Proxy (API Usage Breakdown)</h3>
          </div>
          <span className="text-xs text-content-muted">อัปเดตล่าสุด: {stats ? new Date(stats.lastCheckedAt).toLocaleTimeString("th-TH") : "-"}</span>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-content-muted animate-pulse">กำลังโหลดสถิติ...</div>
        ) : (
          <div className="divide-y divide-surface-border text-xs">
            <div className="py-2.5 flex items-center justify-between font-bold text-content-muted">
              <span>บริการ REST API (Endpoint)</span>
              <span>จำนวนครั้งที่เรียก (Requests)</span>
            </div>
            {stats?.endpointStats && Object.keys(stats.endpointStats).length > 0 ? (
              Object.entries(stats.endpointStats).map(([ep, count]) => (
                <div key={ep} className="py-2.5 flex items-center justify-between text-content-primary">
                  <span className="font-mono text-brand-600">{ep}</span>
                  <span className="font-bold">{String(count)} ครั้ง</span>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-content-muted">ยังไม่มีประวัติการเรียกใช้งาน REST API ในรอบวันปัจจุบัน</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
