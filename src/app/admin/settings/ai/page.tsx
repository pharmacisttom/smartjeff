"use client";

import { useState, useEffect } from "react";
import {
  Bot,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Database,
  Lock,
  Cpu,
} from "lucide-react";

interface UsageData {
  providerHealth: {
    status: string;
    provider: string;
    message?: string;
  };
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    injectionAttempts: number;
    avgLatencyMs: number;
    positiveFeedback: number;
    negativeFeedback: number;
  };
  recentLogs: Array<{
    id: string;
    userId: string;
    category: string;
    toolsUsed: string[];
    status: string;
    latencyMs: number;
    createdAt: string;
  }>;
}

export default function AISettingsPage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/usage");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-600 border border-brand-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-content-primary">
              AI Operations Copilot & Provider Settings
            </h1>
            <p className="text-xs text-content-secondary">
              การตั้งค่าผู้ให้บริการโมเดลภาษา, นโยบายความปลอดภัย, และสถิติการใช้งานระบบ AI
            </p>
          </div>
        </div>

        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-surface-border bg-surface-bg hover:bg-surface-subtle text-xs font-medium text-content-secondary transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          รีเฟรชข้อมูล
        </button>
      </div>

      {/* Provider Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-surface-border bg-surface-bg space-y-2">
          <div className="text-xs font-medium text-content-muted flex items-center justify-between">
            <span>Provider Engine</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                data?.providerHealth?.status === "HEALTHY"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {data?.providerHealth?.status || "UNKNOWN"}
            </span>
          </div>
          <div className="text-lg font-bold text-content-primary capitalize">
            {data?.providerHealth?.provider || "Local Deterministic"}
          </div>
          <p className="text-xs text-content-secondary">
            {data?.providerHealth?.message || "ระบบสำรองทำงานเต็มประสิทธิภาพ"}
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-surface-border bg-surface-bg space-y-2">
          <div className="text-xs font-medium text-content-muted flex items-center justify-between">
            <span>Security Boundary & RBAC</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-600">Active Enforcement</div>
          <p className="text-xs text-content-secondary">
            ไม่อนุญาตให้ AI เข้าถึง Database หรือรันคำสั่ง Arbitrary SQL โดยตรง
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-surface-border bg-surface-bg space-y-2">
          <div className="text-xs font-medium text-content-muted flex items-center justify-between">
            <span>API Key Storage</span>
            <Lock className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-lg font-bold text-content-primary">Environment Secret</div>
          <p className="text-xs text-content-secondary">
            บันทึกผ่าน AI_API_KEY ใน .env โดยไม่มีการเปิดเผย Secret ผ่าน Client
          </p>
        </div>
      </div>

      {/* Usage Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-surface-border bg-surface-subtle/50 space-y-1">
          <div className="text-xs text-content-muted">คำถามทั้งหมด (Requests)</div>
          <div className="text-2xl font-bold text-content-primary">
            {data?.metrics?.totalRequests ?? 0}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-surface-border bg-surface-subtle/50 space-y-1">
          <div className="text-xs text-content-muted">เวลาตอบสนองเฉลี่ย</div>
          <div className="text-2xl font-bold text-content-primary flex items-baseline gap-1">
            <span>{data?.metrics?.avgLatencyMs ?? 0}</span>
            <span className="text-xs font-normal text-content-muted">ms</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-surface-border bg-surface-subtle/50 space-y-1">
          <div className="text-xs text-content-muted">ตรวจพบความพยายามโจมตี</div>
          <div className="text-2xl font-bold text-rose-600">
            {data?.metrics?.injectionAttempts ?? 0}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-surface-border bg-surface-subtle/50 space-y-1">
          <div className="text-xs text-content-muted">ความพึงพอใจผู้ใช้ (👍 / 👎)</div>
          <div className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
            <span>{data?.metrics?.positiveFeedback ?? 0}</span>
            <span className="text-xs text-content-muted">/</span>
            <span className="text-rose-600">{data?.metrics?.negativeFeedback ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Recent Audit Logs Table */}
      <div className="p-5 rounded-2xl border border-surface-border bg-surface-bg space-y-4 shadow-2xs">
        <h3 className="font-bold text-content-primary text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-600" />
          บันทึกการเรียกใช้งานล่าสุด (AI Audit Trail)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-surface-border text-content-muted">
                <th className="pb-2 font-medium">เวลา</th>
                <th className="pb-2 font-medium">หมวดคำถาม</th>
                <th className="pb-2 font-medium">Approved Tools ที่เรียก</th>
                <th className="pb-2 font-medium">สถานะ</th>
                <th className="pb-2 font-medium text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {data?.recentLogs && data.recentLogs.length > 0 ? (
                data.recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-subtle/50">
                    <td className="py-2.5 text-content-muted">
                      {new Date(log.createdAt).toLocaleTimeString("th-TH")}
                    </td>
                    <td className="py-2.5 font-medium text-content-primary">{log.category}</td>
                    <td className="py-2.5 text-brand-600">
                      {log.toolsUsed.length > 0 ? log.toolsUsed.join(", ") : "-"}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === "SUCCESS"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-content-secondary">
                      {log.latencyMs}ms
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-content-muted">
                    ยังไม่มีประวัติการเรียกใช้งาน AI
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
